"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Choice = "system" | "light" | "dark";
const KEY = "audit-theme";
const NEXT: Record<Choice, Choice> = { system: "light", light: "dark", dark: "system" };

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(choice: Choice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Light, dark, or follow the system. The head script in layout.tsx applies it before first paint. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    setChoice(read());
  }, []);

  useEffect(() => {
    if (choice !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => apply("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [choice]);

  const cycle = () => {
    const next = NEXT[choice];
    setChoice(next);
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
    apply(next);
  };

  const Icon = choice === "light" ? Sun : choice === "dark" ? Moon : Monitor;
  const label = choice === "system" ? "Theme: system" : `Theme: ${choice}`;
  return (
    <button
      type="button"
      onClick={cycle}
      title={`${label} (click to change)`}
      aria-label={`${label}. Change theme`}
      className={`inline-grid size-8 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-hover hover:text-ink ${className}`}
    >
      <Icon className="size-[15px]" strokeWidth={1.75} />
    </button>
  );
}
