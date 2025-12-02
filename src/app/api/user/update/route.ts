// src/app/api/user/update/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

interface TokenPayload {
  id: string;
  studentId: string;
}

// Read "token" cookie manually from headers (works reliably)
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

    const body = await req.json();
    const { email, mobileNumber, hideContacts } = body as {
      email?: string;
      mobileNumber?: string;
      hideContacts?: boolean; // ✅ NEW
    };

    if (!email) {
      return NextResponse.json(
        { msg: "Email is required" },
        { status: 400 }
      );
    }

    // basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { msg: "Invalid email format" },
        { status: 400 }
      );
    }

    // optional mobile validation (6–15 digits)
    if (mobileNumber && !/^[0-9]{6,15}$/.test(mobileNumber)) {
      return NextResponse.json(
        { msg: "Mobile number should contain 6–15 digits" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    // check email uniqueness only if changed
    if (email !== user.email) {
      const emailUsed = await User.findOne({ email });
      if (emailUsed && emailUsed._id.toString() !== user._id.toString()) {
        return NextResponse.json(
          { msg: "This email is already used by another account" },
          { status: 409 }
        );
      }
    }

    user.email = email;
    user.mobileNumber = mobileNumber || "";

    // ✅ set hideContacts only if provided
    if (typeof hideContacts === "boolean") {
      user.hideContacts = hideContacts;
    }

    await user.save();

    const safeUser = await User.findById(user._id).select("-passwordHash");

    return NextResponse.json({
      msg: "Profile updated successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("POST /api/user/update error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
