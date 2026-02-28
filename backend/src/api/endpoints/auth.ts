/**
 * Authentication Endpoints Module
 *
 * Implements OAuth2-compliant authentication:
 * - POST /api/v1/auth/login - Token login (OAuth2 password flow)
 * - POST /api/v1/auth/register - User registration
 * - GET /api/v1/auth/me - Get current user
 *
 * Must match Python backend API exactly for frontend compatibility
 */

import { Router, Request, Response } from "express";
import { User } from "../../models/user";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
} from "../../core/security";
import { getCurrentUser, AuthRequest } from "../deps";
import { UserCreateSchema, LoginSchema } from "../../schemas/user";

const router = Router();

/**
 * OAuth2 compatible token login endpoint
 *
 * POST /api/v1/auth/login
 * Body: { username: email, password: string }
 * Returns: { access_token: string, token_type: "bearer" }
 *
 * Note: OAuth2 spec uses 'username' field, but we expect email
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ detail: "Invalid input" });
    }

    const { username, password } = parsed.data;

    // Find user by email (username field contains email)
    const user = await User.findOne({ where: { email: username } });

    if (!user) {
      return res.status(400).json({ detail: "Incorrect email or password" });
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      user.hashed_password
    );
    if (!isValidPassword) {
      return res.status(400).json({ detail: "Incorrect email or password" });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({ detail: "Inactive user" });
    }

    // Create access token
    const accessToken = createAccessToken(user.id);

    return res.json({
      access_token: accessToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

/**
 * User registration endpoint
 *
 * POST /api/v1/auth/register
 * Body: { email: string, password: string, full_name: string }
 * Returns: User object (without hashed_password)
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parsed = UserCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ detail: "Invalid input", errors: parsed.error.errors });
    }

    const { email, password, full_name } = parsed.data;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({
          detail: "The user with this username already exists in the system.",
        });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      full_name,
      hashed_password: hashedPassword,
      is_active: true,
      is_admin: false,
      language: "it",
    });

    // Return user without hashed_password
    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
      is_admin: user.is_admin,
      language: user.language,
    };

    return res.status(201).json(userResponse);
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

/**
 * Get current authenticated user
 *
 * GET /api/v1/auth/me
 * Headers: Authorization: Bearer <token>
 * Returns: User object (without hashed_password)
 */
router.get("/me", getCurrentUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
      is_admin: user.is_admin,
      language: user.language,
    };

    return res.json(userResponse);
  } catch (error) {
    console.error("❌ Get current user error:", error);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
