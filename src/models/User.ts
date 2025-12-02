// src/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  studentId: string;
  email: string;
  passwordHash: string;

  name?: string;
  firstName?: string;
  lastName?: string;
  branch?: string;
  year?: number;
  cyberUserName?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: "student" | "admin" | "superadmin";
  profilePhoto?: string;
  hasSyncedFromCyberVidya: boolean;
  username?: string;

  isBanned?: boolean;
  bannedReason?: string | null;
  bannedUntil?: Date | null;
  lastActiveAt?: Date | null;
  hideContacts?: boolean;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    studentId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    name: String,
    firstName: String,
    lastName: String,
    branch: String,
    year: Number,
    cyberUserName: String,
    mobileNumber: String,
    dateOfBirth: String,
    gender: String,

    role: {
      type: String,
      enum: ["student", "admin", "superadmin"],
      default: "student",
    },

    profilePhoto: String,

    hasSyncedFromCyberVidya: {
      type: Boolean,
      default: false,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    bannedReason: {
      type: String,
      default: null,
    },

    bannedUntil: {
      type: Date,
      default: null,
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },
    hideContacts: 
    { type: Boolean, default: false },

  },
  { timestamps: true }

  
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

