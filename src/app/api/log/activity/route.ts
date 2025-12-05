import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserActivityLog from "@/models/UserActivityLog";
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

export async function POST(req: Request) {
    try {
        await connectDB();

        const { action, details } = await req.json();

        // Get IP Address
        const forwardedFor = req.headers.get("x-forwarded-for");
        const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "Unknown IP";
        const userAgent = req.headers.get("user-agent") || "Unknown";

        // Check Auth
        let userId = null;
        let studentId = null;
        let name = null;

        const token = getTokenFromRequest(req);
        if (token) {
            const decoded = verifyToken<TokenPayload>(token);
            if (decoded) {
                const user = await User.findById(decoded.id);
                if (user) {
                    userId = user._id;
                    studentId = user.studentId;
                    name = user.name;
                }
            }
        }

        // Check if New Visitor (IP never seen before)
        const existingLog = await UserActivityLog.findOne({ ipAddress });
        const isNewVisitor = !existingLog;

        await UserActivityLog.create({
            userId,
            studentId,
            name,
            ipAddress,
            action: action || "ACCESS_FEATURE",
            details,
            userAgent,
            isNewVisitor,
        });

        return NextResponse.json({ msg: "Logged" });
    } catch (err) {
        console.error("Log Activity Error:", err);
        return NextResponse.json({ msg: "Error" }, { status: 500 });
    }
}
