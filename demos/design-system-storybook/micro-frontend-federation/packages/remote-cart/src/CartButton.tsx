// =============================================================
// REMOTE: Cart MFE — Exposed Components
// =============================================================
// Team Cart owns this module
//
// STATE SHARING DEMO:
// - useCart() từ shared store — tự động sync với Products MFE
// - cartActions.removeItem() — thay đổi store, Products MFE nhận biết
// - useUser() — hiện user info từ shared state
// - Không dùng CustomEvent cho state management nữa
// =============================================================

import React, { useState } from "react";
import { Button, MfeLabel, tokens } from "@mfe-demo/shared-ui";
import { useCart, useUser, cartActions, logEvent } from "@mfe-demo/shared-ui/store";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

// ---- Cart Button (compact, for header) ----
export const CartButton: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  // ✅ SHARED STATE: Cart state từ shared store
  // Khi Products MFE gọi cartActions.addItem() →
  // cartStore.setState() → subscriber ở đây nhận update tự động
  // KHÔNG CẦN CustomEvent!
  const cartState = useCart();
  const userState = useUser();

  const { items } = cartState;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemove = (id: string) => {
    // ✅ SHARED STATE: Gọi action → store update → tất cả subscribers nhận
    cartActions.removeItem(id);
    logEvent("cart", "remove-item", { id });
  };

  const handleClear = () => {
    cartActions.clearCart();
    logEvent("cart", "clear-cart", {});
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
      <MfeLabel name="remote-cart" port={3002} color="#8b5cf6" />

      {/* User greeting (from shared userStore) */}
      {userState.isLoggedIn && userState.user && (
        <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted }}>
          {userState.user.avatar} {userState.user.name}
        </span>
      )}

      <button
        onClick={() => setShowPopup(!showPopup)}
        style={{
          position: "relative",
          padding: "8px 16px",
          borderRadius: tokens.borderRadius.md,
          border: `1px solid ${tokens.colors.border}`,
          background: tokens.colors.surface,
          color: tokens.colors.text,
          cursor: "pointer",
          fontSize: tokens.fontSize.md,
          fontWeight: 600,
          transition: "all 200ms ease",
        }}
      >
        🛒 Cart
        {totalItems > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: tokens.colors.danger,
              color: "#fff",
              fontSize: "11px",
              fontWeight: 700,
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 0.3s ease",
            }}
          >
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Popup */}
      {showPopup && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "8px",
            width: "360px",
            background: tokens.colors.surface,
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: tokens.borderRadius.lg,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: tokens.spacing.md,
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: tokens.fontSize.md, fontWeight: 700 }}>
              Shopping Cart ({totalItems})
            </h3>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                style={{ background: "none", border: "none", cursor: "pointer", color: tokens.colors.danger, fontSize: tokens.fontSize.xs, fontWeight: 600 }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Shared State Indicator */}
          <div style={{
            padding: "6px 10px",
            background: "#f5f3ff",
            border: "1px solid #ddd6fe",
            borderRadius: tokens.borderRadius.sm,
            marginBottom: "12px",
            fontSize: "11px",
            color: "#5b21b6",
          }}>
            🔗 State source: <code>cartStore</code> (shared singleton)
            <br />
            Updated by: Products MFE → <code>cartActions.addItem()</code>
          </div>

          {items.length === 0 ? (
            <p style={{ color: tokens.colors.textMuted, fontSize: tokens.fontSize.sm, textAlign: "center", padding: "20px 0" }}>
              Cart is empty. Add products from the Demo tab!
            </p>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: `1px solid ${tokens.colors.border}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: tokens.fontSize.sm, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted }}>
                      {item.quantity}x {formatPrice(item.price)} = {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: tokens.colors.danger, fontSize: "16px", padding: "4px 8px" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "12px",
                  marginTop: "4px",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: tokens.fontSize.md, color: tokens.colors.primary }}>
                  Total: {formatPrice(totalPrice)}
                </span>
                <Button size="sm" variant="primary">
                  Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartButton;
