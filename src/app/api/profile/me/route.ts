import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import UserActivityLog from "@/models/UserActivityLog";

export const dynamic = 'force-dynamic';


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

        const user = await User.findById(decoded.id).select("-passwordHash");
        if (!user) {
            return NextResponse.json({ msg: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ profile: user });
    } catch (err) {
        console.error("GET /api/profile/me error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
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

        const body = await req.json();

        // Fetch current user to check if username is already set
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return NextResponse.json({ msg: "User not found" }, { status: 404 });
        }

        // Allowed update fields whitelist
        const allowedFields = [
            "displayName",
            // "username", // Handled separately below
            "avatarUrl",
            "bannerUrl",
            "accentColor",
            "bio",
            "statusText",
            "interests",
            "skills",
            "socials",
            "isPublicProfile",
            "showBranchYear",
            "mobileNumber",
            "hideContacts"
        ];

        const updates: any = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        // Username Update Logic: Only allow if NOT currently set
        if (body.username) {
            if (!currentUser.username) {
                // Check uniqueness
                const existingUser = await User.findOne({ username: body.username });
                if (existingUser) {
                    return NextResponse.json({ msg: "Username already taken" }, { status: 400 });
                }
                updates.username = body.username;
            } else if (body.username !== currentUser.username) {
                console.warn(`Attempt to change username from ${currentUser.username} to ${body.username} blocked.`);
                // Do not update, silently ignore or could return error if strict
            }
        }

        const updatedUser = await User.findByIdAndUpdate(decoded.id, { $set: updates }, {
            new: true,
            runValidators: true
        }).select("-passwordHash");

        // LOG ACTIVITY
        try {
            const forwardedFor = req.headers.get("x-forwarded-for");
            const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "Unknown IP";
            const userAgent = req.headers.get("user-agent") || "Unknown";

            // Check if New Visitor
            const existingLog = await UserActivityLog.findOne({ ipAddress });
            const isNewVisitor = !existingLog;

            await UserActivityLog.create({
                userId: updatedUser._id,
                studentId: updatedUser.studentId,
                name: updatedUser.name,
                ipAddress,
                action: "UPDATE_PROFILE",
                details: "User updated their profile",
                userAgent,
                isNewVisitor,
            });
        } catch (logErr) {
            console.error("Failed to log profile update:", logErr);
        }

        return NextResponse.json({ profile: updatedUser, msg: "Profile updated successfully" });
    } catch (err) {
        console.error("PATCH /api/profile/me error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
