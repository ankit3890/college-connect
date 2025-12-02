
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { connectDb, getGridFSBucket } from "./src/lib/syllabus/db";
import { parsePdfAndExtract } from "./src/lib/syllabus/pdfParser";
import { DocumentModel } from "./src/models/syllabus/Document";
import { PageModel } from "./src/models/syllabus/Page";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
console.log("MONGO_URI loaded:", process.env.MONGODB_URI ? "Yes" : "No");

const FILE_PATH = "C:/Users/ankit/Desktop/college-connect/syllabus-tool/backend/uploads/bookbtech118092025.pdf";

async function ingest() {
    try {
        console.log("Connecting to DB...");
        await connectDb();
        console.log("Connected.");

        if (!fs.existsSync(FILE_PATH)) {
            console.error("File not found:", FILE_PATH);
            return;
        }

        const filename = path.basename(FILE_PATH);
        const buffer = fs.readFileSync(FILE_PATH);

        // 1. Upload to GridFS
        const bucket = getGridFSBucket();
        const uploadStream = bucket.openUploadStream(filename);

        const streamPromise = new Promise((resolve, reject) => {
            uploadStream.on("finish", resolve);
            uploadStream.on("error", reject);
            uploadStream.end(buffer);
        });

        await streamPromise;
        console.log("Uploaded to GridFS");

        // 2. Parse PDF
        console.log("Parsing PDF...");
        const docData = await parsePdfAndExtract(FILE_PATH);
        console.log("PDF Parsed. Pages:", docData.pages.length);

        // 3. Save Document Metadata
        const newDoc = await DocumentModel.create({
            title: docData.title,
            filename: filename,
            metadata: { ...docData.meta, entries: docData.entries }
        });
        console.log("Document saved:", newDoc._id);

        // 4. Save Pages
        const pageDocs = docData.pages.map(p => ({
            docId: newDoc._id,
            pageNumber: p.pageNumber,
            text: p.text,
            subject: p.subject,
            code: p.code,
            topics: p.topics
        }));
        await PageModel.insertMany(pageDocs);
        console.log("Pages saved:", pageDocs.length);

        process.exit(0);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

ingest();
