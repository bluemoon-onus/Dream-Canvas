"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Download, User } from "lucide-react";
import { DreamRecorder } from "@/components/DreamRecorder";
import { DreamCard } from "@/components/DreamCard";
import { CardGallery } from "@/components/CardGallery";
import { loadCards, saveCard } from "@/lib/storage";
import { speakKorean, playPrefetched } from "@/lib/tts";
import { exportCardAsPng } from "@/lib/exportCard";
import { useLanguage } from "@/components/LanguageProvider";
import { ProfileSheet } from "@/components/ProfileSheet";
import { loadProfile, saveProfile, profileToPersona } from "@/lib/profile";
import type { UserProfile } from "@/lib/profile";
import type { DreamCard as DreamCardType } from "@/lib/types";

const DAILY_LIMIT = Number(process.env.NEXT_PUBLIC_DAILY_LIMIT_PER_IP ?? "2");

export default function HomePage() {
  const { lang, setLang, t } = useLanguage();
  const [cards, setCards] = useState<DreamCardType[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const gateResolverRef = useRef<((personaOrNull: string | null) => void) | null>(null);

  useEffect(() => {
    setCards(loadCards());
    setProfile(loadProfile());
    fetch("/api/usage")
      .then((r) => r.json())
      .then((j) => setUsage({ used: j.used, limit: j.limit }))
      .catch(() => {});
  }, []);

  // 생성 직전 호출됨. 프로필 시트를 띄우고, 사용자가 저장/확인할 때까지 대기.
  function gateProfile(): Promise<string | null> {
    return new Promise((resolve) => {
      gateResolverRef.current = resolve;
      setShowProfile(true);
    });
  }

  function handleProfileSave(p: UserProfile) {
    saveProfile(p);
    setProfile(p);
    setShowProfile(false);
    gateResolverRef.current?.(profileToPersona(p));
    gateResolverRef.current = null;
  }

  function handleProfileClose() {
    setShowProfile(false);
    gateResolverRef.current?.(null);
    gateResolverRef.current = null;
  }

  const persona = profile ? profileToPersona(profile) : "";

  function handleNewCard(card: DreamCardType, u?: { used: number; limit: number }) {
    const playAudio = () => {
      if (card.audio) playPrefetched(card.audio);
      else speakKorean(`${card.theme}. ${card.interpretation}`);
    };
    const commit = () => {
      const next = saveCard(card);
      setCards(next);
      if (u) setUsage(u);
      playAudio();
    };
    if (card.backgroundImage) {
      const img = new Image();
      img.onload = commit;
      img.onerror = commit;
      img.src = card.backgroundImage;
    } else {
      commit();
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProfile(true)}
            aria-label={t("profile")}
            className="rounded-full bg-bg-elev p-2 text-text-muted hover:text-text-primary"
          >
            <User size={14} />
          </button>
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
        </div>
      </header>

      <DreamRecorder
        onCard={handleNewCard}
        usage={usage}
        persona={persona}
        beforeGenerate={gateProfile}
      />

      {!latest && (
        <section className="mt-10 flex w-full flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sample-main.png"
            alt="sample dream"
            className="h-[560px] w-[400px] max-w-[92vw] rounded-3xl object-cover opacity-80 shadow-2xl shadow-black/50"
          />
          <p className="mt-3 text-[11px] text-text-muted">sample</p>
        </section>
      )}

      {showProfile && (
        <ProfileSheet
          initial={profile}
          onSave={handleProfileSave}
          onClose={handleProfileClose}
          canClose={true}
          reconfirm={!!profile}
        />
      )}

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
