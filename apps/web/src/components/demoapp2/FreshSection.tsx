"use client";

import type { FreshSectionProps } from "@/lib/layout-types";

export default function FreshSection({
  categories,
  rewardsSummary,
  welcomeMessage,
}: FreshSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Gold Member Rewards Summary */}
      {rewardsSummary && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/60 flex items-center justify-center">
              <span className="text-lg">{"\u2b50"}</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-amber-900">Your Rewards</h3>
              <p className="text-[12px] text-amber-700/70">Gold Member since 2024</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-white/60">
              <p className="text-xl font-bold text-amber-800">{rewardsSummary.points}</p>
              <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium">Points</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/60">
              <p className="text-xl font-bold text-amber-800">{rewardsSummary.savedThisMonth}</p>
              <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium">Saved This Month</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/60">
              <p className="text-xl font-bold text-amber-800">{rewardsSummary.dealsClipped}</p>
              <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium">Deals Clipped</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section for New Members */}
      {welcomeMessage && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-200/60 flex items-center justify-center">
              <span className="text-lg">{"\ud83c\udf89"}</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-blue-900">{welcomeMessage.title}</h3>
              <p className="text-[13px] text-blue-700/70">{welcomeMessage.body}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Shop What&apos;s Fresh
        </h2>
        <p className="text-sm text-gray-400 mt-1">Hand-picked quality, delivered to your door</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className="relative group overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer active:ring-4 active:ring-black/20 transition-all shadow-sm hover:shadow-xl"
          >
            {/* Photo background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {/* Content — pinned to bottom */}
            <div className="relative h-full flex flex-col justify-end p-4 text-white">
              <span className="text-2xl mb-1 drop-shadow-md">{cat.icon}</span>
              <span className="font-bold text-base leading-tight">
                {cat.name}
              </span>
              <span className="text-[11px] text-white/70 mt-0.5 leading-snug">
                {cat.subtitle}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
