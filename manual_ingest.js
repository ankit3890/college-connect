
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: ".env.local" });

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

// --- Parsing Logic (Adapted from pdfParser.ts) ---

function findSubjectFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let subject = "", code = "";

    for (const line of lines) {
        const codeMatch = line.match(/(?:Course|Subject)\s*Code\s*[:\-]?\s*([A-Z0-9\s]+?)(?=\s*(?:Course|Subject)|$)/i);
        if (codeMatch) {
            code = codeMatch[1].replace(/\s+/g, "");
        }
        const nameMatch = line.match(/(?:Course|Subject)\s*Name\s*[:\-]?\s*([^\n\r]+)/i);
        if (nameMatch) {
            subject = nameMatch[1].trim();
            subject = subject.replace(/L\s*T\s*P\s*C.*/i, "").trim();
        }
    }

    if (!subject) {
        for (const line of lines.slice(0, 15)) {
            if (line.length > 5 && line === line.toUpperCase() && !line.includes("SEMESTER") && !line.includes("EXAM") && !line.includes("CODE")) {
                subject = line;
                break;
            }
        }
    }
    return { subject, code };
}

function extractCredits(text) {
    const ltpMatch = text.match(/L\s*T\s*P\s*C\s*[\r\n]+([0-9\s]+)/i);
    if (ltpMatch) return ltpMatch[1].trim();
    const match = text.match(/(?:Credits|L[:\-]T[:\-]P)\s*[:\-]?\s*([0-9\s:\-\+]+)/i);
    return match ? match[1].trim() : undefined;
}

function extractTopics(text) {
    text = text.replace(/\*\*/g, "");
    text = text.replace(/Course\s*Book\s*let\s*B\.\s*Tech\..*$/gim, "");
    text = text.replace(/KIET\s*Group\s*of\s*Institutions.*$/gim, "");

    const topics = [];
    const unitRegex = /(?:Unit|Module)\s*([IVX0-9]+)\s*[:\-]?\s*([^\n]*)/gi;
    let match;
    let lastIndex = 0;
    let lastUnit = null;

    while ((match = unitRegex.exec(text)) !== null) {
        if (lastUnit) {
            let content = text.substring(lastIndex, match.index).trim();
            if (!lastUnit.hours) {
                const hMatch = content.match(/^([\d\s]+\s*hours)/i);
                if (hMatch) {
                    lastUnit.hours = hMatch[1].trim();
                    content = content.replace(/^([\d\s]+\s*hours)/i, "").trim();
                }
            }
            topics.push(`Unit ${lastUnit.num} || ${lastUnit.title} || ${lastUnit.hours} || ${content}`);
        }

        let unitNum = match[1];
        let title = match[2].trim();
        let hours = "";
        lastIndex = unitRegex.lastIndex;

        const hMatch = title.match(/([\d\s]+\s*hours)/i);
        if (hMatch) {
            hours = hMatch[1].trim();
            title = title.replace(/[\d\s]+\s*hours/i, "").trim();
        }
        title = title.replace(/[:\-]+$/, "").trim();

        if (!title && lastIndex < text.length) {
            let tempIndex = lastIndex;
            while (tempIndex < text.length && (text[tempIndex] === '\r' || text[tempIndex] === '\n' || text[tempIndex] === ' ')) {
                tempIndex++;
            }
            const nextNewline = text.indexOf('\n', tempIndex);
            if (nextNewline !== -1) {
                const nextLine = text.substring(tempIndex, nextNewline).trim();
                if (nextLine.length > 0 && nextLine.length < 100 && !/Unit\s*\d+/i.test(nextLine)) {
                    title = nextLine;
                    const hMatchNext = title.match(/([\d\s]+\s*hours)/i);
                    if (hMatchNext) {
                        hours = hMatchNext[1].trim();
                        title = title.replace(/[\d\s]+\s*hours/i, "").trim();
                    }
                    lastIndex = nextNewline + 1;
                }
            }
        }
        lastUnit = { num: unitNum, title, hours };
    }

    if (lastUnit) {
        const remaining = text.substring(lastIndex);
        const endMatch = remaining.match(/(?:Text\s*Books|Reference|Course\s*Outcome|Evaluation|Mode\s*of\s*Evaluation)/i);
        let content = endMatch ? remaining.substring(0, endMatch.index).trim() : remaining.trim();
        if (!lastUnit.hours) {
            const hMatch = content.match(/^([\d\s]+\s*hours)/i);
            if (hMatch) {
                lastUnit.hours = hMatch[1].trim();
                content = content.replace(/^([\d\s]+\s*hours)/i, "").trim();
            }
        }
        topics.push(`Unit ${lastUnit.num} || ${lastUnit.title} || ${lastUnit.hours} || ${content}`);
    }
    return topics;
}

