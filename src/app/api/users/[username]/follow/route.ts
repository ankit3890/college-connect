import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";
import UserActivityLog from "@/models/UserActivityLog";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

interface TokenPayload {
    id: string;
}

// Helper to get current user ID
async function getCurrentUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const decoded = verifyToken<TokenPayload>(token);
    return decoded ? decoded.id : null;
}

// POST: Toggle Follow
export async function POST(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        await connectDB();
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ msg: "Not logged in" }, { status: 401 });
        }

        // Fetch current user to check sync status
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return NextResponse.json({ msg: "User not found" }, { status: 404 });
        }

        if (!currentUser.hasSyncedFromCyberVidya) {
            return NextResponse.json({ msg: "You must sync your account with CyberVidya to follow users." }, { status: 403 });
        }

        const { username } = await params;
        // Find target user by username OR studentId
        const targetUser = await User.findOne({
            $or: [
                { username: username },
                { studentId: username }
            ]
        });

        if (!targetUser) {
            return NextResponse.json({ msg: "User not found" }, { status: 404 });
        }

        if (targetUser._id.toString() === currentUserId) {
            return NextResponse.json({ msg: "Cannot follow yourself" }, { status: 400 });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            followerId: currentUserId,
            followingId: targetUser._id,
        });

        if (existingFollow) {
            // UNFOLLOW
            await Follow.findByIdAndDelete(existingFollow._id);

            // Decrement counts
            await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
            await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: -1 } });

            // Log Activity
            await UserActivityLog.create({
                action: "UNFOLLOW_USER",
                userId: currentUserId,
                studentId: currentUser.studentId,
                name: currentUser.name,
                details: `Unfollowed user ${targetUser.username || targetUser.studentId}`,
                ipAddress: req.headers.get("x-forwarded-for") || "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
            });

            return NextResponse.json({ isFollowing: false, msg: "Unfollowed" });
        } else {
            // FOLLOW
            await Follow.create({
                followerId: currentUserId,
                followingId: targetUser._id,
            });

            // Increment counts
            await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: 1 } });

            // Log Activity
            await UserActivityLog.create({
                action: "FOLLOW_USER",
                userId: currentUserId,
                studentId: currentUser.studentId,
                name: currentUser.name,
                details: `Followed user ${targetUser.username || targetUser.studentId}`,
                ipAddress: req.headers.get("x-forwarded-for") || "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
            });

            return NextResponse.json({ isFollowing: true, msg: "Followed" });
        }

    } catch (err) {
        console.error("Follow toggle error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}

// GET: Check if following
export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        await connectDB();
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ isFollowing: false });
        }

        const { username } = await params;
        const targetUser = await User.findOne({ username });

        if (!targetUser) {
            return NextResponse.json({ isFollowing: false });
        }

        const existingFollow = await Follow.findOne({
            followerId: currentUserId,
            followingId: targetUser._id,
        });

        return NextResponse.json({ isFollowing: !!existingFollow });

    } catch (err) {
        console.error("Check follow status error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
