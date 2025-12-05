import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUserActivityLog extends Document {
    userId?: Types.ObjectId | null;
    studentId?: string | null;
    name?: string | null;
    ipAddress: string;
    action: string; // USER_LOGIN, USER_LOGOUT, ACCESS_FEATURE
    details?: string | null;
    userAgent?: string | null;
    isNewVisitor: boolean;
    createdAt: Date;
}

const UserActivityLogSchema: Schema<IUserActivityLog> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User_Fixed_V1", default: null },
        studentId: { type: String, default: null },
        name: { type: String, default: null },
        ipAddress: { type: String, required: true },
        action: { type: String, required: true },
        details: { type: String, default: null },
        userAgent: { type: String, default: null },
        isNewVisitor: { type: Boolean, default: false },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for faster searching and analytics
UserActivityLogSchema.index({ createdAt: -1 });
UserActivityLogSchema.index({ ipAddress: 1 });
UserActivityLogSchema.index({ studentId: 1 });
UserActivityLogSchema.index({ action: 1 });

const UserActivityLog: Model<IUserActivityLog> =
    mongoose.models.UserActivityLog_V1 ||
    mongoose.model<IUserActivityLog>("UserActivityLog_V1", UserActivityLogSchema, "useractivitylogs");

export default UserActivityLog;
