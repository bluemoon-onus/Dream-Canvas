/**
 * Gemini TTS REST 호출.
 * 모델: gemini-2.5-flash-preview-tts
 * 응답: PCM(L16, 24kHz, mono) base64 → WAV로 래핑해서 반환.
 */
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const SAMPLE_RATE = 24000;

export async function synthesizeKoreanSpeech(
  text: string,
  lang: "ko" | "en" = "ko",
): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 미설정");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text:
                lang === "en"
                  ? `Read aloud in a warm, natural native English voice: ${text}`
                  : `다음 한국어 문장을 따뜻하고 자연스러운 한국어 원어민 발음으로 읽어줘: ${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini TTS ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    }>;
  };
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const b64 = part?.inlineData?.data;
  if (!b64) throw new Error("Gemini TTS 응답에 오디오 없음");

  const pcm = Buffer.from(b64, "base64");
  return wrapPcmToWav(pcm, SAMPLE_RATE, 1, 16);
}

function wrapPcmToWav(
  pcm: Buffer,
  sampleRate: number,
  channels: number,
  bitsPerSample: number,
): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}