function extractMarks(text) {
    // Clean up footer to avoid picking up year "202 5" as marks
    text = text.replace(/Course\s*Book\s*let\s*B\.\s*Tech\..*$/gim, "");
    text = text.replace(/KIET\s*Group\s*of\s*Institutions.*$/gim, "");
    text = text.replace(/202\s*5\s*-\s*2\s*6/g, ""); // Specific year pattern

    const marks = {};
    const evalMatch = text.match(/Evaluation\s*Scheme/i);
    if (!evalMatch) return null;
    const evalSection = text.substring(evalMatch.index).split(/Course\s*Code|Unit/i)[0];

    // Extract numbers but filter out unlikely values (e.g. years like 2025, or page numbers if any)
    // Also filter > 200 as max marks is usually 200
    const numbers = evalSection.match(/\d+/g)?.map(Number).filter(n => n <= 200) || [];

    if (numbers.length >= 5) {
        const sorted = [...numbers].sort((a, b) => b - a);
        const total = sorted[0];
        if (total === 150) {
            marks['Total'] = 150; marks['ESE'] = numbers.find(n => n === 75) || 75;
            marks['MSE 1'] = 30; marks['MSE 2'] = 30; marks['CA1'] = 6; marks['CA2'] = 6; marks['CA3'] = 3;
            return marks;
        }
        if (total === 200) {
            marks['Total'] = 200; marks['ESE'] = 100;
            marks['MSE 1'] = 40; marks['MSE 2'] = 40; marks['CA1'] = 8; marks['CA2'] = 8; marks['CA3'] = 4;
            return marks;
        }
        marks['Total'] = sorted[0]; marks['ESE'] = sorted[1];
        marks['MSE 1'] = sorted[2]; marks['MSE 2'] = sorted[3];
        marks['CA1'] = sorted[4]; marks['CA2'] = sorted[5] || sorted[4]; marks['CA3'] = sorted[6] || sorted[4] / 2;
    }
    return marks;
}

function extractPrerequisites(text) {
    const match = text.match(/Pre\s*-\s*requisite\s*[:\-]?\s*([^\n\r]+)/i) || text.match(/Pre-requisite\s*[:\-]?\s*([^\n\r]+)/i);
    return match ? match[1].trim() : undefined;
}

function extractListSection(text, headerRegex, endRegex) {
    const startMatch = text.match(headerRegex);
    if (!startMatch) return undefined;
    const startIndex = startMatch.index + startMatch[0].length;
    const remainingText = text.substring(startIndex);
    const endMatch = remainingText.match(endRegex);
    const content = endMatch ? remainingText.substring(0, endMatch.index) : remainingText;
    const items = content.split(/\r?\n(?=\d+\.|•|\-)/).map(l => l.trim()).filter(l => l.length > 0);
    if (items.length <= 1) return content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    return items;
}

