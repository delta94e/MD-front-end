// Client Component — Only this ships JavaScript to the browser
"use client";

import { useState } from "react";

export function AddToCartButton({ productName }: { productName: string }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
        added
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
      }`}
    >
      {added ? "✓ Added!" : "Add to Cart"}
    </button>
  );
}
