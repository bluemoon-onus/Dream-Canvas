"use client";

import { useEffect, useState } from "react";
import { Volume2, Download } from "lucide-react";
import { DreamRecorder } from "@/components/DreamRecorder";
import { DreamCard } from "@/components/DreamCard";
import { CardGallery } from "@/components/CardGallery";
import { loadCards, saveCard } from "@/lib/storage";
import { speakKorean, playPrefetched } from "@/lib/tts";
import { exportCardAsPng } from "@/lib/exportCard";
import { useLanguage } from "@/components/LanguageProvider";
import type { DreamCard as DreamCardType } from "@/lib/types";

const DAILY_LIMIT = Number(process.env.NEXT_PUBLIC_DAILY_LIMIT_PER_IP ?? "2");

export default function HomePage() {
  const { lang, setLang, t } = useLanguage();
  const [cards, setCards] = useState<DreamCardType[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    setCards(loadCards());
    fetch("/api/usage")
      .then((r) => r.json())
      .then((j) => setUsage({ used: j.used, limit: j.limit }))
      .catch(() => {});
  }, []);

  function handleNewCard(card: DreamCardType, u?: { used: number; limit: number }) {
    const next = saveCard(card);
    setCards(next);
    if (u) setUsage(u);
    if (card.audio) {
      playPrefetched(card.audio);
    } else {
      speakKorean(`${card.theme}. ${card.interpretation}`);
    }
  }

  function replayCard(card: DreamCardType) {
    if (card.audio) {
      playPrefetched(card.audio);
    } else {
      speakKorean(`${card.theme}. ${card.interpretation}`);
    }
  }

  async function downloadImage(card: DreamCardType) {
    try {
      const blob = await exportCardAsPng(card);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dreamcanvas-${card.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[download] 실패:", e);
    }
  }

  const latest = cards[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 py-10">
      <header className="mb-8 flex w-full items-start justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <div className="flex gap-1 rounded-full bg-bg-elev p-1">
          <button
            onClick={() => setLang("ko")}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              lang === "ko" ? "bg-accent text-white" : "text-text-muted"
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => setLang("en")}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              lang === "en" ? "bg-accent text-white" : "text-text-muted"
            }`}
          >
            English
          </button>
        </div>
      </header>

      <DreamRecorder onCard={handleNewCard} usage={usage} />

      {latest && (
        <section className="mt-10 flex w-full flex-col items-center">
          <DreamCard card={latest} />
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => replayCard(latest)}
              className="flex items-center gap-1.5 rounded-full bg-bg-elev px-4 py-2 text-xs text-text-muted hover:text-text-primary"
            >
              <Volume2 size={14} /> {t("replay")}
            </button>
            <button
              onClick={() => downloadImage(latest)}
              className="flex items-center gap-1.5 rounded-full bg-bg-elev px-4 py-2 text-xs text-text-muted hover:text-text-primary"
            >
              <Download size={14} /> {t("download")}
            </button>
          </div>

        </section>
      )}

      {cards.length > 0 && (
        <section className="mt-10 w-full">
          <CardGallery cards={cards} />
        </section>
      )}
    </main>
  );
}
