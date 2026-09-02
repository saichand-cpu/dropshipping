"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  cartTotal: number;
  itemCount: number;
}

// ==========================================
// 2. MOCK DROPSHIPPING PRODUCT CATALOG
// ==========================================
const PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Ergonomic Lumbar Cushion",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80",
    description: "Memory foam back support designed for desk workers and long commutes.",
    category: "Home & Office",
  },
  {
    id: "prod_2",
    name: "Portable Mini Blender",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80",
    description: "USB rechargeable blender for personal smoothies, protein shakes, and juices.",
    category: "Fitness & Kitchen",
  },
  {
    id: "prod_3",
    name: "Wireless Charging Desk Pad",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1616410011236-7a42121dd981?auto=format&fit=crop&w=600&q=80",
    description: "Waterproof leather mouse pad with integrated fast wireless phone charger.",
    category: "Electronics",
  },
  {
    id: "prod_4",
    name: "Ultrasonic LED Humidifier",
    price: 24.50,
    image: "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=600&q=80",
    description: "Whisper-quiet cool mist humidifier featuring customizable ambient lighting.",
    category: "Home Essentials",
  },
];

// ==========================================
// 3. CART CONTEXT & STATE MANAGEMENT
// ==========================================
const CartContext = createContext<CartContextType | undefined>(undefined);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("dropship_cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart storage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dropship_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, cartTotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}

// ==========================================
// 4. MAIN STORE COMPONENT
// ==========================================
function StoreFront() {
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      alert("Checkout sequence initiated! Connect your Stripe API endpoint in app/api/checkout/route.ts to collect payments.");
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div style={styles.pageContainer}>
      {/* Navigation Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>ApexDrop Store</h1>
          <button style={styles.cartButton} onClick={() => setIsCartOpen(true)}>
            🛒 Cart ({itemCount})
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section style={styles.hero}>
        <h2 style={styles.heroTitle}>Trending Products Delivered Fast</h2>
        <p style={styles.heroSubtitle}>High-quality items sourced directly from verified manufacturers.</p>
      </section>

      {/* Product Grid */}
      <main style={styles.main}>
        <h3 style={styles.sectionTitle}>Featured Products</h3>
        <div style={styles.grid}>
          {PRODUCTS.map((product) => (
            <div key={product.id} style={styles.card}>
              <img src={product.image} alt={product.name} style={styles.cardImage} />
              <div style={styles.cardBody}>
                <span style={styles.categoryBadge}>{product.category}</span>
                <h4 style={styles.cardTitle}>{product.name}</h4>
                <p style={styles.cardDescription}>{product.description}</p>
                <div style={styles.cardFooter}>
                  <span style={styles.price}>${product.price.toFixed(2)}</span>
                  <button style={styles.addButton} onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Sliding Cart Drawer */}
      {isCartOpen && (
        <div style={styles.overlay} onClick={() => setIsCartOpen(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <h3>Your Shopping Cart ({itemCount})</h3>
              <button style={styles.closeButton} onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            <div style={styles.drawerBody}>
              {cart.length === 0 ? (
                <p style={styles.emptyCart}>Your cart is currently empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} style={styles.cartItem}>
                    <img src={item.image} alt={item.name} style={styles.cartItemImage} />
                    <div style={styles.cartItemDetails}>
                      <h5 style={styles.cartItemTitle}>{item.name}</h5>
                      <p style={styles.cartItemPrice}>${item.price.toFixed(2)}</p>
                      <div style={styles.quantityControls}>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      style={styles.removeBtn}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={styles.drawerFooter}>
                <div style={styles.totalRow}>
                  <span>Subtotal:</span>
                  <span style={styles.totalAmount}>${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  style={styles.checkoutButton}
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Proceed to Checkout"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export Wrapped Application
export default function App() {
  return (
    <CartProvider>
      <StoreFront />
    </CartProvider>
  );
}

// ==========================================
// 5. INLINE STYLES FOR ZERO DEPENDENCIES
// ==========================================
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    color: "#0f172a",
    margin: 0,
    padding: 0,
  },
  header: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "1rem 2rem",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    margin: 0,
  },
  cartButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
  hero: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    textAlign: "center",
    padding: "3rem 1rem",
  },
  heroTitle: {
    fontSize: "2.25rem",
    margin: "0 0 0.5rem 0",
  },
  heroSubtitle: {
    fontSize: "1.125rem",
    color: "#94a3b8",
    margin: 0,
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    marginBottom: "1.5rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
  },
  cardImage: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
  },
  cardBody: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  categoryBadge: {
    fontSize: "0.75rem",
    color: "#2563eb",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: "0.25rem",
  },
  cardTitle: {
    fontSize: "1.125rem",
    margin: "0 0 0.5rem 0",
  },
  cardDescription: {
    fontSize: "0.875rem",
    color: "#64748b",
    flexGrow: 1,
    marginBottom: "1rem",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: "1.25rem",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 0.75rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 100,
    display: "flex",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "400px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  drawerHeader: {
    padding: "1rem",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    cursor: "pointer",
  },
  drawerBody: {
    padding: "1rem",
    flexGrow: 1,
    overflowY: "auto",
  },
  emptyCart: {
    textAlign: "center",
    color: "#64748b",
    marginTop: "2rem",
  },
  cartItem: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #e2e8f0",
    alignItems: "center",
  },
  cartItemImage: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  cartItemDetails: {
    flexGrow: 1,
  },
  cartItemTitle: {
    margin: "0 0 0.25rem 0",
    fontSize: "0.875rem",
  },
  cartItemPrice: {
    margin: "0 0 0.5rem 0",
    fontWeight: "bold",
    fontSize: "0.875rem",
  },
  quantityControls: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  qtyBtn: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  drawerFooter: {
    padding: "1rem",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "1.125rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  totalAmount: {
    color: "#2563eb",
  },
  checkoutButton: {
    width: "100%",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
  },
};
