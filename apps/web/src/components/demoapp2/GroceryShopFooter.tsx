"use client";

import { useState } from "react";

const footerLinks = {
  Shop: ["Weekly Ad", "Fresh Deals", "SNAP EBT", "Gift Cards", "FreshPass"],
  Services: ["Delivery", "DriveUp & Go", "Pharmacy", "Photo Center", "Floral"],
  Company: ["About Us", "Careers", "Community", "Sustainability", "Press"],
  Help: ["Contact Us", "FAQs", "Store Locator", "Returns", "Accessibility"],
};

const socials = [
  { name: "Facebook", icon: "f" },
  { name: "Twitter", icon: "𝕏" },
  { name: "Instagram", icon: "◻" },
  { name: "Pinterest", icon: "P" },
];

export default function GroceryShopFooter() {
  const [expanded, setExpanded] = useState(false);

  return (
    <footer className="mt-14 bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full py-3.5 flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer border-b border-white/5"
      >
        <span className="font-medium tracking-wide">
          {expanded ? "Hide" : "More from Grocery Shop"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          {/* Links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-10">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                  {heading}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <button className="text-sm text-white/60 hover:text-white hover:translate-x-1 active:text-yellow-300 transition-all cursor-pointer">
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social + legal */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex gap-3">
              {socials.map((s) => (
                <button
                  key={s.name}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 active:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
                  aria-label={s.name}
                >
                  <span className="text-xs font-bold text-white/70">
                    {s.icon}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/30">
              &copy; 2026 Grocery Shop Demo &middot; For demonstration purposes only
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
