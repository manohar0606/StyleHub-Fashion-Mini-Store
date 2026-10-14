import os
from pathlib import Path

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models import CartItem, Order, User


# Load environment variables
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/payments", tags=["Payments"])


# Request and response schemas
class PaymentIntentRequest(BaseModel):
    order_id: int = Field(..., gt=0)


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str


class PaymentConfirmationRequest(BaseModel):
    order_id: int = Field(..., gt=0)
    payment_intent_id: str = Field(..., min_length=1)


class PaymentConfirmationResponse(BaseModel):
    message: str
    order_id: int
    payment_status: str


def require_stripe():
    if not stripe.api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe is not configured.",
        )


# Create or reuse a Stripe PaymentIntent
@router.post(
    "/create-payment-intent",
    response_model=PaymentIntentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_intent(
    payment_data: PaymentIntentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_stripe()

    order = (
        db.query(Order)
        .filter(
            Order.id == payment_data.order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    if order.payment_status == "succeeded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order has already been paid.",
        )

    if order.total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order amount.",
        )

    try:
        # Reuse the existing intent if it can accept another payment method.
        if order.stripe_payment_intent_id:
            existing_intent = stripe.PaymentIntent.retrieve(
                order.stripe_payment_intent_id
            )

            if (
                existing_intent.status
                in ("requires_payment_method", "requires_confirmation")
                and existing_intent.amount
                == round(order.total_amount * 100)
                and existing_intent.currency == "inr"
            ):
                return {
                    "client_secret": existing_intent.client_secret,
                    "payment_intent_id": existing_intent.id,
                }

        # Create a new PaymentIntent when necessary.
        intent = stripe.PaymentIntent.create(
            amount=round(order.total_amount * 100),
            currency="inr",
            automatic_payment_methods={"enabled": True},
            metadata={
                "order_id": str(order.id),
                "user_id": str(current_user.id),
            },
            idempotency_key=f"stylehub-order-{order.id}-payment",
        )

        order.stripe_payment_intent_id = intent.id
        db.commit()

        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
        }

    except stripe.StripeError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to initialize Stripe payment.",
        ) from error


# Confirm a payment using Stripe's server-side record
@router.post(
    "/confirm",
    response_model=PaymentConfirmationResponse,
)
def confirm_payment(
    confirmation: PaymentConfirmationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_stripe()

    order = (
        db.query(Order)
        .filter(
            Order.id == confirmation.order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    # Make repeated confirmation requests safe.
    if order.payment_status == "succeeded":
        return {
            "message": "Payment was already confirmed.",
            "order_id": order.id,
            "payment_status": "succeeded",
        }

    # The PaymentIntent must belong to this order.
    if (
        order.stripe_payment_intent_id
        != confirmation.payment_intent_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PaymentIntent does not match this order.",
        )

    # Retrieve the authoritative payment status from Stripe.
    try:
        intent = stripe.PaymentIntent.retrieve(
            confirmation.payment_intent_id
        )
    except stripe.StripeError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to verify payment with Stripe.",
        ) from error

    # Validate PaymentIntent metadata.
    metadata = intent.metadata.to_dict()

    if (
        str(metadata.get("order_id")) != str(order.id)
        or str(metadata.get("user_id")) != str(current_user.id)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment metadata does not match this order.",
        )

    # Validate the amount and currency.
    expected_amount = round(order.total_amount * 100)

    if (
        intent.amount != expected_amount
        or intent.currency != "inr"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount or currency does not match.",
        )

    # Record a failed payment attempt only when Stripe confirms
    # that a new payment method is required.
    if intent.status == "requires_payment_method":
        try:
            order.payment_status = "failed"
            order.status = "failed"
            db.commit()
            db.refresh(order)

        except Exception as error:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to update failed payment status.",
            ) from error

        return {
            "message": "Payment failed. Please try another payment method.",
            "order_id": order.id,
            "payment_status": "failed",
        }

    # Never mark a pending or processing payment as successful.
    if intent.status != "succeeded":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Payment is not successful. "
                f"Current Stripe status: {intent.status}"
            ),
        )

    # Verify that Stripe received the complete expected amount.
    if intent.amount_received != expected_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Received payment amount does not match the order.",
        )

    # Mark the order as paid and clear the cart only after verification.
    try:
        order.payment_status = "succeeded"
        order.status = "paid"

        db.query(CartItem).filter(
            CartItem.user_id == current_user.id
        ).delete(synchronize_session=False)

        db.commit()
        db.refresh(order)

    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Payment was verified, but the order update failed. "
                "Please retry confirmation."
            ),
        ) from error

    return {
        "message": "Payment confirmed successfully.",
        "order_id": order.id,
        "payment_status": "succeeded",
    }