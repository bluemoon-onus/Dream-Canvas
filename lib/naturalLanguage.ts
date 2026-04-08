import { LanguageServiceClient } from "@google-cloud/language";
import { getGoogleCredentials } from "./googleAuth";

let client: LanguageServiceClient | null = null;
function getClient(): LanguageServiceClient {
  if (client) return client;
  const credentials = getGoogleCredentials();
  client = credentials
    ? new LanguageServiceClient({ credentials: credentials as never })
    : new LanguageServiceClient();
  return client;
}

export interface SentimentResult {
  score: number; // -1 ~ +1
  magnitude: number; // 0 ~ ∞
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const language = getClient();
  const [result] = await language.analyzeSentiment({
    document: {
      content: text,
      type: "PLAIN_TEXT",
      language: "ko",
    },
  });
  const s = result.documentSentiment;
  return {
    score: s?.score ?? 0,
    magnitude: s?.magnitude ?? 0,
  };
}
