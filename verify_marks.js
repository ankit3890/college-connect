
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/syllabus-tool";

const DocumentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});
const DocumentModel = mongoose.models.Document || mongoose.model("Document", DocumentSchema);

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const docs = await DocumentModel.find({});
        for (const doc of docs) {
            if (doc.metadata && doc.metadata.entries) {
                const entry = doc.metadata.entries.find(e => e.subjectCode === "MA101L");
                if (entry) {
                    console.log("MA101L Marks:", entry.marksCriteria);
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
