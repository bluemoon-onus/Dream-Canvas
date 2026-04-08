import { NextResponse } from "next/server";
import { transcribeAudioWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "audio 파일이 필요합니다." }, { status: 400 });
    }
    const buf = Buffer.from(await audio.arrayBuffer());
    const mime = audio.type || "audio/webm";
    const text = await transcribeAudioWithGemini(buf, mime);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[transcribe] 실패:", err);
    const message = err instanceof Error ? err.message : "전사 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
