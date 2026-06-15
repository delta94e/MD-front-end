// =============================================================
// REMOTE: Products MFE — Exposed Components
// =============================================================
// Team Products owns this module
// Exposed via Module Federation to Host
//
// DUAL PATTERN DEMO:
// Pattern 1: Shared Store — cartActions.addItem() for STATE sync
// Pattern 2: Event Bus — eventBus.emit() for NOTIFICATIONS
// =============================================================

import React, { useState, useEffect } from "react";
import { Card, Badge, Button, MfeLabel, tokens } from "@mfe-demo/shared-ui";
import { cartActions, useUser, eventBus } from "@mfe-demo/shared-ui/store";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  description: string;
}

const mockProducts: Product[] = [
  { id: "1", name: "Wireless Earbuds Pro", price: 2499000, category: "Electronics", rating: 4.8, description: "Premium ANC earbuds with 30hr battery" },
  { id: "2", name: "Smart Watch Ultra", price: 8990000, category: "Electronics", rating: 4.6, description: "Health monitoring + GPS + 5-day battery" },
  { id: "3", name: "Mechanical Keyboard", price: 3200000, category: "Accessories", rating: 4.9, description: "Hot-swappable, RGB, gasket mount" },
  { id: "4", name: "USB-C Hub 10-in-1", price: 1590000, category: "Accessories", rating: 4.4, description: "HDMI 4K, USB 3.0, SD, Ethernet, PD 100W" },
  { id: "5", name: "Noise-Cancel Headphones", price: 6790000, category: "Electronics", rating: 4.7, description: "ANC, 40hr battery, multipoint" },
  { id: "6", name: "Portable Charger 20K", price: 890000, category: "Accessories", rating: 4.5, description: "20000mAh, 65W PD, dual USB-C" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

// ---- Main Exposed Component ----
interface ProductListProps {
  onAddToCart?: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // ✅ SHARED STATE: Lấy user info từ shared store
  // Dù Products MFE không quản lý user state,
  // nó vẫn đọc được nhờ shared store singleton
  const userState = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
      // ✅ EVENT BUS: Notify other MFEs that products loaded
      eventBus.emit("products:loaded", { count: mockProducts.length }, "products");
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const categories = ["All", ...new Set(mockProducts.map((p) => p.category))];
  const filtered = filter === "All" ? products : products.filter((p) => p.category === filter);

  const handleAddToCart = (product: Product) => {
    // ✅ PATTERN 1 — SHARED STORE: Update cart state
    // Cart MFE subscribes to cartStore → auto re-render
    cartActions.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
    });

    // ✅ PATTERN 2 — EVENT BUS: Notify "something happened"
    // Host, Analytics, other MFEs can listen without coupling
    eventBus.emit("cart:item-added", {
      id: product.id,
      name: product.name,
      price: product.price,
    }, "products");

    // Visual feedback
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);

    onAddToCart?.(product);
  };

  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    // ✅ EVENT BUS: Notify filter change for analytics
    eventBus.emit("products:filter", { category: cat }, "products");
  };

  return (
    <div>
      {/* MFE identifier + Personalized Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: tokens.fontSize.xl, fontWeight: 700, color: tokens.colors.text, margin: 0 }}>
            Products
          </h2>
          {/* ✅ SHARED STATE: Personalized greeting từ user store */}
          {userState.isLoggedIn && userState.user && (
            <p style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.textMuted, margin: "4px 0 0" }}>
              {userState.user.avatar} Xin chào, {userState.user.name}! Đây là sản phẩm dành cho bạn.
            </p>
          )}
        </div>
        <MfeLabel name="remote-products" port={3001} color="#10b981" />
      </div>

      {/* Shared State Indicator */}
      <div style={{
        padding: "10px 14px",
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        borderRadius: tokens.borderRadius.md,
        marginBottom: "16px",
        fontSize: tokens.fontSize.xs,
        color: "#065f46",
      }}>
        <strong>🔗 Shared State Demo:</strong> Click &ldquo;Add to Cart&rdquo; → Cart MFE (port 3002) updates instantly via shared store.
        User greeting above is read from <code>userStore</code> (managed by Host).
        No CustomEvent needed — direct store subscription!
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "primary" : "ghost"}
            size="sm"
            onClick={() => handleFilterChange(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div style={{ height: "120px", background: "#f1f5f9", borderRadius: "8px", marginBottom: "12px" }} />
              <div style={{ height: "20px", background: "#f1f5f9", borderRadius: "4px", width: "60%", marginBottom: "8px" }} />
              <div style={{ height: "16px", background: "#f1f5f9", borderRadius: "4px", width: "80%" }} />
            </Card>
          ))}
        </div>
      )}

      {/* Product Grid */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {filtered.map((product) => {
            const isAdded = addedIds.has(product.id);
            return (
              <Card key={product.id} hoverable>
                <div style={{ height: "120px", background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", fontSize: "48px" }}>
                  📦
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <Badge color="success">{product.category}</Badge>
                  <span style={{ fontSize: "12px", color: tokens.colors.textMuted }}>⭐ {product.rating}</span>
                </div>
                <h3 style={{ fontSize: tokens.fontSize.md, fontWeight: 700, margin: "0 0 4px", color: tokens.colors.text }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.textMuted, margin: "0 0 12px" }}>
                  {product.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, color: tokens.colors.primary }}>
                    {formatPrice(product.price)}
                  </span>
                  <Button
                    size="sm"
                    variant={isAdded ? "ghost" : "primary"}
                    onClick={() => !isAdded && handleAddToCart(product)}
                    disabled={isAdded}
                  >
                    {isAdded ? "✓ Added!" : "Add to Cart"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductList;
