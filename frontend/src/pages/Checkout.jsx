
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentForm from "./PaymentForm";

const API_URL = "http://127.0.0.1:8000";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const orderId = location.state?.orderId;

  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const createPaymentIntent = async () => {
      if (!orderId) {
        setError(
          "No pending order was selected. Return to your cart to start checkout."
        );
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/payments/create-payment-intent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order_id: orderId }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to initialize payment."
          );
        }

        if (!data.client_secret) {
          throw new Error("Stripe did not return a client secret.");
        }

        if (!cancelled) {
          setClientSecret(data.client_secret);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to initialize payment."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    createPaymentIntent();

    return () => {
      cancelled = true;
    };
  }, [orderId, navigate]);

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "50px auto",
        padding: 24,
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: 14,
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ color: "#111", marginTop: 0 }}>
        Secure Checkout
      </h1>

      <p style={{ color: "#666" }}>
        Order #{orderId ?? "—"}
      </p>

      {loading && (
        <p role="status" style={{ color: "#555" }}>
          Preparing secure checkout...
        </p>
      )}

      {error && (
        <div>
          <p
            role="alert"
            style={{
              color: "#c62828",
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            style={{
              padding: "10px 16px",
              border: "1px solid #ccc",
              borderRadius: 7,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Return to Cart
          </button>
        </div>
      )}

      {!loading && clientSecret && !error && (
        <PaymentForm
          orderId={orderId}
          clientSecret={clientSecret}
          onPaymentSuccess={() => {
            navigate("/orders", { replace: true });
          }}
        />
      )}

      {!error && (
        <button
          type="button"
          onClick={() => navigate("/cart")}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            border: "1px solid #ccc",
            borderRadius: 7,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Back to Cart
        </button>
      )}
    </main>
  );
}

export default Checkout;
