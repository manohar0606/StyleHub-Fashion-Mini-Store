
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";

const API_URL = "http://127.0.0.1:8000";

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("access_token");

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register";

  const isWelcomePage = location.pathname === "/welcome";
  const isCheckoutPage = location.pathname === "/checkout";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const linkStyle = {
    textDecoration: "none",
    color: "#333",
  };

  const brandStyle = {
    textDecoration: "none",
    color: "#111",
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "1px",
  };

  const logoutButtonStyle = {
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#fff",
    cursor: "pointer",
  };

  if (isAuthPage) {
    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          borderBottom: "1px solid #e5e5e5",
          backgroundColor: "#fff",
        }}
      >
        <Link to="/" style={{ ...brandStyle, fontSize: "28px" }}>
          StyleHub
        </Link>
      </nav>
    );
  }

  if (isWelcomePage) {
    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 30px",
          borderBottom: "1px solid #e5e5e5",
          backgroundColor: "#fff",
        }}
      >
        <Link to="/welcome" style={brandStyle}>
          StyleHub
        </Link>

        {token && (
          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        )}
      </nav>
    );
  }

  if (isCheckoutPage) {
    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 30px",
          borderBottom: "1px solid #e5e5e5",
          backgroundColor: "#fff",
        }}
      >
        <Link to="/" style={brandStyle}>
          StyleHub
        </Link>

        <span style={{ color: "#555" }}>Secure Checkout</span>
      </nav>
    );
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        padding: "16px 30px",
        borderBottom: "1px solid #e5e5e5",
        backgroundColor: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <Link to="/" style={brandStyle}>
        StyleHub
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Link to="/" style={linkStyle}>
          Products
        </Link>

        <Link to="/cart" style={linkStyle}>
          Cart
        </Link>

        <Link to="/orders" style={linkStyle}>
          Orders
        </Link>

        {!token && (
          <>
            <Link to="/login" style={linkStyle}>
              Login
            </Link>

            <Link to="/register" style={linkStyle}>
              Register
            </Link>
          </>
        )}

        {token && (
          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyToken = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (!cancelled) {
          setAuthenticated(false);
          setChecking(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("access_token");

          if (!cancelled) {
            setAuthenticated(false);
          }
          return;
        }

        if (!cancelled) {
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Checking authentication...</h2>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<Products />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
