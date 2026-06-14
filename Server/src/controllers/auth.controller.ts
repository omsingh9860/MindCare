import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { transporter } from "../services/mailer.js";
import { getCookieValue, type AuthRequest } from "../middleware/auth.middleware.js";

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 10 characters and include uppercase, lowercase, number, and special character";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_REMEMBER = "30d";
const REFRESH_TOKEN_TTL_DEFAULT = "7d";
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeText(value: string, maxLength: number) {
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password);
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function signAccessToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET in .env");
  return jwt.sign({ sub: userId }, secret, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(userId: string, rememberMe: boolean) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT secret in .env");

  return jwt.sign({ sub: userId, rm: rememberMe ? 1 : 0 }, secret, {
    expiresIn: rememberMe ? REFRESH_TOKEN_TTL_REMEMBER : REFRESH_TOKEN_TTL_DEFAULT,
  });
}

function decodeJwtExpiry(token: string) {
  const payload = jwt.decode(token) as { exp?: number } | null;
  return payload?.exp ? new Date(payload.exp * 1000) : null;
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
  };
}

function setCsrfCookie(res: Response) {
  const csrfToken = crypto.randomBytes(24).toString("hex");

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: true,
    sameSite: "none" as const,
    path: "/",
  });

  return csrfToken;
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const options = getCookieOptions();
  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  const options = getCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  res.clearCookie("csrfToken", {
  httpOnly: false,
  secure: true,
  sameSite: "none",
  path: "/",
});
}

async function sendAuthEmail(to: string, subject: string, text: string, html?: string) {
  const from = process.env.SMTP_USER || process.env.EMAIL_USER;
  if (!from) throw new Error("SMTP sender not configured");
  await transporter.sendMail({ from: `\"MindCare\" <${from}>`, to, subject, text, html });
}

function verificationUrl(req: Request, token: string) {
  const origin = process.env.CLIENT_ORIGIN?.split(",")[0]?.trim();
  const base = origin || `${req.protocol}://${req.get("host")}`;
  return `${base}/login?verifyToken=${encodeURIComponent(token)}`;
}

function resetUrl(req: Request, token: string) {
  const origin = process.env.CLIENT_ORIGIN?.split(",")[0]?.trim();
  const base = origin || `${req.protocol}://${req.get("host")}`;
  return `${base}/login?resetToken=${encodeURIComponent(token)}`;
}

async function establishSession(res: Response, userId: string, rememberMe: boolean) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId, rememberMe);
  const refreshTokenExpiresAt = decodeJwtExpiry(refreshToken);

  await User.findByIdAndUpdate(userId, {
    refreshTokenHash: tokenHash(refreshToken),
    refreshTokenExpiresAt,
  });

  setAuthCookies(res, accessToken, refreshToken);
  const csrfToken = setCsrfCookie(res);
  return csrfToken;
}

export async function signup(req: Request, res: Response) {
  try {
    const rawName = typeof req.body?.name === "string" ? req.body.name : "";
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
    const rawPassword = typeof req.body?.password === "string" ? req.body.password : "";

    const name = sanitizeText(rawName, 80);
    const email = normalizeEmail(rawEmail);
    const password = rawPassword.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_POLICY_MESSAGE });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (!existing.emailVerified) {
        return res.status(409).json({ message: "Email already registered but not verified" });
      }
      return res.status(409).json({ message: "Email already registered" });
    }

    const verificationToken = createRandomToken();
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name,
      email,
      passwordHash,
      emailVerified: false,
      emailVerificationTokenHash: tokenHash(verificationToken),
      emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    const link = verificationUrl(req, verificationToken);
    await sendAuthEmail(
      email,
      "Verify your MindCare email",
      `Welcome to MindCare! Verify your email by opening this link: ${link}\n\nThis link expires in 24 hours.`,
      `<p>Welcome to MindCare!</p><p>Verify your email by clicking <a href=\"${link}\">this link</a>.</p><p>This link expires in 24 hours.</p>`
    );

    return res.status(201).json({
      message: "Signup successful. Please verify your email before logging in.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const tokenFromBody = typeof req.body?.token === "string" ? req.body.token : "";
    const tokenFromQuery = typeof req.query?.token === "string" ? req.query.token : "";
    const token = (tokenFromBody || tokenFromQuery || "").trim();

    if (!token) return res.status(400).json({ message: "Verification token is required" });

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash(token),
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    const csrfToken = await establishSession(res, user._id.toString(), false);

    return res.json({
      message: "Email verified successfully",
      csrfToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function resendVerification(req: Request, res: Response) {
  try {
    const email = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "");
    if (!email) return res.status(400).json({ message: "email is required" });

    const user = await User.findOne({ email });
    if (!user || user.emailVerified) {
      return res.json({ message: "If your account exists, a verification email has been sent." });
    }

    const verificationToken = createRandomToken();
    user.emailVerificationTokenHash = tokenHash(verificationToken);
    user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    await user.save();

    const link = verificationUrl(req, verificationToken);
    await sendAuthEmail(
      email,
      "Verify your MindCare email",
      `Verify your email by opening this link: ${link}\n\nThis link expires in 24 hours.`,
      `<p>Verify your email by clicking <a href=\"${link}\">this link</a>.</p><p>This link expires in 24 hours.</p>`
    );

    return res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "");
    const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    const csrfToken = await establishSession(res, user._id.toString(), rememberMe);

    return res.json({
      message: "Login successful",
      csrfToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = getCookieValue(req, "refreshToken");
    if (!refreshToken) return res.status(401).json({ message: "Missing refresh token" });

    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "Missing JWT secret" });

    const payload = jwt.verify(refreshToken, secret) as { sub?: string; rm?: number };
    if (!payload?.sub) return res.status(401).json({ message: "Invalid refresh token" });

    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (user.refreshTokenHash !== tokenHash(refreshToken) || user.refreshTokenExpiresAt <= new Date()) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    const csrfToken = await establishSession(res, user._id.toString(), payload.rm === 1);

    return res.json({
      message: "Token refreshed",
      csrfToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const email = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "");

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = createRandomToken();
      user.passwordResetTokenHash = tokenHash(resetToken);
      user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      await user.save();

      const link = resetUrl(req, resetToken);
      await sendAuthEmail(
        email,
        "MindCare password reset",
        `Reset your password by opening this link: ${link}\n\nThis link expires in 30 minutes.`,
        `<p>Reset your password by clicking <a href=\"${link}\">this link</a>.</p><p>This link expires in 30 minutes.</p>`
      );
    }

    return res.json({ message: "If an account exists for this email, a reset link has been sent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";

    if (!token || !password) {
      return res.status(400).json({ message: "token and password are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_POLICY_MESSAGE });
    }

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash(token),
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();

    clearAuthCookies(res);

    return res.json({ message: "Password reset successful. Please log in again." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const refreshToken = getCookieValue(req, "refreshToken");
    if (refreshToken) {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
      if (refreshSecret) {
        try {
          const payload = jwt.verify(refreshToken, refreshSecret) as { sub?: string };
          if (payload?.sub) {
            await User.findByIdAndUpdate(payload.sub, {
              refreshTokenHash: undefined,
              refreshTokenExpiresAt: undefined,
            });
          }
        } catch {
          // ignore invalid token during logout
        }
      }
    }

    clearAuthCookies(res);
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(req.userId).select("_id name email emailVerified");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, emailVerified: user.emailVerified },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
