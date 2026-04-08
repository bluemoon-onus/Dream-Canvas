import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { interpretDream, fallbackInterpretation } from "@/lib/gemini";
import { generateDreamImage } from "@/lib/nanoBanana";
import { synthesizeKoreanSpeech } from "@/lib/geminiTts";
import { getClientIp, checkAndIncrement } from "@/lib/rateLimit";
import type { DreamCard, Lang } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; lang?: Lang };
    const text = (body.text ?? "").trim();
    const lang: Lang = body.lang === "en" ? "en" : "ko";
    if (!text) {
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? "Please tell me your dream first."
              : "꿈 내용을 입력해주세요.",
        },
        { status: 400 },
      );
    }

    // IP 일일 제한
    const ip = getClientIp(req);
    const limit = checkAndIncrement(ip);
    if (!limit.ok) {
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? `Daily limit (${limit.limit}) reached. Please try again tomorrow.`
              : `오늘 생성 한도(${limit.limit}회)를 초과했어요. 내일 다시 시도해주세요.`,
        },
        { status: 429 },
      );
    }

    // 해석/이미지(512+1024)/TTS 병렬. TTS는 해석 완료 후 시작.
    const interpretationPromise = withTimeout(
      interpretDream(text, lang),
      30_000,
      "gemini-interpret",
    );
    const image1024Promise = withTimeout(
      generateDreamImage({
        rawText: text,
        interpretation: "",
        gradient: ["#0a0a1a", "#1f1b3a", "#5b4b8a"],
        size: 1024,
      }),
      55_000,
      "nano-banana-1024",
    );
    const ttsPromise = interpretationPromise
      .then((i) =>
        withTimeout(
          synthesizeKoreanSpeech(`${i.theme}. ${i.interpretation}`, lang),
          25_000,
          "gemini-tts",
        ),
      )
      .catch(() => null as Buffer | null);

    const [interpretationResult, image1024Result, ttsResult] =
      await Promise.allSettled([
        interpretationPromise,
        image1024Promise,
        ttsPromise,
      ]);

    if (interpretationResult.status === "rejected") {
      console.error("[dream] 해석 실패:", interpretationResult.reason);
    }
    if (image1024Result.status === "rejected") {
      console.error("[dream] 1024 이미지 실패:", image1024Result.reason);
    }

    const interpretation =
      interpretationResult.status === "fulfilled"
        ? interpretationResult.value
        : fallbackInterpretation(text);

    const backgroundImage =
      image1024Result.status === "fulfilled" ? image1024Result.value : undefined;
    // 512는 클라이언트에서 canvas 다운스케일로 생성 (quota 절약)
    const backgroundImage512 = undefined;

    const audioBuf =
      ttsResult.status === "fulfilled" && ttsResult.value
        ? ttsResult.value
        : null;
    const audio = audioBuf
      ? `data:audio/wav;base64,${audioBuf.toString("base64")}`
      : undefined;

    const card: DreamCard = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      rawText: text,
      ...interpretation,
      backgroundImage,
      backgroundImage512,
      audio,
    };

    return NextResponse.json({
      card,
      usage: { used: limit.used, limit: limit.limit },
      debug: {
        interpretationOk: interpretationResult.status === "fulfilled",
        image1024Ok: Boolean(backgroundImage),
        image512Ok: Boolean(backgroundImage512),
      },
    });
  } catch (err) {
    console.error("[dream] 라우트 에러:", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
