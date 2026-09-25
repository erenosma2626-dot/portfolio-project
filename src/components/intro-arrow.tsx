"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { content } from "@/content";

export function IntroArrow({ onTrigger }: { onTrigger: () => void }) {
  const [appeared, setAppeared] = useState(false);

  return (
    <motion.button
      type="button"
      aria-label={content.intro.scrollLabel}
      onClick={onTrigger}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
      onAnimationComplete={() => setAppeared(true)}
      className={`mt-10 flex h-10 w-10 items-center justify-center rounded-full border border-navy/30 text-navy ${
        appeared ? "animate-intro-blink" : ""
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </motion.button>
  );
}
