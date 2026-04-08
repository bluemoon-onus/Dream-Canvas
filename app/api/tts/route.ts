import { NextResponse } from "next/server";
import { synthesizeKoreanSpeech } from "@/lib/geminiTts";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "text 필요" }, { status: 400 });
    }
    const wav = await synthesizeKoreanSpeech(text.trim());
    return new Response(new Uint8Array(wav), {
      status: 200,
      headers: {
        "content-type": "audio/wav",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[tts] 실패:", err);
    const message = err instanceof Error ? err.message : "TTS 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
