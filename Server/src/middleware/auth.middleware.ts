import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & {
  userId?: string;
};

function parseCookies(cookieHeader?: string) {
  const cookieMap: Record<string, string> = {};
  if (!cookieHeader) return cookieMap;

  cookieHeader.split(";").forEach((cookie) => {
    const [rawKey, ...rest] = cookie.trim().split("=");
    if (!rawKey || rest.length === 0) return;
    cookieMap[rawKey] = decodeURIComponent(rest.join("="));
  });

  return cookieMap;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const cookies = parseCookies(req.headers.cookie);
    const accessTokenFromCookie = cookies.accessToken;

    const token =
      header && header.startsWith("Bearer ")
        ? header.slice("Bearer ".length).trim()
        : accessTokenFromCookie;

    if (!token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "Missing JWT_SECRET" });

    const payload = jwt.verify(token, secret) as { sub?: string };

    if (!payload?.sub) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const csrfCookie = cookies.csrfToken;
      const csrfHeader = req.headers["x-csrf-token"];
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return res.status(403).json({ message: "Invalid CSRF token" });
      }
    }

    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function getCookieValue(req: Request, name: string) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[name];
}