// src/lib/auth.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in environment variables");
}

export interface AuthTokenPayload {
  id: string;
  studentId: string;
}

export function signToken(payload: AuthTokenPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  console.log("🔐 signToken using secret length:", JWT_SECRET.length);

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// ✅ Alias: createToken -> signToken
export function createToken(payload: AuthTokenPayload): string {
  return signToken(payload);
}

export function verifyToken<T = AuthTokenPayload>(token: string): T | null {
  if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET is not set when verifying token");
    return null;
  }

  console.log("🔐 verifyToken using secret length:", JWT_SECRET.length);

  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (err) {
    console.error("❌ JWT verify failed:", err);
    return null;
  }
}
