import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "./Product";

export enum ReplyType {
  AUTO_REPLY_ONCE = "auto_reply_once",
  AUTO_REPLY_COMPLETE = "auto_reply_complete",
  MANUAL_REPLY = "manual_reply",
}

export interface IOutreach extends Document {
  product: IProduct["_id"];
  subreddits: string[];
  startDate?: Date;
  endDate?: Date;
  maxPosts?: number;
  replyType: ReplyType;
  replyTemplate?: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OutreachSchema: Schema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    subreddits: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: IOutreach, value: Date) {
          if (!value || !this.startDate) return true;
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    maxPosts: {
      type: Number,
      min: 1,
      max: 5000,
      default: 100,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate at least one subreddit
OutreachSchema.pre("validate", function (next) {
  if (!this.subreddits || (this.subreddits as string[]).length === 0) {
    next(new Error("At least one subreddit is required"));
  }
  next();
});

// Index for faster queries
OutreachSchema.index({ user: 1, startDate: 1 });
OutreachSchema.index({ product: 1 });

export default mongoose.model<IOutreach>("Outreach", OutreachSchema);
