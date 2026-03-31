import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import journalRoutes from "./routes/journal.routes";
import moodRoutes from "./routes/mood.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import meditationRoutes from "./routes/meditation.routes";
import contactsRoutes from "./routes/contacts.routes";
import crisisRoutes from "./routes/crisis.routes";
import profileRoutes from "./routes/profile.routes";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Server is healthy" });
});

// Routes (mount ALL routes before listening)
app.use("/api/auth", authRoutes);

app.use("/api", protectedRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/meditation", meditationRoutes);

app.use("/api/contacts", contactsRoutes);
app.use("/api/crisis", crisisRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });