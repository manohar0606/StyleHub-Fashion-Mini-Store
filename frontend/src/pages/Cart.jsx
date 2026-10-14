
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/cart/`, {
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

        throw new Error(data.detail || "Failed to load cart");
      }

      setCart(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setUpdatingItemId(cartItemId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/cart/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: newQuantity }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
          return;
        }

        throw new Error(data.detail || "Failed to update quantity");
      }

      await fetchCart();
    } catch (err) {
      setError(err.message || "Failed to update quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeItem = async (cartItemId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setRemovingItemId(cartItemId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/cart/${cartItemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
          return;
        }

        throw new Error(data.detail || "Failed to remove item");
      }

      await fetchCart();
    } catch (err) {
      setError(err.message || "Failed to remove item");
    } finally {
      setRemovingItemId(null);
    }
  };

  const placeOrder = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!cart || cart.items.length === 0) return;

    setPlacingOrder(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/orders/checkout`, {
        method: "POST",
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

        throw new Error(data.detail || "Failed to create order");
      }

      if (!data.id) {
        throw new Error("The server did not return an order ID.");
      }

      // Navigate to the Stripe checkout page with the pending order ID.
      navigate("/checkout", {
        state: { orderId: data.id },
      });
    } catch (err) {
      setError(err.message || "Unable to start checkout");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
        <h2 style={{ fontSize: "24px", fontWeight: "600" }}>
          Loading cart...
        </h2>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const totalPrice = Number(cart?.total_price ?? 0);

  return (
    <div style={{
      minHeight: "calc(100vh - 80px)",
      backgroundColor: "#fafafa",
      padding: "55px 30px 80px",
      boxSizing: "border-box",
    }}>
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto 45px",
        textAlign: "center",
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "42px",
          lineHeight: "1.2",
          fontWeight: "700",
          color: "#111",
        }}>
          My Cart
        </h1>

        <p style={{
          margin: "12px 0 0",
          fontSize: "17px",
          lineHeight: "1.5",
          color: "#666",
        }}>
          Review your selected fashion items.
        </p>
      </div>

      {error && (
        <div role="alert" style={{
          maxWidth: "1100px",
          margin: "0 auto 25px",
          padding: "14px 18px",
          backgroundColor: "#ffebee",
          color: "#c62828",
          borderRadius: "8px",
          textAlign: "center",
          fontSize: "15px",
        }}>
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: "14px",
          padding: "55px 30px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>
            🛍️
          </div>

          <h2 style={{
            margin: "0 0 10px",
            fontSize: "26px",
            color: "#111",
          }}>
            Your cart is empty
          </h2>

          <p style={{
            margin: "0 0 25px",
            color: "#666",
            fontSize: "16px",
            lineHeight: "1.5",
          }}>
            Add some stylish items to your cart before checking out.
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
            Continue Shopping
          </button>
        </div>
      ) : (
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(300px, 0.8fr)",
          gap: "30px",
          alignItems: "start",
        }}>
          <div>
            {items.map((item) => (
              <div key={item.id} style={{
                backgroundColor: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "20px",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "20px",
                }}>
                  <div>
                    <p style={{
                      margin: "0 0 8px",
                      fontSize: "14px",
                      color: "#777",
                      fontWeight: "600",
                    }}>
                      {item.product.category}
                    </p>

                    <h2 style={{
                      margin: "0 0 10px",
                      fontSize: "23px",
                      lineHeight: "1.3",
                      color: "#111",
                    }}>
                      {item.product.name}
                    </h2>

                    <p style={{
                      margin: 0,
                      fontSize: "17px",
                      color: "#555",
                    }}>
                      ₹{Number(item.product.price).toFixed(2)} per item
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={removingItemId === item.id}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#d32f2f",
                      cursor: removingItemId === item.id
                        ? "not-allowed"
                        : "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {removingItemId === item.id ? "Removing..." : "Remove"}
                  </button>
                </div>

                <div style={{
                  height: "1px",
                  backgroundColor: "#eee",
                  margin: "22px 0",
                }} />

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}>
                  <div>
                    <p style={{
                      margin: "0 0 8px",
                      fontSize: "14px",
                      color: "#777",
                    }}>
                      Quantity
                    </p>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #ccc",
                      borderRadius: "7px",
                      overflow: "hidden",
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updatingItemId === item.id}
                        style={{
                          width: "45px",
                          height: "42px",
                          border: "none",
                          backgroundColor: "#fff",
                          fontSize: "20px",
                          cursor: item.quantity <= 1 || updatingItemId === item.id
                            ? "not-allowed"
                            : "pointer",
                          color: "#555",
                        }}
                      >
                        −
                      </button>

                      <span style={{
                        minWidth: "45px",
                        textAlign: "center",
                        fontSize: "17px",
                        fontWeight: "600",
                      }}>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingItemId === item.id}
                        style={{
                          width: "45px",
                          height: "42px",
                          border: "none",
                          backgroundColor: "#fff",
                          fontSize: "20px",
                          cursor: updatingItemId === item.id
                            ? "not-allowed"
                            : "pointer",
                          color: "#555",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p style={{
                      margin: "0 0 8px",
                      fontSize: "14px",
                      color: "#777",
                    }}>
                      Item Total
                    </p>

                    <p style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#111",
                    }}>
                      ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "14px",
            padding: "30px",
            position: "sticky",
            top: "100px",
          }}>
            <h2 style={{
              margin: "0 0 25px",
              fontSize: "26px",
              lineHeight: "1.3",
              color: "#111",
            }}>
              Order Summary
            </h2>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              color: "#666",
              fontSize: "16px",
            }}>
              <span>Items</span>
              <span>
                {items.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </div>

            <div style={{
              height: "1px",
              backgroundColor: "#eee",
              marginBottom: "22px",
            }} />

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}>
              <span style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#333",
              }}>
                Total
              </span>

              <span style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111",
              }}>
                ₹{totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={placeOrder}
              disabled={placingOrder || items.length === 0}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "7px",
                backgroundColor: "#111",
                color: "#fff",
                cursor: placingOrder ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                opacity: placingOrder ? 0.7 : 1,
              }}
            >
              {placingOrder ? "Preparing Checkout..." : "Proceed to Payment"}
            </button>

            <p style={{
              margin: "18px 0 0",
              textAlign: "center",
              color: "#777",
              fontSize: "13px",
              lineHeight: "1.5",
            }}>
              Continue to secure payment checkout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
