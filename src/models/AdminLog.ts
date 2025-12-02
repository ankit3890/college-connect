// src/models/AdminLog.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAdminLog extends Document {
  action: string; // BAN_USER, UNBAN_USER, UPDATE_USER, CHANGE_ROLE, SYSTEM_SETTINGS_UPDATE
  actorId: Types.ObjectId;
  actorStudentId: string;
  actorRole: string;

  targetUserId?: Types.ObjectId | null;
  targetStudentId?: string | null;

  details?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AdminLogSchema: Schema<IAdminLog> = new Schema(
  {
    action: { type: String, required: true },

    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorStudentId: { type: String, required: true },
    actorRole: { type: String, required: true },

    targetUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    targetStudentId: { type: String, default: null },

    details: { type: String, default: null },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const AdminLog: Model<IAdminLog> =
  mongoose.models.AdminLog || mongoose.model<IAdminLog>("AdminLog", AdminLogSchema);

export default AdminLog;
