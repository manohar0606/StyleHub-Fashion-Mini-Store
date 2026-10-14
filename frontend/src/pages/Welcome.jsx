import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Welcome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Please login to continue.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://127.0.0.1:8000/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load user profile"
          );
        }

        setUser(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <h2>{error}</h2>

          <Link to="/login">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        backgroundColor: "#fafafa",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          width: "100%",
          textAlign: "center",
          backgroundColor: "#ffffff",
          padding: "60px 40px",
          borderRadius: "16px",
          border: "1px solid #e5e5e5",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "20px",
          }}
        >
          👋
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "0 0 15px",
            color: "#111",
          }}
        >
          Welcome back, {user.name}!
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#666",
            marginBottom: "10px",
          }}
        >
          We're happy to see you again.
        </p>

        <p
          style={{
            fontSize: "16px",
            color: "#777",
            lineHeight: "1.6",
            marginBottom: "35px",
          }}
        >
          Discover stylish fashion, explore our
          collection, and find something that fits
          your style.
        </p>

        <Link
          to="/"
          style={{
            display: "inline-block",
            padding: "13px 30px",
            backgroundColor: "#111",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "7px",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

export default Welcome;