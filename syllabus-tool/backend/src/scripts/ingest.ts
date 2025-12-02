import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDb, getGridFSBucket } from "../lib/db";
import { parsePdfAndExtract } from "../lib/pdfParser";
import { DocumentModel } from "../models/Document";
import { PageModel } from "../models/Page";

const SYLLABUS_DIR = path.join(__dirname, "../../syllabus_files");

async function ingest() {
    await connectDb();
    const bucket = getGridFSBucket();

    if (!fs.existsSync(SYLLABUS_DIR)) {
        console.error(`Directory not found: ${SYLLABUS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(SYLLABUS_DIR).filter(f => f.toLowerCase().endsWith(".pdf"));
    console.log(`Found ${files.length} PDF files in ${SYLLABUS_DIR}`);

    for (const file of files) {
        const filePath = path.join(SYLLABUS_DIR, file);

        // Check if already exists
        const existing = await DocumentModel.findOne({ filename: file });
        if (existing) {
            console.log(`Re-indexing ${file}...`);
            await DocumentModel.deleteOne({ _id: existing._id });
            await PageModel.deleteMany({ docId: existing._id });
            // Note: We are not deleting the GridFS file here to keep it simple, 
            // but we will upload a new one. This might create duplicates in GridFS but that's acceptable for now.
        }

        console.log(`Processing ${file}...`);
        try {
            const fileBuffer = fs.readFileSync(filePath);

            // 1. Upload to GridFS
            const uploadStream = bucket.openUploadStream(file);
            uploadStream.write(fileBuffer);
            uploadStream.end();

            await new Promise((resolve, reject) => {
                uploadStream.on("finish", resolve);
                uploadStream.on("error", reject);
            });

            // 2. Parse and Extract
            const { pages, entries } = await parsePdfAndExtract(fileBuffer as any);

            // 3. Save Metadata
            const doc = await DocumentModel.create({
                filename: file,
                uploadedAt: new Date(),
                title: entries[0]?.subjectName || file,
                metadata: {
                    entries
                }
            });

            // 4. Save Pages
            const pageDocs = pages.map((p, i) => ({
                docId: doc._id,
                pageNumber: p.pageNumber,
                text: p.text,
                subject: p.subject || entries[0]?.subjectName,
                code: p.code || entries[0]?.subjectCode,
                topics: p.topics || entries[0]?.topics
            }));
            await PageModel.insertMany(pageDocs);

            console.log(`Successfully ingested ${file}`);
        } catch (err) {
            console.error(`Failed to ingest ${file}:`, err);
        }
    }

    console.log("Ingestion complete.");
    process.exit(0);
}

ingest();
