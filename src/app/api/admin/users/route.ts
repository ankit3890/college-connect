import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "../../../../models/User";

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
                { msg: "Only admin/superadmin can view users" },
                { status: 403 }
            );
        }

        // Fetch all users, sorted by creation date desc
        const users = await User.find({})
            .select("-passwordHash") // Exclude password hash
            .sort({ createdAt: -1 });

        return NextResponse.json({ users });
    } catch (err) {
        console.error("GET /api/admin/users error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
