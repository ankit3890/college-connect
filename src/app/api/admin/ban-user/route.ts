import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// use relative imports for models
import User from "../../../../models/User";
import AdminLog from "../../../../models/AdminLog";

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

    const adminUser = await User.findById(decoded.id);
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "superadmin")) {
      return NextResponse.json(
        { msg: "Only admin/superadmin can ban users" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, ban, reason, durationMinutes } = body as {
      userId: string;
      ban: boolean;
      reason?: string;
      durationMinutes?: number;
    };

    if (!userId || typeof ban !== "boolean") {
      return NextResponse.json(
        { msg: "userId and ban are required" },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "superadmin") {
      return NextResponse.json(
        { msg: "Cannot ban/unban superadmin" },
        { status: 400 }
      );
    }

    const now = Date.now();
    let bannedUntil: Date | null = null;
    let durationInfo: string | null = null;

    if (ban && durationMinutes && durationMinutes > 0) {
      bannedUntil = new Date(now + durationMinutes * 60 * 1000);
      durationInfo = `${durationMinutes} minutes`;
    }

    if (ban) {
      targetUser.isBanned = true;
      targetUser.bannedReason = reason || "";
      targetUser.bannedUntil = bannedUntil;
    } else {
      targetUser.isBanned = false;
      targetUser.bannedReason = null;
      targetUser.bannedUntil = null;
    }

    await targetUser.save();

    const action = ban ? "BAN_USER" : "UNBAN_USER";

    const details = ban
      ? `Banned user ${targetUser.studentId}${durationInfo ? ` for ${durationInfo}` : " (permanent)"
      }`
      : `Unbanned user ${targetUser.studentId}`;

    await AdminLog.create({
      action,
      actorId: adminUser._id,
      actorStudentId: adminUser.studentId,
      actorRole: adminUser.role,
      targetUserId: targetUser._id,
      targetStudentId: targetUser.studentId,
      details,
      metadata: {
        reason: reason || null,
        durationMinutes: durationMinutes || null,
        bannedUntil,
      },
    });

    return NextResponse.json({ msg: "OK", user: targetUser });
  } catch (err) {
    console.error("POST /api/admin/ban-user error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
