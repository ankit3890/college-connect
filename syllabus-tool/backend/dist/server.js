"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const pdfParser_1 = require("./lib/pdfParser");
const db_1 = require("./lib/db");
const Document_1 = require("./models/Document");
const Page_1 = require("./models/Page");
const cors_1 = __importDefault(require("cors"));
const upload = (0, multer_1.default)({ dest: "temp_uploads/" });
console.log("Multer initialized");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
console.log("Express initialized");
app.use(express_1.default.json());
console.log("Express json middleware added");
// Connect to MongoDB
console.log("Connecting to DB...");
(0, db_1.connectDb)().then(() => console.log("DB connection initiated"));
// Ensure temp_uploads exists
if (!fs_1.default.existsSync("temp_uploads")) {
    fs_1.default.mkdirSync("temp_uploads");
}
// upload + parse endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ msg: "missing file" });
        const filepath = req.file.path;
        const filename = req.file.originalname;
        // 1. Upload to GridFS
        const bucket = (0, db_1.getGridFSBucket)();
        const uploadStream = bucket.openUploadStream(filename);
        const fileStream = fs_1.default.createReadStream(filepath);
        fileStream.pipe(uploadStream);
        await new Promise((resolve, reject) => {
            uploadStream.on("finish", resolve);
            uploadStream.on("error", reject);
        });
        // 2. Parse PDF
        const docData = await (0, pdfParser_1.parsePdfAndExtract)(filepath);
        // 3. Save Document Metadata
        const newDoc = await Document_1.DocumentModel.create({
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
        await Page_1.PageModel.insertMany(pageDocs);
        // Cleanup temp file
        fs_1.default.unlinkSync(filepath);
        return res.json({ msg: "uploaded", doc: newDoc, pages: pageDocs.length });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "error", error: String(err) });
    }
});
// search endpoint
app.get("/search", async (req, res) => {
    try {
        const q = String(req.query.q || "");
        if (!q)
            return res.json({ q, results: [] });
        // Full text search on Pages
        const pages = await Page_1.PageModel.find({ $text: { $search: q } }, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" } })
            .limit(20)
            .populate("docId", "title");
        const results = pages.map(p => ({
            ref: `${p.docId._id}::${p.pageNumber}`, // Format: docId::pageNo
            score: p.score,
            matchData: {
                metadata: {
                    title: p.docId.title,
                    subject: p.subject,
                    code: p.code,
                    pageNumber: p.pageNumber,
                    text: p.text.substring(0, 200) + "..." // Snippet
                }
            }
        }));
        return res.json({ q, results });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "error" });
    }
});
// fetch subject details
app.get("/subject/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Try to find by Doc ID
        const doc = await Document_1.DocumentModel.findById(id);
        if (doc) {
            return res.json({ doc, entries: doc.metadata.entries || [] });
        }
        return res.status(404).send("not found");
    }
    catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Backend listening", PORT));
