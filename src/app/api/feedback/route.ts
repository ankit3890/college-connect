import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Feedback from "@/models/Feedback";
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

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // Get IP address
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";

        // Try to verify authentication (optional for feedback)
        const token = getTokenFromRequest(req);
        let userId: string | undefined;

        if (token) {
            const decoded = verifyToken<TokenPayload>(token);
            if (decoded?.id) {
                userId = decoded.id;
            }
        }

        // Parse request body
        const body = await req.json();
        const { type, message, category } = body;

        // Validate required fields
        if (!type || !message) {
            return NextResponse.json(
                { error: "Type and message are required" },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = ["feature", "improvement", "name_suggestion"];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: "Invalid feedback type" },
                { status: 400 }
            );
        }

        // Validate message length
        if (message.trim().length === 0 || message.length > 1000) {
            return NextResponse.json(
                { error: "Message must be between 1 and 1000 characters" },
                { status: 400 }
            );
        }

        // Create feedback (with userId if authenticated, IP if not)
        const feedbackData: any = {
            type,
            message: message.trim(),
            category: category?.trim() || undefined,
            status: "pending",
        };

        if (userId) {
            feedbackData.userId = userId;
        } else {
            feedbackData.ipAddress = ip;
        }

        const feedback = await Feedback.create(feedbackData) as any;

        return NextResponse.json(
            {
                success: true,
                message: "Feedback submitted successfully!",
                feedbackId: feedback._id.toString(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Feedback submission error:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}

// Optional: GET endpoint to retrieve user's feedback
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

        // Get user's feedback
        const feedbacks = await Feedback.find({ userId: decoded.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .select("-__v");

        return NextResponse.json({ feedbacks }, { status: 200 });
    } catch (error) {
        console.error("Feedback retrieval error:", error);
        return NextResponse.json(
            { error: "Failed to retrieve feedback" },
            { status: 500 }
        );
    }
}
