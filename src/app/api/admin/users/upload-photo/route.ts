// src/app/api/user/upload-photo/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

interface TokenPayload {
  id: string;
  studentId: string;
}

// Read "token" cookie manually from headers
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

    const formData = await req.formData();
    const file = formData.get("photo");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { msg: "No file uploaded" },
        { status: 400 }
      );
    }

    // Optional: basic size/type checks
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { msg: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    // Prepare upload directory: public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Create a unique filename
    const ext = path.extname(file.name) || ".jpg";
    const baseName = `${decoded.id}-${Date.now()}`;
    const fileName = baseName + ext;

    const filePath = path.join(uploadDir, fileName);

    // Convert File -> Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Public URL that the app can use (served from /public)
    const publicUrl = `/uploads/${fileName}`;

    // Update user document
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    user.profilePhoto = publicUrl;
    await user.save();

    const safeUser = await User.findById(user._id).select("-passwordHash");

    return NextResponse.json({
      msg: "Profile photo updated",
      user: safeUser,
    });
  } catch (err) {
    console.error("POST /api/user/upload-photo error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
