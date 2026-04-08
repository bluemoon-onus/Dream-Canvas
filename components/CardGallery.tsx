"use client";

import type { DreamCard as DreamCardType } from "@/lib/types";
import { DreamCard } from "./DreamCard";
import { useLanguage } from "./LanguageProvider";

interface Props {
  cards: DreamCardType[];
}

export function CardGallery({ cards }: Props) {
  const { t } = useLanguage();
  if (cards.length === 0) return null;
  return (
    <section className="w-full">
      <h3 className="mb-3 px-1 text-sm font-semibold text-text-muted">
        {t("recent")}
      </h3>
      <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2">
        {cards.slice(0, 3).map((card) => (
          <div key={card.id} className="snap-start shrink-0">
            <DreamCard card={card} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
