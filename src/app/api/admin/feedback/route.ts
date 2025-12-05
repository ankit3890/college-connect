import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Feedback from "@/models/Feedback";
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

// GET all feedback (admin only)
export async function GET(req: NextRequest) {
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

        // Check if user is admin or superadmin
        const user = await User.findById(decoded.id);
        if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        // Get all feedback with user details
        const feedbacks = await Feedback.find()
            .populate("userId", "name studentId email")
            .sort({ createdAt: -1 })
            .limit(200);

        return NextResponse.json({ feedbacks }, { status: 200 });
    } catch (error) {
        console.error("Feedback retrieval error:", error);
        return NextResponse.json(
            { error: "Failed to retrieve feedback" },
            { status: 500 }
        );
    }
}

// PATCH to update feedback status (admin only)
export async function PATCH(req: NextRequest) {
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

        // Check if user is admin or superadmin
        const user = await User.findById(decoded.id);
        if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { feedbackId, status } = body;

        if (!feedbackId || !status) {
            return NextResponse.json(
                { error: "Feedback ID and status are required" },
                { status: 400 }
            );
        }

        const validStatuses = ["pending", "reviewed", "implemented"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        const feedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { status },
            { new: true }
        );

        if (!feedback) {
            return NextResponse.json(
                { error: "Feedback not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, feedback },
            { status: 200 }
        );
    } catch (error) {
        console.error("Feedback update error:", error);
        return NextResponse.json(
            { error: "Failed to update feedback" },
            { status: 500 }
        );
    }
}
