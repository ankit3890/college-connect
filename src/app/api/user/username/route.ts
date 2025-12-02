// src/app/api/user/username/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

interface TokenPayload {
  id: string;
  studentId: string;
}

// Helper: extract "token" cookie from request headers
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

// POST /api/user/username
// body: { username: string }
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

    const body = await req.json();
    let { username } = body as { username?: string };

    if (!username) {
      return NextResponse.json(
        { msg: "Username is required" },
        { status: 400 }
      );
    }

    // normalize: lowercase + trim
    username = username.trim().toLowerCase();

    // 3–20 chars, a-z 0-9 . _
    const valid = /^[a-z0-9._]{3,20}$/.test(username);
    if (!valid) {
      return NextResponse.json(
        {
          msg:
            "Username must be 3–20 chars, only lowercase letters, numbers, '.' or '_'",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    // allow setting ONLY once
    if (user.username) {
      return NextResponse.json(
        { msg: "Username already set and cannot be changed" },
        { status: 400 }
      );
    }

    // check uniqueness
    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json(
        { msg: "Username already taken, please choose another" },
        { status: 409 }
      );
    }

    user.username = username;
    await user.save();

    const safeUser = await User.findById(user._id).select("-passwordHash");

    return NextResponse.json({
      msg: "Username set successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("POST /api/user/username error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
