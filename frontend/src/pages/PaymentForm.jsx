
import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { stripePromise } from "../stripe.js";

const API_URL = "http://127.0.0.1:8000";

function CheckoutForm({ orderId, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please wait.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: submitError } = await elements.submit();

      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: paymentError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });

      if (paymentError) {
  const token = localStorage.getItem("access_token");

  if (token) {
    try {
      await fetch(`${API_URL}/payments/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_intent_id:
            paymentError.payment_intent?.id ||
            paymentError.paymentIntent?.id ||
            paymentIntent?.id,
        }),
      });
    } catch (error) {
      console.error(
        "Unable to update failed payment status:",
        error
      );
    }
  }

  throw new Error(
    paymentError.message || "Payment failed."
  );
}

      if (paymentIntent?.status !== "succeeded") {
        throw new Error(
          "Payment has not succeeded yet. Please check the payment status."
        );
      }

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Your session expired. Please log in again.");
      }

      // Ask our backend to verify the payment directly with Stripe.
      const response = await fetch(`${API_URL}/payments/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_intent_id: paymentIntent.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "The server could not confirm your payment."
        );
      }

      if (data.payment_status !== "succeeded") {
        throw new Error("Payment confirmation is still pending.");
      }

      onPaymentSuccess?.(data.order_id);
    } catch (err) {
      setError(
        err.message ||
          "We could not confirm the payment. Check your order before retrying."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && (
        <p
          role="alert"
          style={{
            color: "#c62828",
            marginTop: 16,
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        style={{
          width: "100%",
          marginTop: 24,
          padding: 14,
          backgroundColor: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          cursor: loading ? "wait" : "pointer",
          fontSize: 16,
          fontWeight: 600,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Verifying payment..." : "Pay securely"}
      </button>
    </form>
  );
}

function PaymentForm({ orderId, clientSecret, onPaymentSuccess }) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret }}
    >
      <CheckoutForm
        orderId={orderId}
        onPaymentSuccess={onPaymentSuccess}
      />
    </Elements>
  );
}

export default PaymentForm;
