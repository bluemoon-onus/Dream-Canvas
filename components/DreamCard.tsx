"use client";

import type { DreamCard as DreamCardType } from "@/lib/types";
import { DreamIcon } from "./DreamIcon";
import { AnxietyGauge } from "./AnxietyGauge";
import { useLanguage } from "./LanguageProvider";

interface Props {
  card: DreamCardType;
  compact?: boolean;
}

export function DreamCard({ card, compact = false }: Props) {
  const { lang } = useLanguage();
  const [c1, c2, c3] = card.gradient;
  const dateLabel = new Date(card.createdAt).toLocaleDateString(
    lang === "en" ? "en-US" : "ko-KR",
    { month: "2-digit", day: "2-digit" },
  );

  const sizeClass = compact
    ? "h-[224px] w-[160px] rounded-2xl"
    : "h-[560px] w-[400px] max-w-[92vw] rounded-3xl";

  return (
    <article
      className={`relative overflow-hidden text-white shadow-2xl shadow-black/50 animate-card-in ${sizeClass}`}
      style={{ background: `linear-gradient(160deg, ${c1}, ${c2}, ${c3})` }}
    >
      {card.backgroundImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.backgroundImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50" />

      <div
        className={`relative flex h-full flex-col ${
          compact ? "p-3" : "p-7"
        }`}
      >
        <div className="flex items-start justify-between">
          <DreamIcon
            name={card.icon}
            size={compact ? 28 : 64}
            strokeWidth={1.5}
            className="opacity-90"
          />
          <span
            className={`opacity-70 ${compact ? "text-[9px]" : "text-xs"}`}
          >
            {dateLabel}
          </span>
        </div>

        <div className="mt-auto">
          <h2
            className={`font-bold tracking-tight ${
              compact ? "text-base" : "text-3xl"
            }`}
          >
            {card.theme}
          </h2>
          {!compact && (
            <p className="mt-3 text-base leading-relaxed text-white/95">
              {card.interpretation}
            </p>
          )}

          <div
            className={`flex flex-wrap gap-1.5 ${
              compact ? "mt-2" : "mt-4"
            }`}
          >
            {card.symbols.map((s) => (
              <span
                key={s}
                className={`rounded-full bg-white/15 backdrop-blur-sm ${
                  compact ? "px-1.5 py-0.5 text-[9px]" : "px-3 py-1 text-xs"
                }`}
              >
                #{s}
              </span>
            ))}
          </div>

          {!compact && (
            <div className="mt-5">
              <AnxietyGauge value={card.anxietyLevel} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
