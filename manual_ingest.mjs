
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/syllabus-tool";
const FILE_PATH = "C:/Users/ankit/Desktop/college-connect/syllabus-tool/backend/uploads/bookbtech118092025.pdf";

// --- Schemas ---
const PageSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    pageNumber: { type: Number, required: true },
    text: { type: String, required: true },
    subject: { type: String },
    code: { type: String },
    topics: { type: [String], default: [] }
});
PageSchema.index({ text: "text", subject: "text", code: "text", topics: "text" });
const PageModel = mongoose.models.Page || mongoose.model("Page", PageSchema);

const DocumentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    filename: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});
const DocumentModel = mongoose.models.Document || mongoose.model("Document", DocumentSchema);

// --- PDF Parser Logic (Simplified) ---
function findSubjectFromText(text) {
    const codeMatch = text.match(/(?:Course|Subject)\s*Code\s*[:\-]?\s*([A-Z0-9\s]+?)(?=\s*(?:Course|Subject)|$)/i);
    let code = codeMatch ? codeMatch[1].replace(/\s+/g, "") : "";
    let subject = "";
    const nameMatch = text.match(/(?:Course|Subject)\s*Name\s*[:\-]?\s*([^\n\r]+)/i);
    if (nameMatch) subject = nameMatch[1].trim();
    return { subject, code };
}

async function parsePdfAndExtract(input) {
    const dataBuffer = fs.readFileSync(input);
    const data = await pdf(dataBuffer);
    const text = data.text;

    const pages = text.split(/\f/).map((t, i) => {
        const { subject, code } = findSubjectFromText(t);
        return {
            pageNumber: i + 1,
            text: t.trim(),
            subject,
            code,
            topics: []
        };
    });

    return {
        title: "Manual Upload",
        meta: { originalName: path.basename(input) },
        pages,
        entries: []
    };
}

// --- Main ---
async function ingest() {
    try {
        console.log("Connecting to DB...", MONGO_URI.replace(/:([^:@]+)@/, ":****@"));
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        if (!fs.existsSync(FILE_PATH)) {
            console.error("File not found:", FILE_PATH);
            return;
        }

        const filename = path.basename(FILE_PATH);
        const buffer = fs.readFileSync(FILE_PATH);
        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });

        // 1. Upload to GridFS
        console.log("Uploading to GridFS...");
        const uploadStream = bucket.openUploadStream(filename);
        await new Promise((resolve, reject) => {
            uploadStream.on("finish", resolve);
            uploadStream.on("error", reject);
            uploadStream.end(buffer);
        });
        console.log("Uploaded.");

        // 2. Parse PDF
        console.log("Parsing PDF...");
        const docData = await parsePdfAndExtract(FILE_PATH);
        console.log("PDF Parsed. Pages:", docData.pages.length);

        // 3. Save Document
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
        console.log(`Saved ${pageDocs.length} pages.`);

        console.log("Done!");
        process.exit(0);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

ingest();
