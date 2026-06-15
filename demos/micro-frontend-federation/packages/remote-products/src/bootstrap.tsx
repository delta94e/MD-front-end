import React from "react";
import { createRoot } from "react-dom/client";
import ProductList from "./ProductList";

// Standalone mode — remote can run independently!
const root = createRoot(document.getElementById("root")!);
root.render(
  <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
    <h1>🛍️ Products MFE (Standalone)</h1>
    <p style={{ color: "#64748b" }}>Running independently on port 3001. Also exposed via Module Federation.</p>
    <hr />
    <ProductList />
  </div>
);
