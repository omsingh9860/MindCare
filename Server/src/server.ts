
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { startCrisisAlertWorker } from "./workers/crisisAlertWorker.js";

import testEmailRoutes from "./routes/test-email.routes.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import journalRoutes from "./routes/journal.routes.js";
import moodRoutes from "./routes/mood.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import meditationRoutes from "./routes/meditation.routes.js";
import contactsRoutes from "./routes/contacts.routes.js";
import crisisRoutes from "./routes/crisis.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import achievementRoutes from "./routes/achievement.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "1mb" }));

// General API rate limiter: 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Server is healthy" });
});

if (process.env.NODE_ENV !== "production") {
  app.use("/api", testEmailRoutes);
}

app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/meditation", meditationRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/crisis", crisisRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "CORS policy violation") {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  return res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

connectDB()
  .then(() => {
    startCrisisAlertWorker();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });