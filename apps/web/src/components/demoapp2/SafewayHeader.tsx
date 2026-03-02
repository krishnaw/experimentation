"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { personas, tierColors } from "@/lib/personas";

/** Background color for avatar circles, keyed by tier */
const tierAvatarBg: Record<string, string> = {
  gold: "bg-amber-200 text-amber-900",
  silver: "bg-gray-200 text-gray-700",
  basic: "bg-blue-100 text-blue-800",
};

export default function SafewayHeader() {
  const [cartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { persona, isSignedIn, signIn, signOut } = useUser();

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [dropdownOpen]);

  const currentTier = persona?.attributes.membership_tier;
  const currentTierColor = currentTier ? tierColors[currentTier] : null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[56px]">
          {/* Logo */}
          <Link href="/demoapp2" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E41720] to-[#ff4d54] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-black text-sm leading-none">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:inline">
              Safeway
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-lg mx-6 sm:mx-10">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, deals, recipes..."
                className="w-full h-9 px-4 pl-9 rounded-lg bg-gray-100 border border-transparent text-gray-900 text-[13px] placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-300 transition-all"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Sign In / Persona Picker */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              {isSignedIn && persona ? (
                /* Signed-in state: avatar + name + tier badge */
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tierAvatarBg[persona.attributes.membership_tier] || "bg-gray-200 text-gray-700"}`}
                  >
                    {persona.avatar}
                  </div>
                  <span className="text-[13px] font-medium text-gray-900 max-w-[100px] truncate">
                    {persona.name}
                  </span>
                  {currentTierColor && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${currentTierColor.bg} ${currentTierColor.text}`}
                    >
                      {currentTierColor.label}
                    </span>
                  )}
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              ) : (
                /* Signed-out state: Sign In button */
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Sign In
                </button>
              )}

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white/95 backdrop-blur-lg border border-gray-200/80 rounded-xl shadow-lg shadow-gray-200/50 py-1.5 z-[60]">
                  {/* Header */}
                  <div className="px-3.5 py-2 border-b border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {isSignedIn ? "Switch Persona" : "Sign in as"}
                    </p>
                  </div>

                  {/* Persona list */}
                  <div className="py-1">
                    {personas.map((p) => {
                      const tier = p.attributes.membership_tier;
                      const tc = tierColors[tier];
                      const isActive = persona?.id === p.id;

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            signIn(p);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                            isActive
                              ? "bg-gray-50"
                              : "hover:bg-gray-50/80"
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${tierAvatarBg[tier] || "bg-gray-200 text-gray-700"}`}
                          >
                            {p.avatar}
                          </div>

                          {/* Name + description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-gray-900 truncate">
                                {p.name}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${tc.bg} ${tc.text}`}
                              >
                                {tc.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {p.description}
                            </p>
                          </div>

                          {/* Active indicator */}
                          {isActive && (
                            <svg
                              className="w-4 h-4 text-[#E41720] flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sign Out (only when signed in) */}
                  {isSignedIn && (
                    <>
                      <div className="border-t border-gray-100 mx-2" />
                      <button
                        onClick={() => {
                          signOut();
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/60 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button className="relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all cursor-pointer">
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 left-[22px] min-w-[18px] h-[18px] px-1 bg-[#E41720] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
