// models/Chat.ts
import { Schema, model } from "mongoose";

interface IChat extends Document {
  redditPostId: string; // ID of the original post
  authorUsername: string; // Post author's Reddit username
  outreach: Schema.Types.ObjectId; // Reference to the outreach campaign
  initialMessage: {
    content: string;
    sentAt: Date;
    aiGenerated: boolean;
  };
  conversation: Array<{
    content: string;
    sentAt: Date;
    sender: "USER" | "AI" | "REDDIT_USER";
    redditMessageId?: string; // For syncing
  }>;
  user: Schema.Types.ObjectId; // Reference to your app's user
}

const ChatSchema = new Schema<IChat>(
  {
    redditPostId: { type: String, required: true },
    authorUsername: { type: String, required: true },
    outreach: { type: Schema.Types.ObjectId, ref: "Outreach", required: true },
    initialMessage: {
      content: { type: String, required: true },
      sentAt: { type: Date, default: Date.now },
      aiGenerated: Boolean,
    },
    conversation: [
      {
        content: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        sender: { type: String, enum: ["USER", "AI", "REDDIT_USER"] },
        redditMessageId: String,
      },
    ],
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default model<IChat>("Chat", ChatSchema);
