import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import { parsePdfAndExtract } from "./lib/pdfParser";
import { connectDb, getGridFSBucket } from "./lib/db";
import { DocumentModel } from "./models/Document";
import { PageModel } from "./models/Page";

import cors from "cors";

const upload = multer({ dest: "temp_uploads/" });
console.log("Multer initialized");
const app = express();
app.use(cors());
console.log("Express initialized");
app.use(express.json());
console.log("Express json middleware added");

// Connect to MongoDB
console.log("Connecting to DB...");
connectDb().then(() => console.log("DB connection initiated"));

// Ensure temp_uploads exists
if (!fs.existsSync("temp_uploads")) {
    fs.mkdirSync("temp_uploads");
}

// upload + parse endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: "missing file" });
        const filepath = req.file.path;
        const filename = req.file.originalname;

        // 1. Upload to GridFS
        const bucket = getGridFSBucket();
        const uploadStream = bucket.openUploadStream(filename);
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(uploadStream);

        await new Promise((resolve, reject) => {
            uploadStream.on("finish", resolve);
            uploadStream.on("error", reject);
        });

        // 2. Parse PDF
        const docData = await parsePdfAndExtract(filepath);

        // 3. Save Document Metadata
        const newDoc = await DocumentModel.create({
            title: docData.title,
            filename: filename,
            metadata: { ...docData.meta, entries: docData.entries }
        });

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

        // Cleanup temp file
        fs.unlinkSync(filepath);

        return res.json({ msg: "uploaded", doc: newDoc, pages: pageDocs.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "error", error: String(err) });
    }
});

// search endpoint
app.get("/search", async (req, res) => {
    try {
        const q = String(req.query.q || "");
        if (!q) return res.json({ q, results: [] });

        // Full text search on Pages
        // Increase limit to gather candidates for grouping
        const pages = await PageModel.find(
            { $text: { $search: q } },
            { score: { $meta: "textScore" } }
        )
            .sort({ score: { $meta: "textScore" } })
            .limit(100)
            .populate("docId", "title metadata"); // Fetch metadata to find entries

        // Group by Subject Code
        const groupedResults = new Map<string, any>();

        for (const p of pages) {
            const doc = p.docId as any;
            if (!doc) continue;

            const entries = doc.metadata?.entries || [];
            const entry = entries.find((e: any) => e.subjectCode === p.code);

            // Use subject code as key, fallback to subject name, or unique ID if neither exists
            const key = p.code || p.subject || p._id.toString();

            const resultItem = {
                ref: `${doc._id}::${p.pageNumber}`, // Format: docId::pageNo
                id: doc._id,
                entryId: entry?.id, // Return specific entry ID if found
                // score: (p as any).score, // No score in regex search
                matchData: {
                    metadata: {
                        title: doc.title,
                        subject: p.subject,
                        code: p.code,
                        pageNumber: p.pageNumber,
                        text: p.text.substring(0, 200) + "..." // Snippet
                    }
                }
            };

            // If we already have this subject, keep the first one found (or logic to pick best page?)
            // Since we don't have a score, we'll just keep the first occurrence or maybe the one with the lowest page number?
            // For now, let's just keep the first one we encounter.
            if (!groupedResults.has(key)) {
                groupedResults.set(key, resultItem);
            }
        }

        // Convert map values to array
        const results = Array.from(groupedResults.values())
            .slice(0, 20); // Return top 20 unique subjects

        return res.json({ q, results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "error" });
    }
});

// fetch subject details
app.get("/subject/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Try to find by Doc ID
        const doc = await DocumentModel.findById(id);
        if (doc) {
            return res.json({ doc, entries: doc.metadata.entries || [] });
        }
        return res.status(404).send("not found");
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

// stream pdf content
app.get("/doc/:id/content", async (req, res) => {
    try {
        const doc = await DocumentModel.findById(req.params.id);
        if (!doc) return res.status(404).send("not found");

        const bucket = getGridFSBucket();
        const downloadStream = bucket.openDownloadStreamByName(doc.filename);

        res.set("Content-Type", "application/pdf");
        downloadStream.pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Backend listening", PORT));
