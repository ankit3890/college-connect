// src/models/SystemConfig.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemConfig extends Document {
  key: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  emailNotifications: boolean;
  autoBackup: boolean;
}

const SystemConfigSchema: Schema<ISystemConfig> = new Schema({
  key: { type: String, required: true, unique: true },
  allowRegistration: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: "" },
  emailNotifications: { type: Boolean, default: true },
  autoBackup: { type: Boolean, default: true },
});

const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig ||
  mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);

export default SystemConfig;
