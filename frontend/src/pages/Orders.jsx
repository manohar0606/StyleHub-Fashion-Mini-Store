
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("http://127.0.0.1:8000/orders/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            navigate("/login");
            return;
          }

          throw new Error(data.detail || "Failed to load orders");
        }

        setOrders(data);
      } catch (error) {
        setError(error.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // Green: successful, red: failed, yellow: pending.
  const getStatusStyle = (status) => {
    const normalizedStatus = status?.toLowerCase();

    if (
      ["paid", "succeeded", "completed", "success"].includes(
        normalizedStatus
      )
    ) {
      return {
        backgroundColor: "#DCFCE7",
        color: "#166534",
        border: "1px solid #A7F3D0",
      };
    }

    if (
      [
        "failed",
        "cancelled",
        "canceled",
        "declined",
        "refunded",
      ].includes(normalizedStatus)
    ) {
      return {
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
        border: "1px solid #FECACA",
      };
    }

    return {
      backgroundColor: "#FEF3C7",
      color: "#92400E",
      border: "1px solid #FDE68A",
    };
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const statusBadgeStyle = (status) => ({
    display: "inline-block",
    padding: "8px 15px",
    borderRadius: "24px",
    fontSize: "14px",
    fontWeight: "600",
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    ...getStatusStyle(status),
  });

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "600" }}>
          Loading orders...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "14px",
            padding: "40px",
          }}
        >
          <h2
            style={{
              margin: "0 0 15px",
              fontSize: "26px",
              color: "#111",
            }}
          >
            Unable to load orders
          </h2>

          <p style={{ margin: 0, color: "#c62828", fontSize: "15px" }}>
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "11px 22px",
              border: "none",
              borderRadius: "7px",
              backgroundColor: "#111",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        backgroundColor: "#fafafa",
        padding: "55px 30px 80px",
        boxSizing: "border-box",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto 45px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            padding: 0,
            fontSize: "42px",
            lineHeight: "1.2",
            fontWeight: "700",
            color: "#111",
          }}
        >
          My Orders
        </h1>

        <p
          style={{
            margin: "12px 0 0",
            padding: 0,
            fontSize: "17px",
            lineHeight: "1.5",
            color: "#666",
          }}
        >
          Track and review your StyleHub orders.
        </p>
      </div>

      {/* Empty Orders */}
      {orders.length === 0 ? (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "14px",
            padding: "55px 30px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>
            📦
          </div>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "26px",
              lineHeight: "1.3",
              color: "#111",
            }}
          >
            No orders yet
          </h2>

          <p
            style={{
              margin: "0 0 25px",
              color: "#666",
              fontSize: "16px",
              lineHeight: "1.5",
            }}
          >
            Your completed purchases will appear here.
          </p>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 26px",
              border: "none",
              borderRadius: "7px",
              backgroundColor: "#111",
              color: "#fff",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: "14px",
                padding: "28px",
                marginBottom: "20px",
                boxShadow: "0 3px 12px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Order Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 7px",
                      color: "#777",
                      fontSize: "14px",
                    }}
                  >
                    Order
                  </p>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      lineHeight: "1.3",
                      color: "#111",
                    }}
                  >
                    #{order.id}
                  </h2>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      margin: "0 0 7px",
                      color: "#777",
                      fontSize: "14px",
                    }}
                  >
                    Order Total
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#111",
                    }}
                  >
                    ₹{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div
                style={{
                  height: "1px",
                  backgroundColor: "#eee",
                  margin: "24px 0",
                }}
              />

              {/* Order and Payment Status */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 12px",
                      color: "#777",
                      fontSize: "14px",
                    }}
                  >
                    Order Status
                  </p>

                  <span style={statusBadgeStyle(order.status)}>
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 12px",
                      color: "#777",
                      fontSize: "14px",
                    }}
                  >
                    Payment Status
                  </p>

                  <span style={statusBadgeStyle(order.payment_status)}>
                    {formatStatus(order.payment_status)}
                  </span>
                </div>
              </div>

              {/* Payment Information */}
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  backgroundColor: "#fafafa",
                  borderRadius: "8px",
                  overflowWrap: "anywhere",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#666",
                    lineHeight: "1.6",
                  }}
                >
                  Payment Reference:{" "}
                  <strong style={{ color: "#333" }}>
                    {order.stripe_payment_intent_id ||
                      "Not processed yet"}
                  </strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
