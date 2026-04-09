import { NextResponse } from "next/server";
import { getClientIp, peek } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const { used, limit } = await peek(ip);
  return NextResponse.json({ used, limit });
}
