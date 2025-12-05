
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
if (!process.env.MONGODB_URI) {
    // try .env.local
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
}

import { connectDB } from "../src/lib/db";
import User from "../src/models/User";
import Follow from "../src/models/Follow";

async function run() {
    try {
        console.log("Connecting to DB...");
        await connectDB();
        console.log("Connected.");

        console.log("User Model Name:", User.modelName);
        console.log("Follow Model Name:", Follow.modelName);

        const followCount = await Follow.countDocuments();
        console.log(`Total Follow records: ${followCount}`);

        if (followCount === 0) {
            console.log("No follow records found. Try following someone first.");
        } else {
            const follows = await Follow.find().limit(5).lean();
            console.log("Raw Follows (first 5):", JSON.stringify(follows, null, 2));

            const populated = await Follow.find().limit(5).populate("followerId").populate("followingId");
            console.log("Populated Follows (first 5):");
            populated.forEach((f: any, i) => {
                console.log(`[${i}] Follower:`, f.followerId ? f.followerId.username : "NULL (Population Failed)");
                console.log(`[${i}] Following:`, f.followingId ? f.followingId.username : "NULL (Population Failed)");
            });
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

run();
