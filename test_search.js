
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/syllabus-tool";

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

async function testSearch(q) {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        console.log(`Searching for: "${q}"`);

        const pages = await PageModel.find(
            { $text: { $search: q } },
            { score: { $meta: "textScore" } }
        )
            .sort({ score: { $meta: "textScore" } })
            .limit(10)
            .populate("docId", "title metadata");

        console.log(`Found ${pages.length} pages.`);
        if (pages.length > 0) {
            console.log("SUCCESS: Found results for IT101L");
            console.log("First result subject:", pages[0].subject);
            console.log("First result code:", pages[0].code);
            const doc = pages[0].docId;
            const entry = doc.metadata.entries ? doc.metadata.entries.find(e => e.subjectCode === pages[0].code) : null;
            console.log("Marks Criteria:", entry ? entry.marksCriteria : "No entry found");

            // Find text with "Evaluation Scheme"
            const evalPage = await PageModel.findOne({ docId: doc._id, text: /Evaluation\s*Scheme/i });
            if (entry) {
                console.log("Topics Count:", entry.topics.length);
                console.log("Marks:", entry.marksCriteria);
            }
        } else {
            console.log("FAILURE: No results for IT101L");
        }
        console.log("No results found. Checking if any pages exist with this code directly...");
        const directMatch = await PageModel.findOne({ code: q });
        if (directMatch) {
            console.log("Found direct match by code:", directMatch);
        } else {
            console.log("No direct match by code either.");
            // Check regex
            const regexMatch = await PageModel.findOne({ text: new RegExp(q, "i") });
            if (regexMatch) {
                console.log("Found regex match in text:", regexMatch._id);
            } else {
                console.log("No regex match in text.");
            }
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

testSearch("MA101L");
