/**
 * Dependency Injection Module
 *
 * Provides reusable dependencies for route handlers:
 * - Database session
 * - Current authenticated user
 *
 * Equivalent to Python's deps.py with get_db and get_current_user
 */

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../core/security";
import { User } from "../models/user";

/**
 * Extended Express Request interface with user property
 */
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Middleware to extract and verify JWT token
 * Attaches user object to request if token is valid
 *
 * @throws 401 if token is missing or invalid
 * @throws 403 if user is inactive
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ detail: "Not authenticated" });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ detail: "Invalid token" });
      return;
    }

    // Fetch user from database
    const user = await User.findByPk(payload.sub);
    if (!user) {
      res.status(401).json({ detail: "User not found" });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({ detail: "Inactive user" });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Authentication error:", error);
    res.status(401).json({ detail: "Authentication failed" });
  }
}

/**
 * Middleware to check if user is admin
 * Must be used after getCurrentUser middleware
 *
 * @throws 403 if user is not admin
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.is_admin) {
    res.status(403).json({ detail: "Admin privileges required" });
    return;
  }
  next();
}
