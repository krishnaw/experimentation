"use client";

import { useEffect } from "react";
import {
  GrowthBookProvider as GBProvider,
} from "@growthbook/growthbook-react";
import { growthbook } from "@/lib/growthbook";

export default function GrowthBookProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // ?reset clears all Exp Engine client-side caches and redirects to /
    // Use http://localhost:3050?reset before manual testing to start clean
    if (window.location.search.includes("reset")) {
      localStorage.removeItem("gbFeaturesCache");
      window.location.replace("/");
      return;
    }

    // Patch window.fetch to append a unique ?_cb=<epoch> to every Exp Engine
    // features endpoint request. This bypasses Chrome's in-memory HTTP cache,
    // which persists across hard refreshes and is the root cause of stale
    // feature flag values appearing after flags are created or deleted.
    // Exp Engine ignores unknown query params — only the clientKey path matters.
    const origFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url;
      if (url.includes("/api/features/")) {
        const busted = url.includes("?")
          ? `${url}&_cb=${Date.now()}`
          : `${url}?_cb=${Date.now()}`;
        return origFetch(busted, { ...init, cache: "no-store" });
      }
      return origFetch(input, init);
    };

    growthbook.init({ streaming: false }).catch((err) => {
      console.warn("Exp Engine init failed (this is okay without a running instance):", err);
    });

    return () => {
      window.fetch = origFetch;
    };
  }, []);

  return <GBProvider growthbook={growthbook}>{children}</GBProvider>;
}
