import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

/*
 * Reliable local fallback illustrations.
 * These appear if an external product photograph fails to load.
 */
function createFallbackImage(color, type) {
  const isPolo = type === "polo";

  const shirt = isPolo
    ? `
      <path
        d="M125 90 L160 65 L190 95 L220 65
           L255 90 L285 145 L250 165 L230 130
           L230 340 L150 340 L150 130
           L130 165 L95 145 Z"
        fill="${color}"
        stroke="#333333"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M160 65 L190 100 L220 65
           L205 55 L190 75 L175 55 Z"
        fill="#E8E8E8"
        stroke="#333333"
        stroke-width="3"
      />
      <path
        d="M190 100 L190 165"
        stroke="#E8E8E8"
        stroke-width="3"
      />
      <circle cx="190" cy="125" r="3" fill="#FFFFFF"/>
      <circle cx="190" cy="145" r="3" fill="#FFFFFF"/>
    `
    : `
      <path
        d="M130 90 L165 70 L190 95 L215 70
           L250 90 L285 145 L250 165 L230 130
           L230 340 L150 340 L150 130
           L130 165 L95 145 Z"
        fill="${color}"
        stroke="#333333"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M165 70 L190 95 L215 70"
        fill="none"
        stroke="#444444"
        stroke-width="3"
      />
    `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="380"
         height="420"
         viewBox="0 0 380 420">
      <rect width="380" height="420" fill="#F3F0EB"/>
      <ellipse cx="190" cy="355" rx="105" ry="15" fill="#D9D4CC"/>
      ${shirt}
      <text x="190" y="390"
            font-family="Arial"
            font-size="13"
            text-anchor="middle"
            fill="#777777">
        STYLEHUB
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/*
 * Actual product photographs.
 */
const BLACK_TSHIRT_IMAGE =
  "https://acdn-us.mitiendanube.com/stores/004/918/829/products/05_ghost_mannequin-c30eeb7ddce81e60f317772425103702-1024-1024.webp?w=1920";

const NAVY_POLO_IMAGE =
  "https://levi.in/cdn/shop/files/004LY0077_01_Styleshot.jpg?v=1782298205";

/*
 * Local illustrations used only if the photographs fail.
 */
const BLACK_TSHIRT_FALLBACK =
  createFallbackImage("#151515", "tshirt");

const NAVY_POLO_FALLBACK =
  createFallbackImage("#142D52", "polo");

/*
 * Images for the remaining products.
 */
const productImages = {
  "slim fit blue jeans":
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",

  "classic white sneakers":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",

  "oversized beige hoodie":
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",

  "black casual jacket":
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",

  "premium grey sweatshirt":
    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",

  "beige chino pants":
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",

  "olive green cargo pants":
    "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=800&q=80",

  "women's black dress":
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",

  "women's denim jacket":
    "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80",

  "classic black cap":
    "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",

  "leather casual belt":
    "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80",
};

/*
 * Select the correct image for each product.
 */
function getProductImage(product) {
  const name = product.name.trim().toLowerCase();

  if (name === "classic black t-shirt") {
    return BLACK_TSHIRT_IMAGE;
  }

  if (name === "navy blue polo shirt") {
    return NAVY_POLO_IMAGE;
  }

  if (
    product.image_url &&
    !product.image_url.includes("example.com")
  ) {
    return product.image_url;
  }

  return (
    productImages[name] ||
    "https://placehold.co/600x400/f3f0eb/333333?text=StyleHub"
  );
}

/*
 * Products page.
 */
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  /*
   * Load products from the backend.
   */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API_URL}/products/`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load products"
          );
        }

        setProducts(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /*
   * Add a product to the user's cart.
   */
  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setAddingProductId(productId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/cart/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: productId,
            quantity: 1,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
          return;
        }

        throw new Error(
          data.detail || "Failed to add product to cart"
        );
      }

      setSuccessMessage(
        "Product added to cart successfully!"
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingProductId(null);
    }
  };

  /*
   * Loading screen.
   */
  if (loading) {
    return (
      <div style={styles.centerMessage}>
        <h2>Loading products...</h2>
      </div>
    );
  }

  /*
   * Error screen.
   */
  if (error && products.length === 0) {
    return (
      <div style={styles.centerMessage}>
        <div style={{ textAlign: "center" }}>
          <h2>Unable to load products</h2>
          <p style={{ color: "#c62828" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.heading}>StyleHub</h1>

        <p style={styles.subtitle}>
          Fashion that fits your style.
        </p>
      </header>

      {successMessage && (
        <div style={styles.successMessage}>
          {successMessage}
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div style={styles.emptyState}>
          <h2>No products available.</h2>
        </div>
      ) : (
        <section style={styles.productGrid}>
          {products.map((product) => (
            <article
              key={product.id}
              style={styles.productCard}
            >
              <div style={styles.imageContainer}>
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  style={styles.productImage}
                  onError={(event) => {
                    const image = event.currentTarget;

                    if (image.dataset.fallbackApplied) {
                      return;
                    }

                    image.dataset.fallbackApplied = "true";

                    const name =
                      product.name.trim().toLowerCase();

                    if (name === "classic black t-shirt") {
                      image.src = BLACK_TSHIRT_FALLBACK;
                    } else if (
                      name === "navy blue polo shirt"
                    ) {
                      image.src = NAVY_POLO_FALLBACK;
                    } else {
                      image.src =
                        "https://placehold.co/600x400/f3f0eb/333333?text=Image+Unavailable";
                    }
                  }}
                />
              </div>

              <div style={styles.productDetails}>
                <p style={styles.category}>
                  {product.category}
                </p>

                <h2 style={styles.productName}>
                  {product.name}
                </h2>

                <p style={styles.description}>
                  {product.description ||
                    "Premium fashion for your everyday style."}
                </p>

                <p style={styles.price}>
                  ₹{Number(product.price).toFixed(2)}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleAddToCart(product.id)
                  }
                  disabled={addingProductId === product.id}
                  style={{
                    ...styles.addButton,
                    opacity:
                      addingProductId === product.id
                        ? 0.7
                        : 1,
                    cursor:
                      addingProductId === product.id
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {addingProductId === product.id
                    ? "Adding..."
                    : "Add to Cart"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

/*
 * Page styles.
 */
const styles = {
  page: {
    minHeight: "calc(100vh - 80px)",
    backgroundColor: "#fafafa",
    padding: "50px 30px 70px",
    boxSizing: "border-box",
  },

  centerMessage: {
    minHeight: "60vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
  },

  header: {
    maxWidth: "1200px",
    margin: "0 auto 45px",
    textAlign: "center",
  },

  heading: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#111",
  },

  subtitle: {
    margin: "10px 0 0",
    fontSize: "18px",
    color: "#666",
  },

  successMessage: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    padding: "13px 18px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: 600,
  },

  errorMessage: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    padding: "13px 18px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    borderRadius: "8px",
    textAlign: "center",
  },

  emptyState: {
    textAlign: "center",
    padding: "50px",
  },

  productGrid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "30px",
  },

  productCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
  },

  imageContainer: {
    width: "100%",
    height: "320px",
    backgroundColor: "#f3f0eb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },

  productDetails: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  category: {
    margin: "0 0 8px",
    color: "#777",
    fontSize: "14px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  productName: {
    margin: "0 0 12px",
    fontSize: "22px",
    lineHeight: 1.3,
    color: "#111",
  },

  description: {
    margin: "0 0 20px",
    color: "#666",
    fontSize: "15px",
    lineHeight: 1.6,
    flex: 1,
  },

  price: {
    margin: "0 0 18px",
    fontSize: "24px",
    fontWeight: 700,
    color: "#111",
  },

  addButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#111",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
  },
};

export default Products;