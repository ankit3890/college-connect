// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { token, newPassword } = (await req.json()) as {
      token?: string;
      newPassword?: string;
    };

    if (!token || !newPassword) {
      return NextResponse.json(
        { msg: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { msg: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const resetDoc = await PasswordResetToken.findOne({ token });

    if (!resetDoc) {
      return NextResponse.json(
        { msg: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (resetDoc.used) {
      return NextResponse.json(
        { msg: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (resetDoc.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { msg: "Reset token has expired" },
        { status: 400 }
      );
    }

    const user = await User.findById(resetDoc.userId);
    if (!user) {
      return NextResponse.json(
        { msg: "User not found for this token" },
        { status: 404 }
      );
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = newHash;
    await user.save();

    // Mark token as used so it can't be reused
    resetDoc.used = true;
    await resetDoc.save();

    return NextResponse.json({
      msg: "Password has been reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("POST /api/auth/reset-password error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
