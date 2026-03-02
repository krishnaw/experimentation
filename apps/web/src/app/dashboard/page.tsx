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

interface Experiment {
  id: string;
  name: string;
  status: string;
}

interface Feature {
  id: string;
  valueType: string;
}

// ── Markdown component overrides (light theme) ──────────────────────────────
const MD: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-[1.8] text-gray-700">{children}</p>
  ),

  ul: ({ children }) => (
    <ul className="my-3 flex flex-col gap-1.5">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="my-3 flex flex-col gap-1.5">{children}</ol>
  ),

  li: ({ children }) => (
    <li className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg text-sm bg-gray-50 border border-gray-100">
      <span className="mt-0.5 shrink-0 text-[10px] leading-none text-indigo-500">
        ▸
      </span>
      <span className="flex-1 leading-relaxed text-gray-700">{children}</span>
    </li>
  ),

  strong: ({ children }) => (
    <strong className="text-indigo-600 font-semibold">{children}</strong>
  ),

  em: ({ children }) => (
    <em className="text-gray-500 not-italic border-b border-dashed border-gray-300">
      {children}
    </em>
  ),

  code: ({ children, className }) => {
    if (className?.includes("language-")) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="px-1.5 py-0.5 rounded text-[0.85em] bg-indigo-50 text-indigo-600 border border-indigo-100 font-mono">
        {children}
      </code>
    );
  },

  pre: ({ children }) => (
    <pre className="my-3 p-4 rounded-xl overflow-x-auto text-sm leading-relaxed bg-gray-900 border border-gray-200 font-mono text-green-300">
      {children}
    </pre>
  ),

  h1: ({ children }) => (
    <h1 className="text-lg font-semibold mb-3 mt-4 first:mt-0 pb-2 text-gray-900 border-b border-gray-200 font-mono">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="text-[11px] font-semibold mb-2.5 mt-4 first:mt-0 uppercase tracking-[0.15em] text-indigo-600 font-mono">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-gray-900">
      {children}
    </h3>
  ),

  blockquote: ({ children }) => (
    <blockquote className="pl-4 my-3 text-sm leading-relaxed border-l-2 border-indigo-400 text-gray-500">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-4 border-none h-px bg-gray-200" />,

  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-gray-200">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-indigo-50/50">{children}</thead>
  ),

  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold text-indigo-600 font-mono border-b border-gray-200">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-4 py-2.5 text-sm text-gray-600 border-b border-gray-100">
      {children}
    </td>
  ),
};

const QUICK_ACTIONS = [
  { label: "Create experiment", prompt: "Create an experiment", symbol: "+" },
  { label: "Create feature flag", prompt: "Create a feature flag", symbol: "⚑" },
  { label: "List metrics", prompt: "List all metrics", symbol: "◈" },
];

const SUGGESTION_CARDS = [
  { label: "List experiments", prompt: "List all my experiments", icon: "⚗" },
  { label: "List feature flags", prompt: "List all feature flags", icon: "⚑" },
  { label: "Create an experiment", prompt: 'Create an experiment called "Hero Banner Test" with Control and Variant A', icon: "+" },
  { label: "Show metrics", prompt: "List all metrics", icon: "◈" },
];

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  running: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  stopped: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600" },
  draft: { dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
};

