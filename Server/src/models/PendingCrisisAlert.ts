import mongoose from "mongoose";

const PendingCrisisAlertSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "cancelled", "sent"],
      default: "pending",
      index: true,
    },
    triggeredAt: { type: Date, required: true },
    sendAt: { type: Date, required: true, index: true },

    // minimal info only (no journal content)
    userName: { type: String, default: "A MindCare user" },
    timezone: { type: String, default: "IST" },
    delaySeconds: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export const PendingCrisisAlert =
  mongoose.models.PendingCrisisAlert ||
  mongoose.model("PendingCrisisAlert", PendingCrisisAlertSchema);