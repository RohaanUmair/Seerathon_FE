import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seeratkidunya.com"),
  title: "Seerat Ki Dunya — Learn About the Prophet ﷺ",
  description:
    "An AI-powered assistant that answers questions about the Prophet Muhammad ﷺ using authenticated Seerah and Shamail sources.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Seerat Ki Dunya — AI Seerah & Shamail Assistant",
    description:
      "Explore the life, appearance, and historical milestones of the Prophet Muhammad ﷺ using authenticated Seerah and Shamail sources.",
    siteName: "Seerat Ki Dunya",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Seerat Ki Dunya Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seerat Ki Dunya — AI Seerah & Shamail Assistant",
    description:
      "Explore the life, appearance, and historical milestones of the Prophet Muhammad ﷺ using authenticated Seerah and Shamail sources.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
