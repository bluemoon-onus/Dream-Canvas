"use client";

import type { DreamCard as DreamCardType } from "@/lib/types";
import { DreamCard } from "./DreamCard";
import { useLanguage } from "./LanguageProvider";

interface Props {
  cards: DreamCardType[];
}

export function CardGallery({ cards }: Props) {
  const { t } = useLanguage();
  // 최신 카드는 상단에 따로 표시되므로 제외
  const previous = cards.slice(1);
  return (
    <section className="w-full">
      <h3 className="mb-3 px-1 text-sm font-semibold text-text-muted">
        {t("recent")}
      </h3>
      <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2">
        {previous.length === 0 ? (
          <div className="snap-start shrink-0">
            <div className="flex h-[210px] w-[150px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-bg-elev/40 text-[11px] text-text-muted">
              {t("empty")}
            </div>
          </div>
        ) : (
          previous.map((card) => (
            <div key={card.id} className="snap-start shrink-0">
              <DreamCard card={card} compact />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
