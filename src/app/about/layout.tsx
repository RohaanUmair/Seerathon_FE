import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Seerat Ki Dunya Architecture & Safety",
  description:
    "Explore the AI safety guardrails, multi-tier LLM failover architecture, and zero-hallucination corpus grounding behind Seerat Ki Dunya.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
