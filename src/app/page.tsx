"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image";
import { BookOpen, Send, ChevronRight, Copy, Check, ChevronDown, Plus, Trash2, MessageSquare, Menu, X, RotateCcw, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ── Types ─────────────────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  citation: string | null;
  type: "answer" | "fatwa_redirect" | "fallback";
  timestamp?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface ApiResponse {
  answer: string;
  citation: string | null;
  type: "answer" | "fatwa_redirect" | "fallback";
}

interface ContentSection {
  title: string;
  text: string;
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
  sections?: ContentSection[];
  ur_sections?: ContentSection[];
  year?: string;
  umar_mubarak?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STORAGE_KEY = "seerathon_chats";

/* ── Helpers ───────────────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateChatTitle(firstMessage: string): string {
  const clean = firstMessage.trim();
  if (clean.length <= 30) return clean;
  const truncated = clean.slice(0, 30);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 15) {
    return truncated.slice(0, lastSpace) + "...";
  }
  return truncated + "...";
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

function saveChatsToStorage(updatedChats: Record<string, ChatSession>, activeId: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        chats: updatedChats,
        activeChatId: activeId,
      })
    );
  } catch {}
}

/* ── Components ────────────────────────────────────────────────────── */


/** App-like Top Header */
function AppHeader({
  theme,
  setTheme,
  onToggleSidebar,
}: {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white dark:bg-zinc-950 border-b border-seerah-border dark:border-zinc-800 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white font-medium text-base shadow-xs">
            R
          </div>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm hidden sm:inline">Rohaan Umair</span>
        </div>
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
        <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded bg-seerah-green/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-seerah-green dark:text-seerah-green-light">
                  {detail.source}
                </span>
                {detail.category && (
                  <span className="inline-flex items-center rounded bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    {detail.category}
                  </span>
                )}
                {detail.year && (
                  <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-seerah-orange dark:text-amber-400">
                    {detail.year} CE
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-seerah-green dark:text-seerah-green-light">{detail.title}</h2>
              {detail.urdu_title && <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium font-urdu" dir="rtl">{detail.urdu_title}</p>}
            </div>

            {/* Sectioned content (Timeline entries) */}
            {detail.sections && detail.sections.length > 0 ? (
              <div className="space-y-4">
                {detail.sections.map((sec, i) => (
                  <div key={i} className="rounded-2xl border border-seerah-border dark:border-zinc-800 bg-seerah-card dark:bg-zinc-800 p-5 space-y-3">
                    {sec.title && <h3 className="text-sm font-bold text-seerah-green dark:text-seerah-green-light">{sec.title}</h3>}
                    <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line">{sec.text}</p>
                    {detail.ur_sections?.[i]?.text && (
                      <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 border-t border-seerah-border dark:border-zinc-700 pt-3 font-urdu" dir="rtl">
                        {detail.ur_sections[i].text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-seerah-border dark:border-zinc-800 bg-seerah-card dark:bg-zinc-800 p-5 space-y-4">
                <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line">{detail.text}</p>
                {detail.urdu_text && (
                  <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 border-t border-seerah-border dark:border-zinc-700 pt-4 font-urdu" dir="rtl">
                    {detail.urdu_text}
                  </p>
                )}
              </div>
            )}

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
    <div className="flex items-start gap-4 animate-fade-in-up px-5 md:px-8">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white dark:bg-zinc-900 border border-seerah-border dark:border-zinc-800 shadow-sm flex items-center justify-center p-1.5 mt-0.5">
         <Image src="/logo.png" alt="Seerat Ki Dunya" width={28} height={28} className="object-contain" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-seerah-green dark:text-seerah-green-light">
          <span>Searching authentic corpus entries</span>
          <span className="dot-pulse flex gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-seerah-orange" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-seerah-orange" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-seerah-orange" />
          </span>
        </div>
        <p className="text-[12px] text-zinc-400 dark:text-zinc-500">Querying Shamail &amp; Seerah Timeline data...</p>
      </div>
    </div>
  );
}

/** Single chat message bubble */
function MessageBubble({
  msg,
  onSourceClick,
  onRetry,
  userPromptForRetry,
  onDownloadPdf,
}: {
  msg: ChatMessage;
  onSourceClick: (sourceType: string, sourceId: string) => void;
  onRetry?: (promptText: string) => void;
  userPromptForRetry?: string;
  onDownloadPdf?: (userPrompt: string, msg: ChatMessage) => void;
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
      <div id={`msg-${msg.id}`} className="flex flex-col items-end animate-fade-in-up px-5 md:px-8 space-y-1">
        <div className="max-w-[80%] rounded-[24px] bg-zinc-100 dark:bg-zinc-800 px-5 py-3 text-[15px] text-zinc-900 dark:text-zinc-100 leading-relaxed shadow-sm">
          {msg.text}
        </div>
        <div className="flex items-center gap-2 px-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>{msg.timestamp}</span>
          <button
            onClick={handleCopy}
            title="Copy message"
            className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  const isFatwa = msg.type === "fatwa_redirect";
  const isFallback = msg.type === "fallback";

  if (msg.role === "bot" && !msg.text) {
    return <LoadingBubble />;
  }

  return (
    <div id={`msg-${msg.id}`} className="flex items-start gap-4 animate-fade-in-up px-5 md:px-8">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white dark:bg-zinc-900 border border-seerah-border dark:border-zinc-800 shadow-sm flex items-center justify-center p-1.5 mt-0.5">
        {isFatwa ? (
          <span className="text-seerah-orange font-bold text-sm">⚠</span>
        ) : (
          <Image src="/logo.png" alt="Seerat Ki Dunya" width={28} height={28} className="object-contain" />
        )}
      </div>

      <div className="max-w-[85%] space-y-2 pt-1">
        <div
          className={`text-[15px] leading-relaxed prose-chat ${
            isFatwa
              ? "text-amber-800 dark:text-amber-500 font-medium"
              : isFallback
                ? "text-zinc-600 dark:text-zinc-400"
                : "text-zinc-800 dark:text-zinc-200"
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
        </div>

        {/* Retry Button for Fallback / Timed Out / Error Messages */}
        {isFallback && onRetry && userPromptForRetry && (
          <button
            onClick={() => onRetry(userPromptForRetry)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all shadow-xs cursor-pointer mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Request</span>
          </button>
        )}

        {/* Timestamp & Copy Action & Download PDF & Sources Flag Toggle */}
        <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>{msg.timestamp}</span>
          <button
            onClick={handleCopy}
            title="Copy message"
            className="flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5 cursor-pointer"
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

          {/* Download Answer as PDF */}
          {!isFatwa && !isFallback && msg.text && onDownloadPdf && (
            <button
              onClick={() => onDownloadPdf(userPromptForRetry || "", msg)}
              title="Download Answer as PDF"
              className="flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          )}

          {/* Expand / Close Sources Flag Button */}
          {citationLines.length > 0 && (
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1.5 ml-1 rounded-full border border-seerah-border dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 px-3 py-1 text-[11px] font-semibold text-seerah-green dark:text-seerah-green-light hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-xs cursor-pointer"
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

function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return (messages || []).map((m) => {
    if (m.role === "bot" && (!m.text || m.text.trim() === "")) {
      return {
        ...m,
        text: "The request was interrupted before a response could be generated. Please ask your question again.",
        type: "fallback",
        citation: null,
      };
    }
    return m;
  });
}

/* ── Main Page ─────────────────────────────────────────────────────── */
export default function Home() {
  const [chats, setChats] = useState<Record<string, ChatSession>>({});
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [sourceDetail, setSourceDetail] = useState<SourceDetail | null>(null);
  const [printTarget, setPrintTarget] = useState<{ userPrompt: string; msg: ChatMessage } | null>(null);

  // Trigger window.print when a single answer is targeted for PDF download
  useEffect(() => {
    if (printTarget) {
      const timer = setTimeout(() => {
        window.print();
      }, 80);
      const handleAfterPrint = () => {
        setPrintTarget(null);
      };
      window.addEventListener("afterprint", handleAfterPrint);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [printTarget]);

  const handleDownloadPdf = (userPrompt: string, msg: ChatMessage) => {
    setPrintTarget({ userPrompt, msg });
  };

  // Auto-open sidebar on desktop screens
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Hydrate state from localStorage on mount (restore recent chats, but start on a fresh new chat)
  useEffect(() => {
    const timer = setTimeout(() => {
      const freshId = uid();
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.chats && typeof parsed.chats === "object" && Object.keys(parsed.chats).length > 0) {
            const sanitizedChats: Record<string, ChatSession> = {};
            let hasChanges = false;

            for (const [id, chat] of Object.entries(parsed.chats as Record<string, ChatSession>)) {
              const cleanMsgs = sanitizeMessages(chat.messages);
              if (cleanMsgs !== chat.messages) {
                hasChanges = true;
              }
              sanitizedChats[id] = {
                ...chat,
                messages: cleanMsgs,
              };
            }

            setChats(sanitizedChats);
            setActiveChatId(freshId);
            setMessages([]);

            if (hasChanges) {
              saveChatsToStorage(sanitizedChats, freshId);
            }
            return;
          }
        }
      } catch {}

      // Initial empty state if no saved chats
      setActiveChatId(freshId);
      setMessages([]);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Auto-scroll logic
  useEffect(() => {
    const timer = setTimeout(() => {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg && scrollRef.current) {
        const el = document.getElementById(`msg-${lastUserMsg.id}`);
        if (el) {
          const elRect = el.getBoundingClientRect();
          const scrollRect = scrollRef.current.getBoundingClientRect();
          const targetTop = elRect.top - scrollRect.top + scrollRef.current.scrollTop - 16;
          scrollRef.current.scrollTo({
            top: targetTop > 0 ? targetTop : 0,
            behavior: "smooth",
          });
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Switch Chat
  const handleSelectChat = (id: string) => {
    if (id === activeChatId) return;
    setActiveChatId(id);
    const selectedMsgs = chats[id]?.messages || [];
    setMessages(sanitizeMessages(selectedMsgs));
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // Create New Chat
  const handleNewChat = () => {
    const newId = uid();
    setActiveChatId(newId);
    setMessages([]);
    setIsSidebarOpen(false);
    inputRef.current?.focus();
  };

  // Delete Chat
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...chats };
    delete updated[id];
    setChats(updated);

    if (id === activeChatId) {
      // Deleting the currently active chat opens a new blank chat
      const newId = uid();
      setActiveChatId(newId);
      setMessages([]);
      saveChatsToStorage(updated, newId);
    } else {
      // Deleting a non-active chat preserves current active chat
      saveChatsToStorage(updated, activeChatId);
    }
  };

  const REQUEST_TIMEOUT_MS = 25000; // 25s timeout for AI response

  async function executeChatRequest(promptText: string, isRetry: boolean = false) {
    if (!promptText || loading) return;

    let currentMessages = [...messages];
    let botMsgId = uid();

    if (isRetry) {
      // Find and remove any trailing empty/fallback bot message or convert it to loading state
      const lastMsg = currentMessages[currentMessages.length - 1];
      if (lastMsg && lastMsg.role === "bot") {
        botMsgId = lastMsg.id;
        currentMessages = currentMessages.map((m) =>
          m.id === botMsgId
            ? { ...m, text: "", type: "answer", citation: null, timestamp: getCurrentTime() }
            : m
        );
      } else {
        const botMsg: ChatMessage = {
          id: botMsgId,
          role: "bot",
          text: "",
          citation: null,
          type: "answer",
          timestamp: getCurrentTime(),
        };
        currentMessages.push(botMsg);
      }
    } else {
      const userMsg: ChatMessage = { id: uid(), role: "user", text: promptText, citation: null, type: "answer", timestamp: getCurrentTime() };
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: "bot",
        text: "",
        citation: null,
        type: "answer",
        timestamp: getCurrentTime(),
      };
      currentMessages = [...currentMessages, userMsg, botMsg];
      setInput("");
    }

    setMessages(currentMessages);
    setLoading(true);

    const historyPayload = currentMessages
      .slice(0, currentMessages.findIndex((m) => m.id === botMsgId))
      .filter((m) => m.text && m.text.trim() !== "")
      .slice(-8)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: promptText, history: historyPayload }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data: ApiResponse = await res.json();

      const updatedMessages = currentMessages.map((m) =>
        m.id === botMsgId
          ? {
              ...m,
              text: data.answer,
              citation: data.citation,
              type: data.type,
            }
          : m
      );

      setMessages(updatedMessages);

      // Persist active chat to state & localStorage
      setChats((prevChats) => {
        const updatedChats = { ...prevChats };
        const isFirstMessage = !updatedChats[activeChatId];
        const title = isFirstMessage ? generateChatTitle(promptText) : updatedChats[activeChatId].title;

        // Check if 20-chat cap is reached when adding a brand new chat entry
        if (isFirstMessage && Object.keys(updatedChats).length >= 20) {
          const sorted = Object.values(updatedChats).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          if (sorted.length > 0) {
            delete updatedChats[sorted[0].id]; // Drop oldest chat
          }
        }

        updatedChats[activeChatId] = {
          id: activeChatId,
          title,
          messages: updatedMessages,
          createdAt: updatedChats[activeChatId]?.createdAt || new Date().toISOString(),
        };

        saveChatsToStorage(updatedChats, activeChatId);
        return updatedChats;
      });

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = (err instanceof Error && err.name === "AbortError") || (err as { name?: string })?.name === "AbortError";
      const errorText = isTimeout
        ? "Request timed out. The server took too long to respond. Please try again."
        : "Sorry, I couldn't reach the server. Please check your connection and try again.";

      const errorMessages = currentMessages.map((m) =>
        m.id === botMsgId
          ? {
              ...m,
              text: errorText,
              citation: null,
              type: "fallback" as const,
            }
          : m
      );
      setMessages(errorMessages);

      setChats((prevChats) => {
        const updatedChats = { ...prevChats };
        const isFirstMessage = !updatedChats[activeChatId];
        const title = isFirstMessage ? generateChatTitle(promptText) : updatedChats[activeChatId].title;

        updatedChats[activeChatId] = {
          id: activeChatId,
          title,
          messages: errorMessages,
          createdAt: updatedChats[activeChatId]?.createdAt || new Date().toISOString(),
        };

        saveChatsToStorage(updatedChats, activeChatId);
        return updatedChats;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    await executeChatRequest(text, false);
  }

  const handleRetry = (promptText: string) => {
    executeChatRequest(promptText, true);
  };

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

  const sortedChatList = Object.values(chats).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <div className="flex h-screen bg-seerah-cream dark:bg-zinc-950 overflow-hidden transition-colors print:hidden">
        
        {/* ── Claude-style Sidebar ────────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-zinc-900 border-r border-seerah-border dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidebar Header with New Chat */}
          <div className="p-4 border-b border-seerah-border dark:border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-seerah-green dark:bg-teal-700 hover:bg-seerah-green/90 dark:hover:bg-teal-600 text-white px-4 py-2.5 text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Recent Conversations
            </div>
            {sortedChatList.length === 0 ? (
              <div className="p-4 text-xs text-zinc-400 dark:text-zinc-500 text-center italic">
                No conversations yet. Send a message to start!
              </div>
            ) : (
              sortedChatList.map((chat) => {
                const isActive = chat.id === activeChatId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all ${
                      isActive
                        ? "bg-seerah-green/10 dark:bg-zinc-800 text-seerah-green dark:text-seerah-green-light font-semibold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-6">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? "text-seerah-green dark:text-seerah-green-light" : "text-zinc-400 dark:text-zinc-500"}`} />
                      <span className="truncate text-[13px]">{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity cursor-pointer"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-seerah-border dark:border-zinc-800 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-seerah-orange flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">Seerat Ki Dunya</h4>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">AI Seerah Assistant</p>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden cursor-pointer"
          />
        )}

        {/* ── Main Chat Area ──────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ${isSidebarOpen ? "md:ml-72" : "ml-0"}`}>
          <AppHeader
            theme={theme}
            setTheme={setTheme}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* Persistent Notice Banner */}
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center justify-center gap-2 shrink-0">
            <span className="bg-amber-500/20 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
              Notice
            </span>
            <span>Educational &amp; historical content only. Not a source of religious rulings (Fatwas). Consult a scholar.</span>
          </div>

          {/* Chat scroll area with watermark */}
          <div ref={scrollRef} className="relative flex-1 overflow-y-auto pt-8 pb-[170px] space-y-8 px-4 sm:px-6">
            {/* Watermark logo */}
            {messages.length > 0 && (
              <div className={`pointer-events-none fixed inset-0 flex items-center justify-center z-0 transition-all duration-300 ${isSidebarOpen ? "md:ml-72" : "ml-0"}`}>
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
                        className="rounded-xl border border-seerah-border dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm transition-all hover:border-seerah-green/30 dark:hover:border-zinc-600 hover:text-seerah-green dark:hover:text-zinc-100 text-left flex justify-between items-center cursor-pointer"
                      >
                        <span>{q}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-8 w-full max-w-3xl mx-auto">
                {messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const userPrompt = prevMsg && prevMsg.role === "user" ? prevMsg.text : "";
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      onSourceClick={handleSourceClick}
                      onRetry={handleRetry}
                      userPromptForRetry={userPrompt}
                      onDownloadPdf={handleDownloadPdf}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fixed Input Area above Bottom Nav */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-seerah-cream dark:from-zinc-950 via-seerah-cream dark:via-zinc-950 to-transparent pt-6 pb-6 px-6 z-20">
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
                  className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-seerah-orange text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5 ml-1" strokeWidth={2.5} />
                </button>
              </form>
              <div className="mt-2.5 flex flex-col items-center gap-0.5 text-center">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-semibold text-[11px]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Answers sourced strictly from authentic Shamail &amp; Seerah Timeline corpus
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
                  Educational content only • Not a source of religious rulings • Consult a qualified scholar
                </div>
              </div>
            </div>
          </div>
        </div>

        {modalOpen && (
          <SourceModal detail={sourceDetail} loading={modalLoading} onClose={() => { setModalOpen(false); setSourceDetail(null); }} />
        )}
      </div>

      {/* ── Printable Single-Answer Report (Visible only during window.print) ── */}
      {printTarget && (
        <div id="printable-single-answer" className="hidden print:block font-sans text-black bg-white p-8 max-w-2xl mx-auto relative">
          {/* Centered Watermark on Print */}
          <div className="print-watermark-overlay">
            <Image src="/logo.png" alt="" width={380} height={380} className="object-contain opacity-[0.05]" priority />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Document Header */}
            <div className="flex items-center justify-between border-b-2 border-emerald-900/20 pb-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Seerat Ki Dunya" width={44} height={44} className="object-contain" priority />
                <div>
                  <h1 className="text-xl font-bold text-emerald-950 tracking-tight">Seerat Ki Dunya</h1>
                  <p className="text-xs text-zinc-500 font-medium">AI Seerah &amp; Shamail Research Report</p>
                </div>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p className="font-semibold text-zinc-700">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>{printTarget.msg.timestamp || getCurrentTime()}</p>
              </div>
            </div>

            {/* Question Box */}
            {printTarget.userPrompt && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-4 space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Question:</span>
                <p className="text-sm font-semibold text-zinc-900">{printTarget.userPrompt}</p>
              </div>
            )}

            {/* Answer Content */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Authenticated Response:</span>
              <div className="prose-chat text-sm leading-relaxed text-zinc-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{printTarget.msg.text}</ReactMarkdown>
              </div>
            </div>

            {/* Source Citation Box */}
            {printTarget.msg.citation && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2 mt-4">
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📜</span> Authentic Primary Source Reference(s):
                </span>
                <div className="space-y-1 text-xs text-zinc-800 font-mono">
                  {printTarget.msg.citation.split('\n').filter(Boolean).map((line, idx) => (
                    <p key={idx} className="bg-white p-2 rounded border border-zinc-200/80">{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Footer Disclaimer */}
            <div className="border-t border-zinc-200 pt-4 text-center text-[10px] text-zinc-500 space-y-1">
              <p className="font-semibold text-emerald-900">Verified Seerah &amp; Shamail Historical Corpus</p>
              <p>Educational &amp; historical content only • Not a source of religious rulings (Fatwas) • Consult a qualified Islamic scholar</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
