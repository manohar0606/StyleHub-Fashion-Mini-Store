
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models import CartItem, Order, User
from ..schemas import OrderResponse


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post(
    "/checkout",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def checkout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve the current user's cart.
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )

    # Calculate the order total.
    total_amount = sum(
        item.product.price * item.quantity
        for item in cart_items
    )

    if total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order amount"
        )

    # Create a pending order.
    order = Order(
        user_id=current_user.id,
        total_amount=round(total_amount, 2),
        status="pending",
        payment_status="pending"
    )

    try:
        db.add(order)
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create order"
        )

    # IMPORTANT:
    # Keep the cart unchanged until payment is verified
    # successfully by the backend.

    return order


@router.get(
    "/",
    response_model=list[OrderResponse]
)
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
        .all()
    )

    return orders


@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_my_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    return order
