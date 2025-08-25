import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  keywords: string[];
  domain: string;
  location: {
    city: string;
    country: string;
  };
  price: number;
  targetAudience?: string;
  valueProposition?: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
    },
    price: {
      type: Number,
      min: 0,
    },
    targetAudience: {
      type: String,
      trim: true,
    },
    valueProposition: {
      type: String,
      trim: true,
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

export default mongoose.model<IProduct>("Product", ProductSchema);
