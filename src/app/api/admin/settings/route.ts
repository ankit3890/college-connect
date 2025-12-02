// src/app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// use relative imports to avoid alias issues with models
import User from "../../../../models/User";
import SystemConfig from "../../../../models/SystemConfig";
import AdminLog from "../../../../models/AdminLog";

interface TokenPayload {
  id: string;
  studentId: string;
}

// re‑use same helper as API that reads cookie token
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

async function getOrCreateGlobalConfig() {
  let cfg = await SystemConfig.findOne({ key: "global" });
  if (!cfg) {
    cfg = await SystemConfig.create({
      key: "global",
      allowRegistration: true,
      maintenanceMode: false,
      maintenanceMessage: "",
      emailNotifications: true,
      autoBackup: true,
    });
  }
  return cfg;
}

// GET: used by /admin/settings page to load current values
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
    if (!adminUser || adminUser.role !== "superadmin") {
      return NextResponse.json(
        { msg: "Only superadmin can view settings" },
        { status: 403 }
      );
    }

    const cfg = await getOrCreateGlobalConfig();

    return NextResponse.json({
      allowRegistration: cfg.allowRegistration,
      maintenanceMode: cfg.maintenanceMode,
      maintenanceMessage: cfg.maintenanceMessage || "",
      emailNotifications: cfg.emailNotifications ?? true,
      autoBackup: cfg.autoBackup ?? true,
    });
  } catch (err) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}

// POST: save settings + log the change
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
    if (!adminUser || adminUser.role !== "superadmin") {
      return NextResponse.json(
        { msg: "Only superadmin can update settings" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const allowRegistration = !!body.allowRegistration;
    const maintenanceMode = !!body.maintenanceMode;
    const maintenanceMessage =
      typeof body.maintenanceMessage === "string"
        ? body.maintenanceMessage
        : "";
    const emailNotifications = body.emailNotifications !== undefined ? !!body.emailNotifications : true;
    const autoBackup = body.autoBackup !== undefined ? !!body.autoBackup : true;

    const cfg = await getOrCreateGlobalConfig();
    cfg.allowRegistration = allowRegistration;
    cfg.maintenanceMode = maintenanceMode;
    cfg.maintenanceMessage = maintenanceMessage;
    cfg.emailNotifications = emailNotifications;
    cfg.autoBackup = autoBackup;
    await cfg.save();

    // write admin log
    await AdminLog.create({
      action: "SYSTEM_SETTINGS_UPDATE",
      actorId: adminUser._id,
      actorStudentId: adminUser.studentId,
      actorRole: adminUser.role,
      details: "Updated system settings",
      metadata: {
        allowRegistration,
        maintenanceMode,
        maintenanceMessage,
      },
    });

    return NextResponse.json({
      msg: "Settings updated",
      allowRegistration,
      maintenanceMode,
      maintenanceMessage,
      emailNotifications,
      autoBackup,
    });
  } catch (err) {
    console.error("POST /api/admin/settings error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
