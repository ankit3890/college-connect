import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/User"; // Ensure User model is registered

export interface IFollow extends Document {
    followerId: mongoose.Types.ObjectId;
    followingId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const FollowSchema: Schema<IFollow> = new Schema(
    {
        followerId: { type: Schema.Types.ObjectId, ref: "User_Fixed_V1", required: true },
        followingId: { type: Schema.Types.ObjectId, ref: "User_Fixed_V1", required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow: Model<IFollow> =
    mongoose.models.Follow_V1 || mongoose.model<IFollow>("Follow_V1", FollowSchema, "follows");

export default Follow;
