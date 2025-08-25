import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  redditId: string;
  redditAccessToken: string;
  redditRefreshToken: string;
  redditTokenExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    redditId: {
      type: String,
      unique: true,
      sparse: true,
    },
    redditAccessToken: {
      type: String,
      select: false, // Don't include in queries by default
    },
    redditRefreshToken: {
      type: String,
      select: false,
    },
    redditTokenExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
