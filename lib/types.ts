export type LucideName =
  | "moon"
  | "cloud"
  | "star"
  | "feather"
  | "waves"
  | "flame"
  | "eye"
  | "heart";

export type DreamInput =
  | { type: "audio"; payload: Blob }
  | { type: "text"; payload: string };

export interface GeminiInterpretation {
  theme: string;
  interpretation: string;
  symbols: [string, string, string];
  gradient: [string, string, string];
  icon: LucideName;
  anxietyLevel: number; // 0~100
}

export interface DreamCard extends GeminiInterpretation {
  id: string;
  createdAt: string; // ISO
  rawText: string;
  backgroundImage?: string; // 1024x1024 (default for card)
  backgroundImage512?: string; // 512x512 비교용
  audio?: string; // data URL (audio/wav) prefetched TTS
}

export type Lang = "ko" | "en";
