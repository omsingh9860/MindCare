import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & {
  userId?: string;
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = header.slice("Bearer ".length).trim();
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "Missing JWT_SECRET" });

    const payload = jwt.verify(token, secret) as { sub?: string };

    if (!payload?.sub) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}