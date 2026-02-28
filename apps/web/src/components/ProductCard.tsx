"use client";

import Image from "next/image";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-300 fill-gray-300"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-gray-500 ml-1">
        ({rating})
      </span>
    </div>
  );
}

function Badge({ type }: { type: "New" | "Sale" | "Best Seller" }) {
  const colors = {
    New: "bg-blue-100 text-blue-700",
    Sale: "bg-red-100 text-red-700",
    "Best Seller": "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[type]}`}
    >
      {type}
    </span>
  );
}

interface ProductCardProps {
  product: Product;
  layout: "grid" | "large-image";
}

function GridCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge type={product.badge} />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-semibold text-gray-900 mb-1 truncate">
          {product.name}
        </h3>
        <StarRating rating={product.rating} />
        <p className="text-xs text-gray-500 mt-1">
          {product.reviewCount.toLocaleString()} reviews
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
            aria-label={`Add ${product.name} to cart`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function LargeImageCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="relative aspect-[3/4] bg-gray-50">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge type={product.badge} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={() => addItem(product)}
            className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
          >
            Quick Add
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
          <StarRating rating={product.rating} />
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product, layout }: ProductCardProps) {
  if (layout === "large-image") {
    return <LargeImageCard product={product} />;
  }
  return <GridCard product={product} />;
}
