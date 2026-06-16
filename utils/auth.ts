import crypto from "crypto";
import * as bcrypt from "bcryptjs";

export function parseExpire(expire: string): number {
  const match = expire.match(/^(\d+)([smhd])$/);
  if (!match) return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return Math.floor(Date.now() / 1000) + value * (multipliers[unit] ?? 86400);
}

export async function matchPassword(
  entered: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(entered, hashed);
}

export function generateResetToken(): {
  token: string;
  hash: string;
  expire: Date;
} {
  const token = crypto.randomBytes(20).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expire = new Date(Date.now() + 10 * 60 * 1000);
  return { token, hash, expire };
}
