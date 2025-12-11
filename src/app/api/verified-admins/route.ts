import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
      await connectDB();
      // Find communities that are verified
      const verifiedCommunities = await Community.find({ isVerified: true });
      
      // Get unique creator usernames
      const creators = [...new Set(verifiedCommunities.map(c => c.creator))];
      
      // Fetch user details
      const users = await User.find({ username: { $in: creators } }).select("username avatarUrl");
      
      // Map to return format
      const admins = users.map(u => {
          const comms = verifiedCommunities.filter(c => c.creator === u.username).map(c => c.name);
          // Check if admin is member of 'Dev'
          const isDev = false; // logic would require checking Dev community members, simplified for now
          return {
              username: u.username,
              avatar: u.avatarUrl || null,
              communities: comms,
              isDevMember: isDev
          };
      });
      
      return NextResponse.json(admins);
  } catch(e) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
