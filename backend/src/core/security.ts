/**
 * Security Module
 *
 * Password hashing with bcrypt and JWT token generation/verification.
 * Must maintain compatibility with Python backend's authentication system.
 *
 * Functions:
 * - hashPassword: Bcrypt password hashing
 * - verifyPassword: Password verification
 * - createAccessToken: JWT token generation
 * - verifyToken: JWT token verification
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { settings } from "./config";

/**
 * Hash password using bcrypt
 * @param password Plain text password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 * @param plainPassword Plain text password from user
 * @param hashedPassword Stored hash from database
 * @returns true if password matches
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * JWT payload interface
 */
export interface TokenPayload {
  sub: number; // User ID (subject)
  exp: number; // Expiration timestamp
}

/**
 * Create JWT access token
 * @param userId User identifier
 * @param expiresMinutes Token expiration time in minutes (default from settings)
 * @returns JWT token string
 */
export function createAccessToken(
  userId: number,
  expiresMinutes?: number
): string {
  const expirationTime = expiresMinutes || settings.ACCESS_TOKEN_EXPIRE_MINUTES;
  const payload: TokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + expirationTime * 60,
  };

  return jwt.sign(payload, settings.SECRET_KEY, {
    algorithm: settings.ALGORITHM as jwt.Algorithm,
  });
}

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, settings.SECRET_KEY, {
      algorithms: [settings.ALGORITHM as jwt.Algorithm],
    });

    if (typeof decoded === "string" || !decoded.sub || !decoded.exp) {
      return null;
    }

    return {
      sub: Number(decoded.sub),
      exp: Number(decoded.exp),
    };
  } catch (error) {
    return null;
  }
}
