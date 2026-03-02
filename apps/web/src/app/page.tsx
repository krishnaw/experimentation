"use client";

import { useFeatureValue, useFeatureIsOn } from "@growthbook/growthbook-react";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import { products, getFeaturedProducts } from "@/lib/products";

export default function Home() {
  const layout = useFeatureValue("product-card-layout", "grid") as
    | "grid"
    | "large-image";
  const featuredEnabled = useFeatureIsOn("featured-section-enabled");

  const featured = getFeaturedProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Featured Section */}
      {featuredEnabled && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Best Sellers
              </h2>
              <p className="text-gray-500 mt-1">Our most popular picks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout="large-image"
              />
            ))}
          </div>
        </section>
      )}

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
            <p className="text-gray-500 mt-1">{products.length} items</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:inline">Layout:</span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md font-medium text-xs uppercase">
              {layout}
            </span>
          </div>
        </div>
        <div
          className={
            layout === "large-image"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
          }
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} layout={layout} />
          ))}
        </div>
      </section>
    </div>
  );
}
