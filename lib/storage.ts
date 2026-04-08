import type { DreamCard } from "./types";

const KEY = "dreamcanvas:cards:v1";
const MAX_CARDS = 3;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
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

export function saveCard(card: DreamCard): DreamCard[] {
  const s = storage();
  const cards = [card, ...loadCards()].slice(0, MAX_CARDS);
  if (!s) return cards;
  try {
    s.setItem(KEY, JSON.stringify(cards));
  } catch {
    const trimmed = cards.slice(0, Math.max(1, cards.length - 1));
    s.setItem(KEY, JSON.stringify(trimmed));
    return trimmed;
  }
  return cards;
}

export function deleteCard(id: string): DreamCard[] {
  const s = storage();
  const next = loadCards().filter((c) => c.id !== id);
  s?.setItem(KEY, JSON.stringify(next));
  return next;
}
