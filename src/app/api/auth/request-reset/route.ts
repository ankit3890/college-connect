// src/app/api/auth/request-reset/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import crypto from "crypto";

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, studentId } = (await req.json()) as {
      email?: string;
      studentId?: string;
    };

    if (!email && !studentId) {
      return NextResponse.json(
        { msg: "Email or student ID is required" },
        { status: 400 }
      );
    }

    // Find user by email or studentId
    const user = await User.findOne(
      email ? { email } : { studentId }
    );

    // For security, don't reveal if user exists or not.
    if (!user) {
      return NextResponse.json({
        msg:
          "If an account exists with these details, a reset link has been generated.",
      });
    }

    // Delete old tokens for this user (optional cleanup)
    await PasswordResetToken.deleteMany({
      userId: user._id,
      used: false,
    });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt,
      used: false,
    });

    const resetUrl = `${APP_BASE_URL}/reset-password/${token}`;

    // In real production, you'd send email here.
    // For dev, we return the URL so you can click it directly.
    return NextResponse.json({
      msg:
        "If an account exists, a reset link has been created (for dev, see resetUrl).",
      resetUrl,
    });
  } catch (err) {
    console.error("POST /api/auth/request-reset error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
