import type { Metadata } from "next";
import { PT_Serif, Source_Serif_4 } from "next/font/google";
import { content } from "@/content";
import { InlineScript } from "@/components/inline-script";
import { SceneBackground } from "@/components/scene/scene-background";
import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/smooth-scroll";
import { introBootstrapScript } from "@/lib/intro";
import "./globals.css";

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["700"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const { meta } = content;

export const metadata: Metadata = {
  title: { default: meta.siteTitle, template: "%s — Eren Osma" },
  description: meta.description,
  openGraph: {
    title: meta.siteTitle,
    description: meta.description,
    type: "website",
    locale: content.locale === "en" ? "en_US" : "tr_TR",
    siteName: "Eren Osma",
  },
  twitter: { card: "summary", title: meta.siteTitle, description: meta.description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={content.locale}
      className={`${ptSerif.variable} ${sourceSerif4.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={introBootstrapScript} />
      </head>
      <body className="min-h-full flex flex-col">
        <SceneBackground />
        <SiteHeader />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
