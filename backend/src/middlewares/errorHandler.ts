/**
 * Centralized Error Handler Middleware
 *
 * Catches all errors and returns consistent JSON responses.
 * Should be registered last in middleware chain.
 */

import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    detail: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
