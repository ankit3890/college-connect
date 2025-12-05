import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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

// One-time endpoint to make yourself admin
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // Verify authentication
        const token = getTokenFromRequest(req);
        if (!token) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const decoded = verifyToken<TokenPayload>(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json(
                { error: "Invalid authentication token" },
                { status: 401 }
            );
        }

        // Update current user to admin
        const user = await User.findByIdAndUpdate(
            decoded.id,
            { role: "admin" },
            { new: true }
        );

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: `User ${user.name} (${user.studentId}) is now an admin!`,
                user: {
                    id: user._id,
                    name: user.name,
                    studentId: user.studentId,
                    role: user.role,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Make admin error:", error);
        return NextResponse.json(
            { error: "Failed to make user admin" },
            { status: 500 }
        );
    }
}
