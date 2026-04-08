import type { DreamCard } from "./types";

const KEY = "dreamcanvas:cards:v1";
const MAX_CARDS = 2; // 현재 + 직전 1장

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadCards(): DreamCard[] {
  const s = storage();
  if (!s) return [];
  try {
    const raw = s.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DreamCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stripHeavy(card: DreamCard): DreamCard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { backgroundImage, backgroundImage512, audio, ...rest } = card;
  return rest as DreamCard;
}

export function saveCard(card: DreamCard): DreamCard[] {
  const s = storage();
  const cards = [card, ...loadCards()].slice(0, MAX_CARDS);
  if (!s) return cards;
  try {
    s.setItem(KEY, JSON.stringify(cards));
  } catch {
    // 용량 초과: 무거운 필드 제거 후 재시도. 그래도 실패하면 조용히 무시.
    try {
      s.setItem(KEY, JSON.stringify(cards.map(stripHeavy)));
    } catch (e) {
      console.warn("[storage] 저장 실패, 메모리에만 유지:", e);
    }
  }
  return cards;
}

export function deleteCard(id: string): DreamCard[] {
  const s = storage();
  const next = loadCards().filter((c) => c.id !== id);
  s?.setItem(KEY, JSON.stringify(next));
  return next;
}
