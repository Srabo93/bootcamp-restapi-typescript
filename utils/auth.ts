import { sign } from "jsonwebtoken";
import crypto from "crypto";
import { compare } from "bcryptjs";
import { JWT_SECRET, JWT_EXPIRE } from "../config/config";

export function signToken(id: string, role: string): string {
  return sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

export async function matchPassword(
  entered: string,
  hashed: string,
): Promise<boolean> {
  return compare(entered, hashed);
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
