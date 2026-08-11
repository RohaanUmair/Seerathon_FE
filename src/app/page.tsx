"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image";
import { Home as HomeIcon, BookOpen, RefreshCw, UserCheck, PlaySquare, User, Send, ChevronRight, CheckSquare, Copy, Check, ChevronDown } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  citation: string | null;
  type: "answer" | "fatwa_redirect" | "fallback";
  timestamp?: string;
}

interface ApiResponse {
  answer: string;
  citation: string | null;
  type: "answer" | "fatwa_redirect" | "fallback";
}

interface SourceDetail {
  id: string;
  source: string;
  title: string;
  text: string;
  hawala: string;
  points: string[];
  hikayat: string;
  category: string;
  urdu_title: string;
  urdu_text: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Helpers ───────────────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}

/* ── Components ────────────────────────────────────────────────────── */


/** App-like Top Header */
function AppHeader({ theme, setTheme }: { theme: "light" | "dark", setTheme: (theme: "light" | "dark") => void }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white dark:bg-zinc-950 border-b border-seerah-border dark:border-zinc-800 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white font-medium text-lg">
          R
        </div>
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rohaan Umair</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <div 
          className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <span className={theme === "light" ? "text-seerah-orange" : "text-zinc-400 dark:text-zinc-600 transition-colors text-[14px]"}>☀️</span>
          <div className="h-5 w-9 rounded-full bg-seerah-green flex items-center p-0.5 transition-all duration-300 shadow-inner">
            <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
          </div>
          <span className={theme === "dark" ? "text-blue-400" : "text-zinc-400 transition-colors text-[14px]"}>🌙</span>
        </div>
        <div className="text-seerah-green dark:text-seerah-green-light">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>
    </header>
  );
}

