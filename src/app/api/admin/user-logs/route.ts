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

export async function GET(req: Request) {
    try {
        await connectDB();

        // 1. Auth Check (Admin Only)
        const token = getTokenFromRequest(req);
        if (!token) return NextResponse.json({ msg: "Not logged in" }, { status: 401 });

        const decoded = verifyToken<TokenPayload>(token);
        if (!decoded) return NextResponse.json({ msg: "Invalid token" }, { status: 401 });

        const adminUser = await User.findById(decoded.id);
        if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "superadmin")) {
            return NextResponse.json({ msg: "Unauthorized" }, { status: 403 });
        }

        // 2. Parse Query Params
        const { searchParams } = new URL(req.url);
        const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
        const search = (searchParams.get("search") || "").trim();
        const dateStr = searchParams.get("date");
        const category = searchParams.get("category") || "all";

        const filter: any = {};

        // 3. Apply Filters
        if (search) {
            filter.$or = [
                { studentId: { $regex: search, $options: "i" } },
                { ipAddress: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
            ];
        }

        if (dateStr) {
            const startOfDay = new Date(dateStr);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateStr);
            endOfDay.setHours(23, 59, 59, 999);

            if (!isNaN(startOfDay.getTime())) {
                filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
            }
        }

        // Category Filter
        if (category !== "all") {
            switch (category) {
                case "auth":
                    filter.action = { $in: ["USER_LOGIN", "USER_LOGOUT"] };
                    break;
                case "attendance":
                    filter.action = "ACCESS_ATTENDANCE";
                    break;
                case "syllabus":
                    filter.action = "ACCESS_SYLLABUS";
                    break;
                case "profile":
                    filter.action = { $in: ["ACCESS_PROFILE", "UPDATE_PROFILE", "SYNC_PROFILE"] };
                    break;
                case "follow":
                    filter.action = { $in: ["FOLLOW_USER", "UNFOLLOW_USER"] };
                    break;
                case "view_profile":
                    filter.action = "VIEW_PROFILE";
                    break;
                case "search_profile":
                    filter.action = "SEARCH_PROFILE";
                    break;
                case "settings":
                    filter.action = "ACCESS_SETTINGS";
                    break;
            }
        }

        // 4. Fetch Logs
        const total = await UserActivityLog.countDocuments(filter);
        const logs = await UserActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalPages = Math.ceil(total / limit) || 1;

        // 5. Calculate Analytics (Based on current filter)
        const uniqueVisitors = (await UserActivityLog.distinct("ipAddress", filter)).length;
        const newVisitors = await UserActivityLog.countDocuments({ ...filter, isNewVisitor: true });
        const returningVisitorLogs = await UserActivityLog.countDocuments({ ...filter, isNewVisitor: false });

        return NextResponse.json({
            logs,
            page,
            limit,
            total,
            totalPages,
            stats: {
                uniqueVisitors,
                newVisitors,
                returningVisitorLogs
            }
        });

    } catch (err) {
        console.error("GET /api/admin/user-logs error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
