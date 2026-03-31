import mongoose, { Schema, Document } from "mongoose";

export interface IAnalyticsCache extends Document {
  userId: mongoose.Types.ObjectId;
  cacheKey: string;
  data: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

const AnalyticsCacheSchema = new Schema<IAnalyticsCache>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cacheKey: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB removes documents automatically once the current time
      // passes the 'expiresAt' field. expireAfterSeconds: 0 means expiry happens
      // exactly at the time specified in expiresAt (no additional offset).
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

AnalyticsCacheSchema.index({ userId: 1, cacheKey: 1 }, { unique: true });

export const AnalyticsCache = mongoose.model<IAnalyticsCache>("AnalyticsCache", AnalyticsCacheSchema);
