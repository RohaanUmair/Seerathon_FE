"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Shield, Zap, Database, Brain, Clock, FileDown, MessageSquare } from "lucide-react";

export default function AboutPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="min-h-screen bg-seerah-cream dark:bg-zinc-950 transition-colors">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-seerah-border dark:border-zinc-800">
        <div className="mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-seerah-green dark:text-seerah-green-light hover:opacity-80 transition-opacity cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold cursor-pointer" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <span className={theme === "light" ? "text-seerah-orange" : "text-zinc-400 dark:text-zinc-600 text-[14px]"}>☀️</span>
            <div className="h-5 w-9 rounded-full bg-seerah-green flex items-center p-0.5 transition-all duration-300 shadow-inner">
              <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className={theme === "dark" ? "text-blue-400" : "text-zinc-400 text-[14px]"}>🌙</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-seerah-border dark:border-zinc-800 flex items-center justify-center p-2.5">
              <Image src="/logo.png" alt="Seerat Ki Dunya" width={48} height={48} className="object-contain" priority />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-seerah-green dark:text-seerah-green-light tracking-tight">
            Seerat Ki Dunya
          </h1>
        </section>

        {/* ── How It Works (Pipeline) ────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-seerah-green dark:text-emerald-400" /> How It Works
          </h2>
          <div className="rounded-2xl border border-seerah-border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <div className="flex flex-col gap-1">
              {[
                { step: "1", label: "User asks a question", sub: "English, Roman Urdu, or Arabic", color: "bg-blue-500" },
                { step: "2", label: "Input Guardrail blocks fatwa requests", sub: "LLM intent classifier — not keyword matching", color: "bg-amber-500" },
                { step: "3", label: "Agent searches live corpus via tool-calling", sub: "Shamail & Seerah Timeline APIs with auto-retry", color: "bg-emerald-600" },
                { step: "4", label: "Output Guardrail validates response", sub: "Catches any leaked religious rulings", color: "bg-amber-500" },
                { step: "5", label: "Cited answer delivered to user", sub: "With interactive source cards and PDF export", color: "bg-teal-600" },
              ].map(({ step, label, sub, color }, i) => (
                <div key={step}>
                  <div className="flex items-start gap-3 py-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${color} text-white text-[11px] font-bold mt-0.5`}>{step}</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</p>
                    </div>
                  </div>
                  {i < 4 && <div className="ml-[11px] h-3 w-px bg-zinc-200 dark:bg-zinc-700" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Key Differentiators ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">What Sets Us Apart</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card
              icon={<Shield className="w-4 h-4 text-red-500" />}
              title="Dual AI Safety Guardrails"
              desc="Input & output guardrails using LLM-as-a-Judge prevent unauthorized fatwas — even when rephrased indirectly."
            />
            <Card
              icon={<Database className="w-4 h-4 text-blue-500" />}
              title="Zero Hallucination"
              desc="Every answer is grounded in authenticated Shamail & Seerah sources with primary source citations. No training data leakage."
            />
            <Card
              icon={<Zap className="w-4 h-4 text-seerah-orange" />}
              title="3-Tier LLM Failover"
              desc="Gemini 2.5 Flash → Groq Qwen 27B → Groq 20B. Guarantees zero downtime during live demos."
            />
            <Card
              icon={<MessageSquare className="w-4 h-4 text-purple-500" />}
              title="Intelligent Retry"
              desc="Agent autonomously retries failed searches with synonyms and translates Roman Urdu to English search terms."
            />
            <Card
              icon={<Clock className="w-4 h-4 text-teal-500" />}
              title="25s Timeout + Auto-Retry"
              desc="AbortController safeguard with one-click retry and session sanitization for interrupted requests."
            />
            <Card
              icon={<FileDown className="w-4 h-4 text-indigo-500" />}
              title="Vector PDF Export"
              desc="Print individual answers as branded PDF study briefs with watermark, citations, and verified disclaimer."
            />
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="border-t border-seerah-border dark:border-zinc-800 pt-6 pb-4 text-center space-y-2">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Built by <span className="font-semibold text-zinc-600 dark:text-zinc-300">Rohaan Umair</span> • Educational content only • Not a source of religious rulings
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-seerah-green dark:text-seerah-green-light hover:opacity-80 transition-opacity cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Chat
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Card({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-seerah-border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">{desc}</p>
    </div>
  );
}
