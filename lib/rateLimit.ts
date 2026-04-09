/**
 * IP당 일일 생성 횟수 제한.
 * Upstash Redis (Vercel 연동)로 인스턴스 간 공유 카운터.
 * KV env var 없으면 인메모리 fallback (로컬 dev).
 * 환경변수 DAILY_LIMIT_PER_IP로 조절 (기본 2).
 */
import { Redis } from "@upstash/redis";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const redis =
  KV_URL && KV_TOKEN
    ? new Redis({ url: KV_URL, token: KV_TOKEN })
    : null;

// fallback용 인메모리
type Bucket = { date: string; count: number };
const memBuckets = new Map<string, Bucket>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function redisKey(ip: string, day: string): string {
  return `dreamcanvas:rl:${day}:${ip}`;
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

export async function checkAndIncrement(ip: string): Promise<{
  ok: boolean;
  used: number;
  limit: number;
}> {
  const limit = getDailyLimit();
  const today = todayKey();

  if (redis) {
    const key = redisKey(ip, today);
    // 먼저 현재값 조회해 한도 초과 여부 판단 (원자적이진 않지만 경합 window는 짧음)
    const current = (await redis.get<number>(key)) ?? 0;
    if (current >= limit) {
      return { ok: false, used: current, limit };
    }
    const next = await redis.incr(key);
    // 최초 생성 시 48시간 TTL (UTC date 롤오버 + 여유)
    if (next === 1) {
      await redis.expire(key, 60 * 60 * 48);
    }
    return { ok: true, used: next, limit };
  }

  // 인메모리 fallback
  const cur = memBuckets.get(ip);
  if (!cur || cur.date !== today) {
    memBuckets.set(ip, { date: today, count: 1 });
    return { ok: true, used: 1, limit };
  }
  if (cur.count >= limit) {
    return { ok: false, used: cur.count, limit };
  }
  cur.count += 1;
  return { ok: true, used: cur.count, limit };
}

export async function peek(ip: string): Promise<{ used: number; limit: number }> {
  const limit = getDailyLimit();
  const today = todayKey();

  if (redis) {
    const key = redisKey(ip, today);
    const used = (await redis.get<number>(key)) ?? 0;
    return { used, limit };
  }

  const cur = memBuckets.get(ip);
  if (!cur || cur.date !== today) return { used: 0, limit };
  return { used: cur.count, limit };
}