/** Source detail modal */
function SourceModal({
  detail,
  loading,
  onClose,
}: {
  detail: SourceDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-fade-in-up" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-seerah-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          ✕
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              <span>Loading source</span>
              <span className="dot-pulse flex gap-0.5"><span className="inline-block h-1.5 w-1.5 rounded-full bg-seerah-orange" /><span className="inline-block h-1.5 w-1.5 rounded-full bg-seerah-orange" /><span className="inline-block h-1.5 w-1.5 rounded-full bg-seerah-orange" /></span>
            </div>
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            <div className="space-y-2 pr-10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded bg-seerah-green/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-seerah-green dark:text-seerah-green-light">
                  {detail.source}
                </span>
                {detail.category && (
                  <span className="inline-flex items-center rounded bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    {detail.category}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-seerah-green dark:text-seerah-green-light">{detail.title}</h2>
              {detail.urdu_title && <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium font-urdu" dir="rtl">{detail.urdu_title}</p>}
            </div>

            <div className="rounded-2xl border border-seerah-border dark:border-zinc-800 bg-seerah-card dark:bg-zinc-800 p-5 space-y-4">
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{detail.text}</p>
              {detail.urdu_text && (
                <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 border-t border-seerah-border dark:border-zinc-700 pt-4 font-urdu" dir="rtl">
                  {detail.urdu_text}
                </p>
              )}
            </div>

            {detail.hawala && (
              <div className="flex items-start gap-3 rounded-xl border border-seerah-border dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-seerah-orange">📜</div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Reference</span>
                  <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-200">{detail.hawala}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">Could not load source details.</div>
        )}
      </div>
    </div>
  );
}

/** Citation card matching the app's 'Mini Task' style */
function CitationCard({
  citation,
  onSourceClick,
}: {
  citation: string;
  onSourceClick: (sourceType: string, sourceId: string) => void;
}) {
  const lines = citation
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.toLowerCase().includes("none") && !l.toLowerCase().includes("n/a"));

  if (lines.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {lines.map((line, i) => {
        const match = line.match(/SOURCE:\s*(Shamail|Timeline)\s*#(\S+)\s*[—–-]\s*(.*)/i);
        const source = match?.[1] ?? "";
        const id = match?.[2] ?? "";
        const title = match?.[3] ?? line.replace(/^SOURCE:\s*/i, "");

        return (
          <button
            key={i}
            onClick={() => { if (source && id) onSourceClick(source, id); }}
            className={`block w-full rounded-2xl border border-seerah-border dark:border-zinc-800 bg-seerah-card dark:bg-zinc-800/50 px-5 py-4 text-left transition-all shadow-sm ${
              source && id ? "hover:border-seerah-green/40 dark:hover:border-seerah-green-light/40 hover:shadow-md cursor-pointer" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{title}</h4>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {source && id ? `${source} Source` : 'Reference'}
              </span>
              
              {source && id && (
                <div className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/20 px-3 py-1.5 text-[11px] font-bold text-seerah-orange dark:text-amber-500">
                  Read now <span className="text-amber-500">✦</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Loading indicator while agent is working */
function LoadingBubble() {
  return (
    <div className="flex items-center gap-4 animate-fade-in-up px-5 md:px-8">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white dark:bg-zinc-900 border border-seerah-border dark:border-zinc-800 shadow-sm flex items-center justify-center p-1.5">
         <Image src="/logo.png" alt="Seerat Ki Dunya" width={28} height={28} className="object-contain" />
      </div>
      <div className="flex gap-1.5">
        <span className="dot-pulse flex gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
        </span>
      </div>
    </div>
  );
}

/** Single chat message bubble */
function MessageBubble({
  msg,
  onSourceClick,
}: {
  msg: ChatMessage;
  onSourceClick: (sourceType: string, sourceId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(msg.text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const citationLines = msg.citation
    ? msg.citation
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.toLowerCase().includes("none") && !l.toLowerCase().includes("n/a"))
    : [];

  if (msg.role === "user") {
    return (
      <div className="flex flex-col items-end animate-fade-in-up px-5 md:px-8 space-y-1">
        <div className="max-w-[80%] rounded-[24px] bg-zinc-100 dark:bg-zinc-800 px-5 py-3 text-[15px] text-zinc-900 dark:text-zinc-100 leading-relaxed shadow-sm">
          {msg.text}
        </div>
        <div className="flex items-center gap-2 px-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>{msg.timestamp}</span>
          <button
            onClick={handleCopy}
            title="Copy message"
            className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  const isFatwa = msg.type === "fatwa_redirect";
  const isFallback = msg.type === "fallback";

  return (
    <div className="flex items-start gap-4 animate-fade-in-up px-5 md:px-8">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white dark:bg-zinc-900 border border-seerah-border dark:border-zinc-800 shadow-sm flex items-center justify-center p-1.5 mt-0.5">
        {isFatwa ? (
          <span className="text-seerah-orange font-bold text-sm">⚠</span>
        ) : (
          <Image src="/logo.png" alt="Seerat Ki Dunya" width={28} height={28} className="object-contain" />
        )}
      </div>

      <div className="max-w-[85%] space-y-2 pt-1">
        <div
          className={`text-[15px] leading-relaxed ${
            isFatwa
              ? "text-amber-800 dark:text-amber-500 font-medium"
              : isFallback
                ? "text-zinc-600 dark:text-zinc-400"
                : "text-zinc-800 dark:text-zinc-200"
          }`}
        >
          {msg.text.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < msg.text.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Timestamp & Copy Action & Sources Flag Toggle */}
        <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>{msg.timestamp}</span>
          <button
            onClick={handleCopy}
            title="Copy message"
            className="flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Expand / Close Sources Flag Button */}
          {citationLines.length > 0 && (
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1.5 ml-1 rounded-full border border-seerah-border dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 px-3 py-1 text-[11px] font-semibold text-seerah-green dark:text-seerah-green-light hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-xs"
            >
              <BookOpen className="w-3 h-3 text-seerah-green dark:text-seerah-green-light" />
              <span>{sourcesOpen ? "Hide Sources" : `View Sources (${citationLines.length})`}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${sourcesOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Collapsible Citation Cards */}
        {citationLines.length > 0 && sourcesOpen && (
          <CitationCard citation={msg.citation!} onSourceClick={onSourceClick} />
        )}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────── */
export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [sourceDetail, setSourceDetail] = useState<SourceDetail | null>(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSourceClick(sourceType: string, sourceId: string) {
    setModalOpen(true);
    setModalLoading(true);
    setSourceDetail(null);

    try {
      const res = await fetch(`${API_URL}/source/${sourceType.toLowerCase()}/${sourceId}`);
      const data = await res.json();
      if (!data.error && data.data) {
        setSourceDetail(data.data as SourceDetail);
      }
    } catch {
      // failed to load
    } finally {
      setModalLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", text, citation: null, type: "answer", timestamp: getCurrentTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data: ApiResponse = await res.json();

      const botMsg: ChatMessage = {
        id: uid(),
        role: "bot",
        text: data.answer,
        citation: data.citation,
        type: data.type,
        timestamp: getCurrentTime(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: uid(),
        role: "bot",
        text: "Sorry, I couldn't reach the server. Please check your connection and try again.",
        citation: null,
        type: "fallback",
        timestamp: getCurrentTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-seerah-cream dark:bg-zinc-950 overflow-hidden transition-colors">
      <AppHeader theme={theme} setTheme={setTheme} />

      {/* Chat scroll area with watermark */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto pt-8 pb-[170px] space-y-8">
        {/* Watermark logo */}
        {messages.length > 0 && (
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0">
            <Image src="/logo.png" alt="" width={450} height={450} className="object-contain opacity-[0.05] dark:opacity-[0.02]" priority />
          </div>
        )}

        <div className="relative z-[1]">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center pt-10 px-8 text-center animate-fade-in-up w-full max-w-3xl mx-auto">
              <div className="h-20 w-20 mb-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-seerah-border dark:border-zinc-800 flex items-center justify-center p-3">
                <Image src="/logo.png" alt="Seerat Ki Dunya" width={60} height={60} className="object-contain" priority />
              </div>
              <h2 className="text-xl font-bold text-seerah-green dark:text-seerah-green-light">AI Seerathon</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                Discover the life of Khatam al-Anbiya ﷺ. Ask questions about the Prophet&apos;s appearance, character, or key events.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-sm">
                {["What did the Prophet ﷺ look like?", "Tell me about the Treaty of Hudaybiyyah"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="rounded-xl border border-seerah-border dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm transition-all hover:border-seerah-green/30 dark:hover:border-zinc-600 hover:text-seerah-green dark:hover:text-zinc-100 text-left flex justify-between items-center"
                  >
                    <span>{q}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8 w-full max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onSourceClick={handleSourceClick} />
            ))}
            {loading && <LoadingBubble />}
          </div>
        </div>
      </div>

      {/* Fixed Input Area above Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-seerah-cream dark:from-zinc-950 via-seerah-cream dark:via-zinc-950 to-transparent pt-6 pb-6 px-6 z-20">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Seerathon..."
              disabled={loading}
              className="flex-1 rounded-full border border-seerah-border dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-4 text-[15px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none shadow-sm transition-all focus:border-seerah-green/50 dark:focus:border-zinc-500 focus:ring-2 focus:ring-seerah-green/20 dark:focus:ring-zinc-700 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-seerah-orange text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-5 w-5 ml-1" strokeWidth={2.5} />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-zinc-400 font-medium tracking-wide">
            Educational content only. Not a source of religious rulings. Consult a scholar.
          </div>
        </div>
      </div>

      {modalOpen && (
        <SourceModal detail={sourceDetail} loading={modalLoading} onClose={() => { setModalOpen(false); setSourceDetail(null); }} />
      )}
    </div>
  );
}
