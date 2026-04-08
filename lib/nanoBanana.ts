/**
 * Gemini 2.5 Flash Image ("nano-banana")로 드림카드 배경 이미지를 생성한다.
 * REST API 직접 호출 (구버전 SDK는 이미지 모델 미지원).
 * 반환: data URL (base64) 또는 undefined
 */
export async function generateDreamImage(params: {
  rawText: string;
  interpretation: string;
  gradient: string[];
  size?: 512 | 1024;
  persona?: string;
}): Promise<string | undefined> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return undefined;

  const personaLine = params.persona
    ? `\nIf a human dreamer appears in the scene, depict them as: ${params.persona}.`
    : "";

  const prompt = `A whimsical storybook illustration depicting the actual scene from this dream, square 1:1 composition at 512x512 pixels.

The dream: "${params.rawText}"

Mood guidance: ${params.interpretation}
Color palette hint (hex, optional): ${params.gradient.join(", ")}${personaLine}

Style: children's picture book, fairy tale illustration, soft watercolor and gouache, gentle hand-drawn lines, dreamy magical atmosphere, Studio Ghibli meets a bedtime storybook. Depict the literal scene, characters, and objects from the dream as the focal subject. Center the main subject so it survives a 5:7 vertical center-crop.

Output: 512x512 pixels, square.
Strict rules: NO text, NO letters, NO watermark, NO photorealism, NO horror, NO disturbing imagery.`;

  const model = "gemini-3.1-flash-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[nano-banana] HTTP ${res.status}:`, errText.slice(0, 400));
      return undefined;
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
        };
      }>;
    };

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData;
      if (inline?.data) {
        return `data:${inline.mimeType ?? "image/png"};base64,${inline.data}`;
      }
    }
    console.warn("[nano-banana] inlineData 없음:", JSON.stringify(json).slice(0, 300));
    return undefined;
  } catch (e) {
    console.error("[nano-banana] 호출 실패:", e);
    return undefined;
  }
}
