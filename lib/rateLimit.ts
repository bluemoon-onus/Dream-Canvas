/**
 * IP당 일일 생성 횟수 제한.
 * 인메모리 카운터(서버리스 인스턴스 단위). 재배포/콜드스타트 시 리셋됨.
 * 환경변수 DAILY_LIMIT_PER_IP로 조절 (기본 2).
 */
type Bucket = { date: string; count: number };
const buckets = new Map<string, Bucket>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function getDailyLimit(): number {
  const raw = process.env.DAILY_LIMIT_PER_IP;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 2;
}

export function checkAndIncrement(ip: string): {
  ok: boolean;
  used: number;
  limit: number;
} {
  const limit = getDailyLimit();
  const today = todayKey();
  const cur = buckets.get(ip);
  if (!cur || cur.date !== today) {
    buckets.set(ip, { date: today, count: 1 });
    return { ok: true, used: 1, limit };
  }
  if (cur.count >= limit) {
    return { ok: false, used: cur.count, limit };
  }
  cur.count += 1;
  return { ok: true, used: cur.count, limit };
}

export function peek(ip: string): { used: number; limit: number } {
  const limit = getDailyLimit();
  const today = todayKey();
  const cur = buckets.get(ip);
  if (!cur || cur.date !== today) return { used: 0, limit };
  return { used: cur.count, limit };
}
