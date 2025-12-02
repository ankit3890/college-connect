
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/syllabus-tool";

const PageSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    pageNumber: { type: Number, required: true },
    text: { type: String, required: true },
    subject: { type: String },
    code: { type: String },
    topics: { type: [String], default: [] }
});
PageSchema.index({ text: "text", subject: "text", code: "text", topics: "text" });

const PageModel = mongoose.model("Page", PageSchema);

async function checkDb() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const count = await PageModel.countDocuments();
        console.log("Page count:", count);

        if (count > 0) {
            const sample = await PageModel.findOne();
            console.log("Sample page:", sample);

            // Check indexes
            const indexes = await PageModel.listIndexes();
            console.log("Indexes:", indexes);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDb();
