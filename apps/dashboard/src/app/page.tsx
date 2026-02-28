"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: "List experiments",  prompt: "List all my experiments",  symbol: "⚗" },
  { label: "List feature flags", prompt: "List all feature flags",  symbol: "⚑" },
  { label: "List metrics",      prompt: "List all metrics",         symbol: "◈" },
  { label: "List environments", prompt: "List all environments",    symbol: "◎" },
];

const EXAMPLE_PROMPTS = [
  'Create an experiment "Hero Banner Test" with Control and Variant A',
  "What feature flags are active?",
  "Show me results for an experiment",
  "Create a boolean flag called show-promo-banner",
];

// ── Markdown component overrides ─────────────────────────────────────────────
const MD: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-[1.8]">{children}</p>
  ),

  ul: ({ children }) => (
    <ul className="my-3 flex flex-col gap-1.5">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="my-3 flex flex-col gap-1.5">{children}</ol>
  ),

  li: ({ children }) => (
    <li
      className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg text-sm"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <span
        className="mt-0.5 shrink-0 text-[10px] leading-none"
        style={{ color: "var(--accent)" }}
      >
        ▸
      </span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </li>
  ),

  strong: ({ children }) => (
    <strong style={{ color: "var(--accent)", fontWeight: 600 }}>{children}</strong>
  ),

  em: ({ children }) => (
    <em
      style={{
        color: "#9090b8",
        fontStyle: "normal",
        borderBottom: "1px dashed rgba(144,144,184,0.4)",
      }}
    >
      {children}
    </em>
  ),

  code: ({ children, className }) => {
    if (className?.includes("language-")) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded text-[0.85em]"
        style={{
          background: "rgba(0,212,255,0.12)",
          color: "var(--accent)",
          border: "1px solid rgba(0,212,255,0.2)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {children}
      </code>
    );
  },

  pre: ({ children }) => (
    <pre
      className="my-3 p-4 rounded-xl overflow-x-auto text-sm leading-relaxed"
      style={{
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "var(--font-mono)",
        color: "#86efac",
      }}
    >
      {children}
    </pre>
  ),

  h1: ({ children }) => (
    <h1
      className="text-lg font-semibold mb-3 mt-4 first:mt-0 pb-2"
      style={{
        color: "var(--text)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2
      className="text-[11px] font-semibold mb-2.5 mt-4 first:mt-0 uppercase tracking-[0.15em]"
      style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0" style={{ color: "var(--text)" }}>
      {children}
    </h3>
  ),

  blockquote: ({ children }) => (
    <blockquote
      className="pl-4 my-3 text-sm leading-relaxed"
      style={{ borderLeft: "2px solid var(--accent)", color: "var(--muted)" }}
    >
      {children}
    </blockquote>
  ),

  hr: () => (
    <hr
      className="my-4 border-none h-px"
      style={{
        background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
      }}
    />
  ),

  table: ({ children }) => (
    <div
      className="overflow-x-auto my-3 rounded-xl"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),

  thead: ({ children }) => (
    <thead style={{ background: "rgba(0,212,255,0.05)" }}>{children}</thead>
  ),

  th: ({ children }) => (
    <th
      className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold"
      style={{
        color: "var(--accent)",
        fontFamily: "var(--font-mono)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td
      className="px-4 py-2.5 text-sm"
      style={{
        color: "#b0b0d0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {children}
    </td>
  ),
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gbStatus, setGbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setGbStatus(d.ok ? "connected" : "error"))
      .catch(() => setGbStatus("error"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      setInput("");
      setError(null);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
      ]);
      setIsLoading(true);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);

        // Capture provider + model from response header, set immediately
        const modelUsed = res.headers.get("X-Model") ?? undefined;
        if (modelUsed) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, model: modelUsed } : m))
          );
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + decoder.decode(value, { stream: true }) }
                : m
            )
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: "var(--bg)", fontFamily: "var(--font-ui)", color: "var(--text)" }}
    >
      {/* ── Header ── */}
      <header
        className="h-14 flex items-center justify-between px-6 shrink-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              fontFamily: "var(--font-mono)",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(0,212,255,0.25)",
            }}
          >
            EM
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-white font-semibold text-sm tracking-tight">
              Experiment Manager
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(0,212,255,0.08)",
                color: "var(--accent)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              gbStatus === "connected"
                ? "bg-emerald-400"
                : gbStatus === "error"
                  ? "bg-red-400"
                  : "bg-amber-400 animate-pulse"
            }`}
          />
          <span
            className="text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color:
                gbStatus === "connected"
                  ? "#34d399"
                  : gbStatus === "error"
                    ? "#f87171"
                    : "#fbbf24",
            }}
          >
            {gbStatus === "connected"
              ? "GrowthBook"
              : gbStatus === "error"
                ? "Offline"
                : "Connecting..."}
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className="w-56 flex flex-col shrink-0 overflow-y-auto"
          style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
        >
          <div className="p-4">
            <p
              className="text-[10px] uppercase tracking-[0.18em] mb-3 font-semibold"
              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
            >
              Commands
            </p>
            <div className="flex flex-col gap-0.5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => sendMessage(a.prompt)}
                  disabled={isLoading}
                  onMouseEnter={() => setHoveredAction(a.label)}
                  onMouseLeave={() => setHoveredAction(null)}
                  className="text-left text-sm rounded-lg px-3 py-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5"
                  style={{
                    color: hoveredAction === a.label ? "var(--accent)" : "var(--muted)",
                    background: hoveredAction === a.label ? "var(--accent-dim)" : "transparent",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                    {a.symbol}
                  </span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1" style={{ borderTop: "1px solid var(--border)" }}>
            <p
              className="text-[10px] uppercase tracking-[0.18em] mb-3 font-semibold"
              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
            >
              Examples
            </p>
            <div className="flex flex-col gap-3">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-left text-xs leading-relaxed transition-colors"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--text)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--muted)")
                  }
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Chat ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            {/* ── Empty state ── */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-8 pb-12">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "var(--surface)",
                      color: "var(--accent)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 0 48px rgba(0,212,255,0.08)",
                    }}
                  >
                    EM
                  </div>
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center"
                    style={{ border: "2px solid var(--bg)" }}
                  >
                    <span className="text-[8px] text-black font-bold leading-none">AI</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                    Experiment Manager
                  </h2>
                  <p
                    className="text-sm max-w-xs leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    Manage A/B experiments and feature flags in plain English.
                    No dashboards. No forms. Just ask.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => sendMessage(a.prompt)}
                      className="px-4 py-3 rounded-xl text-sm text-left transition-all duration-150 flex items-center gap-2.5"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--muted)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "rgba(0,212,255,0.35)";
                        (e.currentTarget as HTMLElement).style.color = "var(--text)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                      }}
                    >
                      <span
                        style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "13px" }}
                      >
                        {a.symbol}
                      </span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Message list ── */}
            {messages.length > 0 && (
              <div className="flex flex-col gap-6">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`msg-enter flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {/* User bubble */}
                    {m.role === "user" && (
                      <div className="max-w-[60%]">
                        <div
                          className="rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed"
                          style={{
                            background: "var(--user-bg)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          <span className="whitespace-pre-wrap">{m.content}</span>
                        </div>
                        <div className="text-right mt-1.5 pr-1">
                          <span
                            className="text-[10px]"
                            style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
                          >
                            {fmt(m.timestamp)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* AI response card */}
                    {m.role === "assistant" && (
                      <div style={{ flex: 1, maxWidth: "min(92%, 820px)" }}>
                        <div
                          className="rounded-2xl rounded-tl-md overflow-hidden"
                          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                        >
                          {/* Card header */}
                          <div
                            className="flex items-center justify-between px-5 py-2.5"
                            style={{
                              borderBottom: "1px solid var(--border)",
                              background: "rgba(0,212,255,0.025)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: "var(--accent)" }}
                              />
                              <span
                                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                                style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                              >
                                Response
                              </span>
                            </div>
                            <span
                              className="text-[10px]"
                              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
                            >
                              {fmt(m.timestamp)}
                            </span>
                          </div>

                          {/* Content */}
                          <div
                            className="px-5 py-4 text-sm leading-relaxed"
                            style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}
                          >
                            {m.content === "" && isLoading ? (
                              /* Loading bars */
                              <div className="flex items-end gap-1 h-5">
                                {[0, 120, 240, 100, 200].map((delay, i) => (
                                  <div
                                    key={i}
                                    className="w-0.5 rounded-full"
                                    style={{
                                      background: "var(--accent)",
                                      height: "16px",
                                      transformOrigin: "50% 100%",
                                      animation: `bar-pulse 1.1s ease-in-out ${delay}ms infinite`,
                                    }}
                                  />
                                ))}
                                <span
                                  className="ml-2 text-xs"
                                  style={{ color: "var(--muted)" }}
                                >
                                  Processing...
                                </span>
                              </div>
                            ) : (
                              <ReactMarkdown components={MD}>{m.content}</ReactMarkdown>
                            )}
                          </div>

                          {/* Footer: provider/model badge */}
                          {m.content.length > 0 && m.model && (
                            <div
                              className="px-5 py-2.5 flex items-center gap-2"
                              style={{ borderTop: "1px solid var(--border)" }}
                            >
                              <span
                                className="text-[10px]"
                                style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
                              >
                                via
                              </span>
                              <span
                                className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                                style={{
                                  background: "rgba(0,212,255,0.08)",
                                  color: "var(--accent)",
                                  border: "1px solid rgba(0,212,255,0.2)",
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {m.model}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {error && (
                  <div className="flex justify-center">
                    <div
                      className="text-sm rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        color: "#f87171",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      ⚠ {error}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <div
            className="px-8 py-5 shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <div className="flex gap-3 items-end max-w-4xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask about experiments, feature flags, results..."
                rows={2}
                disabled={isLoading}
                className="chat-input flex-1 resize-none text-sm disabled:opacity-60 focus:outline-none leading-relaxed transition-colors"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                }}
                onFocus={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.4)")
                }
                onBlur={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")
                }
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-opacity duration-150 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
                onMouseEnter={(e) => {
                  if (!(e.currentTarget as HTMLButtonElement).disabled)
                    (e.currentTarget as HTMLElement).style.opacity = "0.82";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5,12 12,5 19,12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
