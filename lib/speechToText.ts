import { SpeechClient } from "@google-cloud/speech";
import { getGoogleCredentials } from "./googleAuth";

let client: SpeechClient | null = null;
function getClient(): SpeechClient {
  if (client) return client;
  const credentials = getGoogleCredentials();
  client = credentials ? new SpeechClient({ credentials: credentials as never }) : new SpeechClient();
  return client;
}

/**
 * 오디오 Buffer를 한국어 텍스트로 전사한다.
 * webm/opus (브라우저 MediaRecorder 기본 포맷) 가정.
 */
export async function transcribeAudio(audio: Buffer): Promise<string> {
  const speech = getClient();
  const [response] = await speech.recognize({
    audio: { content: audio.toString("base64") },
    config: {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: "ko-KR",
      enableAutomaticPunctuation: true,
      model: "latest_long",
    },
  });
  const text =
    response.results
      ?.map((r) => r.alternatives?.[0]?.transcript ?? "")
      .join(" ")
      .trim() ?? "";
  if (!text) throw new Error("음성에서 텍스트를 추출하지 못했습니다.");
  return text;
}
