import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import type { GeminiInterpretation, LucideName, Lang } from "./types";

const ICONS: LucideName[] = [
  "moon",
  "cloud",
  "star",
  "feather",
  "waves",
  "flame",
  "eye",
  "heart",
];

const HEX = /^#[0-9a-fA-F]{6}$/;

const InterpretationSchema = z.object({
  theme: z.string().min(1).max(40),
  interpretation: z.string().min(1).max(160),
  symbols: z.array(z.string().min(1).max(20)).length(3),
  gradient: z.array(z.string().regex(HEX)).length(3),
  icon: z.enum(ICONS as [LucideName, ...LucideName[]]),
  anxietyLevel: z.number().int().min(0).max(100),
});

const SYSTEM_PROMPT_KO = `당신은 시적이고 따뜻한 "꿈 해석가"입니다. 사용자가 들려준 꿈 내용을 바탕으로 상징을 해석하고, 한 장의 시각적 카드로 표현할 수 있도록 구조화된 JSON을 반환합니다.

규칙:
1. 반드시 지정된 JSON 스키마만 반환합니다. 추가 설명, 마크다운 금지.
2. 모든 문자열은 한국어.
3. interpretation은 1문장(최대 60자)의 시적인 해석.
4. theme는 카드 상단에 표시될 2~6자의 키워드.
5. symbols는 꿈 속 핵심 상징 3개 (각 1~5자).
6. gradient는 꿈의 분위기에 어울리는 hex 색상 3개 (어두운 → 밝은 순).
7. icon은 다음 중 하나: moon, cloud, star, feather, waves, flame, eye, heart.
8. anxietyLevel은 0(평온)~100(불안) 정수.`;

const SYSTEM_PROMPT_EN = `You are a poetic, gentle "dream interpreter". Based on the dream the user shares, interpret its symbols and return a structured JSON suitable for rendering as a single visual card.

Rules:
1. Return ONLY the specified JSON schema. No extra prose, no markdown.
2. ALL strings must be in English.
3. interpretation: one poetic sentence, max 80 characters.
4. theme: 1–3 word keyword shown at the top of the card.
5. symbols: exactly 3 short keywords (1–2 words each) from the dream.
6. gradient: 3 hex colors matching the dream's mood (dark → light).
7. icon: one of moon, cloud, star, feather, waves, flame, eye, heart.
8. anxietyLevel: integer 0 (calm) to 100 (anxious).`;

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 가 설정되지 않았습니다.");
  return new GoogleGenerativeAI(key);
}

/** Gemini 멀티모달로 오디오를 한국어 텍스트로 전사 */
export async function transcribeAudioWithGemini(
  audio: Buffer,
  mimeType = "audio/webm",
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: audio.toString("base64"),
      },
    },
    {
      text: "이 오디오는 사용자가 한국어로 말한 꿈 내용입니다. 들리는 그대로 한국어 텍스트로만 받아써 주세요. 다른 설명, 인사말, 따옴표는 절대 추가하지 마세요.",
    },
  ]);
  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini가 음성에서 텍스트를 추출하지 못했습니다.");
  return text;
}

/** Gemini로 -1~+1 감정 점수 산출 (Google NL API 대체) */
export async function analyzeSentimentWithGemini(
  text: string,
): Promise<{ score: number; magnitude: number }> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          score: { type: SchemaType.NUMBER },
          magnitude: { type: SchemaType.NUMBER },
        },
        required: ["score", "magnitude"],
      },
    },
  });
  const result = await model.generateContent(
    `다음 한국어 텍스트의 감정을 분석해 JSON으로 반환하세요. score는 -1(매우 부정)~+1(매우 긍정) 사이 실수, magnitude는 0~5 사이의 감정 강도. 텍스트:\n\n${text}`,
  );
  const json = JSON.parse(result.response.text()) as {
    score: number;
    magnitude: number;
  };
  return {
    score: Math.max(-1, Math.min(1, json.score)),
    magnitude: Math.max(0, json.magnitude),
  };
}

export async function interpretDream(
  text: string,
  lang: Lang = "ko",
): Promise<GeminiInterpretation> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_KO,
    generationConfig: {
      temperature: 0.85,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          theme: { type: SchemaType.STRING },
          interpretation: { type: SchemaType.STRING },
          symbols: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          gradient: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          icon: { type: SchemaType.STRING },
          anxietyLevel: { type: SchemaType.INTEGER },
        },
        required: [
          "theme",
          "interpretation",
          "symbols",
          "gradient",
          "icon",
          "anxietyLevel",
        ],
      },
    },
  });

  const result = await model.generateContent(text);
  const raw = result.response.text();
  const json = JSON.parse(raw);
  return InterpretationSchema.parse(json) as GeminiInterpretation;
}

/** Gemini 호출 실패 시 사용할 안전한 fallback 카드 */
export function fallbackInterpretation(text: string): GeminiInterpretation {
  return {
    theme: "흐릿한 별",
    interpretation: "오늘의 꿈은 잠시 별 너머로 숨었어요.",
    symbols: ["안개", "별", "물결"],
    gradient: ["#0a0a1a", "#1f1b3a", "#5b4b8a"],
    icon: "moon",
    anxietyLevel: 40,
  };
}
