"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/types";
import { t as translate } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx | null>(null);
const KEY = "dreamcanvas:lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(KEY)) as Lang | null;
    if (saved === "ko" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }

  const value: Ctx = {
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
