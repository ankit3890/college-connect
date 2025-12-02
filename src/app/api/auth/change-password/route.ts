// src/app/api/auth/change-password/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface TokenPayload {
  id: string;
  studentId: string;
}

function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith("token=")) {
      return decodeURIComponent(part.substring("token=".length));
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ msg: "Not logged in" }, { status: 401 });
    }

    const decoded = verifyToken<TokenPayload>(token);
    if (!decoded) {
      return NextResponse.json({ msg: "Invalid token" }, { status: 401 });
    }

    const { oldPassword, newPassword } = (await req.json()) as {
      oldPassword?: string;
      newPassword?: string;
    };

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { msg: "Old password and new password are required" },
        { status: 400 }
      );
    }

    // basic strength check (you can adjust this)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { msg: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    const matches = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!matches) {
      return NextResponse.json(
        { msg: "Old password is incorrect" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = newHash;

    await user.save();

    return NextResponse.json(
      { msg: "Password changed successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/auth/change-password error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
