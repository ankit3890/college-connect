// src/app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

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

export async function GET(req: Request) {
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

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    // Optional: block banned users from using site
    if (user.isBanned) {
      return NextResponse.json(
        { msg: "Account banned" },
        { status: 403 }
      );
    }

    // 🔥 mark last active
    user.lastActiveAt = new Date();
    await user.save();

    const safeUser = await User.findById(user._id).select("-passwordHash");

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("GET /api/user/me error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
