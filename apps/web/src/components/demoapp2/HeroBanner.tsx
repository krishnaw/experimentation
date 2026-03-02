"use client";

import { useState, useEffect, useCallback } from "react";
import type { HeroBannerSectionProps } from "@/lib/layout-types";

export default function HeroBanner({
  banners,
  mode,
  overlayStyle,
  pillText,
}: HeroBannerSectionProps) {
  const [current, setCurrent] = useState(0);
  const [clickedBanners, setClickedBanners] = useState<Set<string>>(new Set());
  const [transitioning, setTransitioning] = useState(false);

  const displayBanners = mode === "single" ? [banners[0]] : banners;

  // Reset carousel position when banners change
  useEffect(() => {
    setCurrent(0);
  }, [banners]);

  const goTo = useCallback(
    (index: number) => {
      if (index === current || transitioning) return;
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(index);
        setTimeout(() => setTransitioning(false), 50);
      }, 300);
    },
    [current, transitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % displayBanners.length);
  }, [current, displayBanners.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + displayBanners.length) % displayBanners.length);
  }, [current, displayBanners.length, goTo]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length, next]);

  const banner = displayBanners[current] || displayBanners[0];
  if (!banner) return null;

  const isGold = overlayStyle === "gold";
  const overlayClass = isGold
    ? "bg-gradient-to-r from-amber-900/80 via-amber-900/40 to-amber-900/10"
    : "bg-gradient-to-r from-black/75 via-black/35 to-black/10";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="relative h-[240px] sm:h-[320px]">
          {/* Full-bleed photo background with fade transition */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              transitioning ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Gradient overlay */}
          <div className={`absolute inset-0 ${overlayClass}`} />

          {/* Content */}
          <div
            className={`relative h-full flex items-center px-8 sm:px-12 lg:px-16 transition-all duration-500 ${
              transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            <div className="max-w-md">
              <span className={`inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                isGold
                  ? "text-amber-200/90 bg-amber-500/20 backdrop-blur-sm border-amber-400/20"
                  : "text-white/70 bg-white/10 backdrop-blur-sm border-white/10"
              }`}>
                {pillText}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                {banner.title}
              </h1>
              <p className="text-sm sm:text-[15px] text-white/70 mb-6 leading-relaxed max-w-sm">
                {banner.subtitle}
              </p>
              <button
                onClick={() =>
                  setClickedBanners((prev) => new Set(prev).add(banner.id))
                }
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                  clickedBanners.has(banner.id)
                    ? "bg-emerald-500/90 text-white backdrop-blur-sm"
                    : isGold
                    ? "bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-lg shadow-amber-900/20"
                    : "bg-white text-gray-900 hover:bg-white/90 shadow-lg shadow-black/10"
                }`}
              >
                {clickedBanners.has(banner.id)
                  ? banner.ctaClickedText
                  : banner.ctaText}
              </button>
            </div>
          </div>

          {/* Arrows */}
          {displayBanners.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/40 active:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
                aria-label="Previous banner"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/40 active:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
                aria-label="Next banner"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Progress dots — bottom right */}
          {displayBanners.length > 1 && (
            <div className="absolute bottom-4 right-6 flex items-center gap-2">
              {displayBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to banner ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
