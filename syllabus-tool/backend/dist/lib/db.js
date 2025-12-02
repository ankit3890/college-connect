"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
exports.getGridFSBucket = getGridFSBucket;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/syllabus-tool";
let gridfsBucket;
async function connectDb() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log("Connected to MongoDB");
        const db = mongoose_1.default.connection.db;
        if (db) {
            gridfsBucket = new mongoose_1.default.mongo.GridFSBucket(db, { bucketName: "uploads" });
        }
    }
    catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}
function getGridFSBucket() {
    if (!gridfsBucket) {
        throw new Error("GridFSBucket not initialized");
    }
    return gridfsBucket;
}