// ── Collapsible Section ─────────────────────────────────────────────────────
function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-500 font-mono hover:text-gray-700 transition-colors cursor-pointer"
      >
        <span>{title} ({count})</span>
        <span className={`transition-transform duration-200 text-[9px] ${open ? "" : "-rotate-90"}`}>▼</span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ControlRoomPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gbStatus, setGbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Exp Engine status + fetch context data
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setGbStatus(d.ok ? "connected" : "error");
        if (d.ok) {
          fetch("/api/experiments").then((r) => r.json()).then(setExperiments).catch(() => {});
          fetch("/api/features").then((r) => r.json()).then(setFeatures).catch(() => {});
        }
      })
      .catch(() => setGbStatus("error"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const insertPrompt = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

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

        // Refresh context panel after AI response (may have created/modified data)
        fetch("/api/experiments").then((r) => r.json()).then(setExperiments).catch(() => {});
        fetch("/api/features").then((r) => r.json()).then(setFeatures).catch(() => {});
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="flex h-full bg-gray-50">
      {/* ── Context Panel (left) ── */}
      <aside className="w-[280px] shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-y-auto">
        {/* Connection status */}
        <div className={`px-4 py-3.5 border-b ${
          gbStatus === "connected"
            ? "bg-emerald-50/60 border-emerald-100"
            : gbStatus === "error"
              ? "bg-red-50/60 border-red-100"
              : "bg-amber-50/40 border-amber-100"
        }`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ${
                gbStatus === "connected"
                  ? "bg-emerald-500 ring-emerald-200"
                  : gbStatus === "error"
                    ? "bg-red-400 ring-red-200"
                    : "bg-amber-400 ring-amber-200 animate-pulse"
              }`}
            />
            <span className={`text-[13px] font-semibold ${
              gbStatus === "connected"
                ? "text-emerald-700"
                : gbStatus === "error"
                  ? "text-red-600"
                  : "text-amber-600"
            }`}>
              {gbStatus === "connected"
                ? "Connected to Exp Engine"
                : gbStatus === "error"
                  ? "Exp Engine offline"
                  : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Experiments */}
        <Section title="Experiments" count={experiments.length}>
          <div className="px-3 pb-3">
            {experiments.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-2">No experiments yet</p>
            ) : (
              <div className="flex flex-col gap-1">
                {experiments.map((exp) => {
                  const colors = STATUS_COLORS[exp.status] || STATUS_COLORS.draft;
                  return (
                    <button
                      key={exp.id}
                      onClick={() => insertPrompt(`Tell me about experiment "${exp.name}"`)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                      <span className="text-[13px] text-gray-700 truncate flex-1 font-medium group-hover:text-indigo-600 transition-colors">
                        {exp.name}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${colors.bg} ${colors.text}`}>
                        {exp.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        {/* Feature Flags */}
        <Section title="Feature Flags" count={features.length}>
          <div className="px-3 pb-3">
            {features.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-2">No feature flags yet</p>
            ) : (
              <div className="flex flex-col gap-1">
                {features.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => insertPrompt(`Tell me about feature flag "${f.id}"`)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <span className="text-[13px] text-gray-700 truncate font-medium group-hover:text-indigo-600 transition-colors">
                      {f.id}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono font-medium">
                      {f.valueType}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Quick Actions */}
        <div className="mt-auto border-t border-gray-200 p-3">
          <p className="text-[11px] uppercase tracking-[0.15em] mb-2.5 px-1 font-semibold text-gray-500 font-mono">
            Quick Actions
          </p>
          <div className="flex flex-col gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => insertPrompt(a.prompt)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
              >
                <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-mono text-gray-500 shrink-0">{a.symbol}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Chat Panel (right) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono bg-indigo-100 text-indigo-600 border border-indigo-200">
              CR
            </div>
            <span className="text-gray-900 font-semibold text-sm tracking-tight">
              Control Room
            </span>
          </div>
          {messages.length > 0 && messages.some((m) => m.model) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">
              {messages.filter((m) => m.model).pop()?.model}
            </span>
          )}
        </header>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {/* ── Empty state ── */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-8 pb-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold font-mono bg-white text-indigo-600 border border-gray-200 shadow-sm">
                  CR
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-gray-50">
                  <span className="text-[8px] text-white font-bold leading-none">AI</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
                  Control Room
                </h2>
                <p className="text-sm max-w-xs leading-relaxed text-gray-500">
                  Manage experiments and feature flags in plain English.
                  No dashboards. No forms. Just ask.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
                {SUGGESTION_CARDS.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => sendMessage(card.prompt)}
                    className="px-4 py-3 rounded-xl text-sm text-left transition-all duration-150 flex items-center gap-2.5 bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-gray-700 cursor-pointer"
                  >
                    <span className="text-indigo-500 font-mono text-[13px]">
                      {card.icon}
                    </span>
                    {card.label}
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
                    <div className="max-w-[60%]" title={fmt(m.timestamp)}>
                      <div className="rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed bg-indigo-600 text-white">
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      </div>
                    </div>
                  )}

                  {/* AI response card */}
                  {m.role === "assistant" && (
                    <div style={{ flex: 1, maxWidth: "min(92%, 820px)" }} title={fmt(m.timestamp)}>
                      <div className="rounded-2xl rounded-tl-md overflow-hidden bg-white border border-gray-200 shadow-sm">
                        {/* Card header */}
                        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 bg-gray-50/50">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 font-mono">
                              Response
                            </span>
                          </div>
                          {m.model && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {m.model}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="px-5 py-4 text-sm leading-relaxed font-mono text-gray-700">
                          {m.content === "" && isLoading ? (
                            <div className="flex items-center gap-1.5 h-5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          ) : (
                            <ReactMarkdown components={MD}>{m.content}</ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="flex justify-center">
                  <div className="text-sm rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-600 font-mono">
                    Error: {error}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div className="px-8 py-5 shrink-0 border-t border-gray-200 bg-white">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask anything..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none text-sm disabled:opacity-60 focus:outline-none leading-relaxed transition-colors bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-[13px] placeholder:text-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-opacity duration-150 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
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
  );
}
