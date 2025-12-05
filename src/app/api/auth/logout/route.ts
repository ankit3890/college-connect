// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import UserActivityLog from "@/models/UserActivityLog";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Get token to identify user before logout
    const cookieHeader = req.headers.get("cookie");
    let token = null;
    if (cookieHeader) {
      const parts = cookieHeader.split(";").map((p) => p.trim());
      for (const part of parts) {
        if (part.startsWith("token=")) {
          token = decodeURIComponent(part.substring("token=".length));
          break;
        }
      }
    }

    if (token) {
      const decoded = verifyToken<{ id: string; studentId: string }>(token);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user) {
          // LOG ACTIVITY
          try {
            const forwardedFor = req.headers.get("x-forwarded-for");
            const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "Unknown IP";
            const userAgent = req.headers.get("user-agent") || "Unknown";

            // Check if New Visitor
            const existingLog = await UserActivityLog.findOne({ ipAddress });
            const isNewVisitor = !existingLog;

            await UserActivityLog.create({
              userId: user._id,
              studentId: user.studentId,
              name: user.name,
              ipAddress,
              action: "USER_LOGOUT",
              details: "User logged out",
              userAgent,
              isNewVisitor,
            });
          } catch (logErr) {
            console.error("Failed to log logout activity:", logErr);
          }
        }
      }
    }
  } catch (err) {
    console.error("Logout log error:", err);
  }

  // Create the response
  const res = NextResponse.json({ msg: "Logged out successfully" });

  // Clear the cookie on the response so the browser removes it
  res.cookies.set({
    name: "token",   // 👈 must match cookie name used in login
    value: "",
    httpOnly: true,
    path: "/",       // 👈 must match login path
    maxAge: 0,       // expire now
    sameSite: "lax",
    // secure: true, // enable this if you used secure: true when setting the cookie on login (for HTTPS)
  });

  return res;
}
