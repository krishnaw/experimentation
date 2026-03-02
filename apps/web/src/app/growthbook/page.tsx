"use client";

import { useState, useEffect } from "react";

const GB_URL = "http://localhost:3000";

export default function GrowthBookPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setStatus(d.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-4xl">
        🧪
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Exp Engine
        </h2>
        <p className="text-gray-500 max-w-md">
          Feature flags and experiment management dashboard powered by GrowthBook.
          {status === "error" && (
            <span className="block mt-2 text-amber-600 text-sm">
              Exp Engine doesn&apos;t appear to be running. Start it with{" "}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                docker compose up -d
              </code>
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        <a
          href={GB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
            status === "ok"
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : status === "error"
              ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
              : "bg-gray-100 text-gray-400 cursor-wait"
          }`}
        >
          Open Exp Engine
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        {status === "error" && (
          <button
            onClick={() => {
              setStatus("loading");
              fetch("/api/health")
                .then((r) => r.json())
                .then((d) => setStatus(d.ok ? "ok" : "error"))
                .catch(() => setStatus("error"));
            }}
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>

      {status === "ok" && (
        <p className="text-xs text-green-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Connected
        </p>
      )}
      {status === "loading" && (
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          Checking connection...
        </div>
      )}
    </div>
  );
}