async function parsePdfAndExtract(input) {
    const dataBuffer = fs.readFileSync(input);
    const renderPage = (pageData) => {
        return pageData.getTextContent().then((textContent) => {
            const items = textContent.items.map((item) => ({
                str: item.str, x: item.transform[4], y: item.transform[5]
            }));
            items.sort((a, b) => {
                const yDiff = Math.abs(a.y - b.y);
                if (yDiff < 5) return a.x - b.x;
                return b.y - a.y;
            });
            let text = "";
            let lastY = -1;
            for (const item of items) {
                if (lastY === -1) text += item.str;
                else {
                    if (Math.abs(item.y - lastY) > 5) text += "\n" + item.str;
                    else text += " " + item.str;
                }
                lastY = item.y;
            }
            return text + "\f";
        });
    };

    const parsed = await pdf(dataBuffer, { pagerender: renderPage });
    const rawText = parsed.text || "";
    const chunks = rawText.split(/\f+/).filter(Boolean);

    const docId = uuidv4();
    const pages = [];
    const entries = [];

    let currentCode = "";
    let currentSubject = "";
    let currentText = "";
    let currentStartPage = 0;

    chunks.forEach((t, i) => {
        const cleanText = t.replace(/  +/g, " ");
        const { subject, code: rawCode } = findSubjectFromText(cleanText);
        const code = rawCode ? rawCode.toUpperCase() : "";

        pages.push({
            pageNumber: i + 1,
            text: cleanText.trim(),
            subject: subject || (currentCode ? currentSubject : undefined),
            code: code || (currentCode ? currentCode : undefined),
            topics: extractTopics(cleanText)
        });

        if (code && code !== currentCode) {
            let splitIndex = 0;
            const codeRegex = new RegExp(`(?:Course|Subject)\\s*Code\\s*[:\\-]?\\s*${code}`, "i");
            const match = cleanText.match(codeRegex);
            if (match) splitIndex = match.index;
            else {
                const simpleMatch = cleanText.match(new RegExp(`\\b${code}\\b`, 'i'));
                if (simpleMatch) splitIndex = simpleMatch.index;
            }

            const textBefore = cleanText.substring(0, splitIndex);
            const textAfter = cleanText.substring(splitIndex);

            if (currentCode) {
                currentText += "\n" + textBefore;
                entries.push({
                    id: uuidv4(), docId, subjectCode: currentCode, subjectName: currentSubject || "Unknown Subject",
                    credits: extractCredits(currentText), prerequisites: extractPrerequisites(currentText),
                    objectives: extractListSection(currentText, /Course\s*Objectives\s*[:\-]?/i, /Course\s*Outcome|CO\s*-\s*PO|CO-PO|Unit/i),
                    outcomes: extractListSection(currentText, /Course\s*Outcome\s*[:\-]?/i, /CO\s*-\s*PO|CO-PO|Unit/i),
                    topics: extractTopics(currentText), marksCriteria: extractMarks(currentText), sourcePage: currentStartPage
                });
            }
            currentCode = code; currentSubject = subject; currentText = textAfter; currentStartPage = i + 1;
        } else {
            if (currentCode) currentText += "\n" + cleanText;
        }
    });

    if (currentCode) {
        entries.push({
            id: uuidv4(), docId, subjectCode: currentCode, subjectName: currentSubject || "Unknown Subject",
            credits: extractCredits(currentText), prerequisites: extractPrerequisites(currentText),
            objectives: extractListSection(currentText, /Course\s*Objectives\s*[:\-]?/i, /Course\s*Outcome|CO\s*-\s*PO|CO-PO|Unit/i),
            outcomes: extractListSection(currentText, /Course\s*Outcome\s*[:\-]?/i, /CO\s*-\s*PO|CO-PO|Unit/i),
            topics: extractTopics(currentText), marksCriteria: extractMarks(currentText), sourcePage: currentStartPage
        });
    }

    return {
        title: "Manual Upload",
        meta: { originalName: path.basename(input), entries },
        pages,
        entries
    };
}

// --- Main ---
async function ingest() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        // Clean up old manual uploads
        console.log("Cleaning up old uploads...");
        await DocumentModel.deleteMany({ title: "Manual Upload" });
        await PageModel.deleteMany({ "docId": { $in: await DocumentModel.find({ title: "Manual Upload" }).select("_id") } });
        console.log("Cleanup done.");

        if (!fs.existsSync(FILE_PATH)) {
            console.error("File not found:", FILE_PATH);
            return;
        }

        const filename = path.basename(FILE_PATH);
        const buffer = fs.readFileSync(FILE_PATH);
        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });

        // 1. Upload to GridFS
        const uploadStream = bucket.openUploadStream(filename);
        await new Promise((resolve, reject) => {
            uploadStream.on("finish", resolve);
            uploadStream.on("error", reject);
            uploadStream.end(buffer);
        });
        console.log("Uploaded to GridFS");

        // 2. Parse PDF
        console.log("Parsing PDF...");
        const docData = await parsePdfAndExtract(FILE_PATH);
        console.log(`PDF Parsed. Pages: ${docData.pages.length}, Entries: ${docData.entries.length}`);

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

        const batchSize = 100;
        for (let i = 0; i < pageDocs.length; i += batchSize) {
            await PageModel.insertMany(pageDocs.slice(i, i + batchSize));
            console.log(`Saved pages ${i} to ${Math.min(i + batchSize, pageDocs.length)}`);
        }

        console.log("Done!");
        process.exit(0);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

ingest();
