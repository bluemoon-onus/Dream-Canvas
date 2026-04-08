/**
 * GOOGLE_APPLICATION_CREDENTIALS_JSON 환경변수를 파싱한다.
 * - 원본 JSON 문자열 또는 base64 인코딩된 JSON 모두 지원
 */
export function getGoogleCredentials(): Record<string, unknown> | undefined {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) return undefined;
  try {
    if (raw.trim().startsWith("{")) return JSON.parse(raw);
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON 파싱 실패");
  }
}
