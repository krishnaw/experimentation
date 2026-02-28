"use client";

import { useFeatureValue, useFeatureIsOn } from "@growthbook/growthbook-react";
import ProductCard from "@/components/ProductCard";
import { products, getFeaturedProducts, categories } from "@/lib/products";

export default function Home() {
  const layout = useFeatureValue("product-card-layout", "grid") as
    | "grid"
    | "large-image";
  const featuredEnabled = useFeatureIsOn("featured-section-enabled");

  const featured = getFeaturedProducts();

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="max-w-2xl">
            <p className="text-indigo-200 font-medium mb-3 tracking-wide uppercase text-sm">
              New Collection
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Discover
              <br />
              Something New
            </h1>
            <p className="text-lg text-indigo-100 mb-8 max-w-lg">
              Curated products across electronics, fashion, and home. Premium
              quality, modern design.
            </p>
            <button className="px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20 cursor-pointer">
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* Categories Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-3 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="font-medium text-gray-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      {featuredEnabled && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-semibold text-gray-900">ShopDemo</span>
            </div>
            <p className="text-sm text-gray-400">AI Experimentation Demo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
