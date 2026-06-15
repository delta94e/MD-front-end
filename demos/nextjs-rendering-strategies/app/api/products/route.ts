// =============================================================
// API Route: /api/products
// Used by the BEFORE (CSR) page to simulate client-side fetching
// =============================================================

import { NextResponse } from "next/server";
import { fetchProductsClient } from "@/lib/data";

export async function GET() {
  // Simulate realistic API latency (800ms)
  const products = await fetchProductsClient();

  return NextResponse.json(products, {
    headers: {
      // No caching — every request hits the server
      "Cache-Control": "no-store",
    },
  });
}
