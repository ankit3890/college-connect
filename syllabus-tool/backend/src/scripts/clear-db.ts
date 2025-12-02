import mongoose from "mongoose";
import dotenv from "dotenv";
import { DocumentModel } from "../models/Document";
import { SyllabusEntryModel } from "../models/SyllabusEntry";

dotenv.config();

async function clearDb() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to MongoDB");

    await DocumentModel.deleteMany({});
    await SyllabusEntryModel.deleteMany({});
    // We can leave the GridFS files for now as we are just re-parsing the text content which is stored in pages/entries
    // But wait, if we don't delete GridFS, the ingest script might still think it's there if it checks GridFS.
    // Let's check ingest.ts logic.

    // Actually, let's just delete everything to be safe.
    const db = mongoose.connection.db;
    if (db) {
        await db.collection("fs.files").deleteMany({});
        await db.collection("fs.chunks").deleteMany({});
        await db.collection("pages").deleteMany({});
    }

    console.log("Database cleared");
    await mongoose.disconnect();
}

clearDb();
