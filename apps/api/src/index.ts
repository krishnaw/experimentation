import "dotenv/config";
import express from "express";
import cors from "cors";
import { initGrowthBook, gbClient } from "./lib/growthbook";
import { products } from "./data/products";

const app = express();
app.use(cors({ origin: ["http://localhost:3050", "http://localhost:3000"] }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const GB_API_HOST = process.env.GROWTHBOOK_API_HOST || "http://localhost:3100";
const GB_CLIENT_KEY = process.env.GROWTHBOOK_CLIENT_KEY || "";

// Products list — sort order determined by GrowthBook
app.get("/api/products", async (req, res) => {
  const userId = (req.query.userId as string) || "anonymous";
  const category = req.query.category as string | undefined;

  // GrowthBookClient (v1.6.5) caches features at init() and setPayload()/refreshFeatures()
  // do not propagate to createScopedInstance() — SDK bug. Fetch the SDK endpoint directly
  // per request instead. Cache-bust param ensures GrowthBook serves fresh data, not a
  // stale response from its own server-side response cache.
  let sortOrder = "popularity";
  try {
    const payload = await fetch(
      `${GB_API_HOST}/api/features/${GB_CLIENT_KEY}?_cb=${Date.now()}`
    ).then((r) => r.json());
    sortOrder =
      payload.features?.["product-sort-order"]?.defaultValue ?? "popularity";
  } catch {
    // GrowthBook unreachable — use default
  }

  let sorted = [...products];

  if (category) {
    sorted = sorted.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (sortOrder === "price") {
    sorted.sort((a, b) => a.price - b.price);
  } else {
    sorted.sort((a, b) => b.popularity - a.popularity);
  }

  res.json({
    products: sorted,
    meta: { sortOrder, userId, total: sorted.length },
  });
});

// Single product
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

const PORT = process.env.PORT || 3200;

async function main() {
  try {
    await initGrowthBook();
  } catch (e) {
    console.warn("GrowthBook init failed (will use defaults):", e);
  }
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

main();

export { app };
