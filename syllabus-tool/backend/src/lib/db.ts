import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/syllabus-tool";

let gridfsBucket: mongoose.mongo.GridFSBucket;

export async function connectDb() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;
        if (db) {
            gridfsBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });
        }
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

export function getGridFSBucket() {
    if (!gridfsBucket) {
        throw new Error("GridFSBucket not initialized");
    }
    return gridfsBucket;
}
