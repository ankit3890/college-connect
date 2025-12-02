// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import AdminLog from "@/models/AdminLog";
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

    const adminUser = await User.findById(decoded.id);
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "superadmin")) {
      return NextResponse.json(
        { msg: "Only superadmin can view logs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      100
    );
    const actionFilter = searchParams.get("action") || "";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const filter: any = {};

    if (actionFilter) {
      filter.action = actionFilter;
    }

    if (search) {
      filter.$or = [
        { details: { $regex: search, $options: "i" } },
        { actorStudentId: { $regex: search, $options: "i" } },
        { targetStudentId: { $regex: search, $options: "i" } },
      ];
    }

    const total = await AdminLog.countDocuments(filter);

    const logs = await AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actorId", "studentId name role")
      .populate("targetUserId", "studentId name role");

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      logs,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("GET /api/admin/logs error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
