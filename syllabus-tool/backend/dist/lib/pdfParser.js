"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePdfAndExtract = parsePdfAndExtract;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const uuid_1 = require("uuid");
function findSubjectFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let subject = "", code = "";
    // Heuristics
    for (const line of lines.slice(0, 15)) {
        // Code: e.g., MA101, CS202L, 18CS45
        const matchCode = line.match(/\b([A-Z]{2,4}\s?\d{2,4}[A-Z]?)\b/);
        if (matchCode && !code)
            code = matchCode[1];
        // Subject Name: Uppercase words, length > 5, not containing "SEMESTER" or "EXAMINATION"
        if (!subject && line.length > 5 && line === line.toUpperCase() && !line.includes("SEMESTER") && !line.includes("EXAM")) {
            subject = line;
        }
    }
    return { subject, code };
}
function extractCredits(text) {
    const match = text.match(/(?:Credits|L[:\-]T[:\-]P)\s*[:\-]?\s*([0-9\s:\-\+]+)/i);
    return match ? match[1].trim() : undefined;
}
function extractTopics(text) {
    // Look for "Unit I", "Module 1", etc.
    const topics = [];
    const regex = /(?:Unit|Module)\s*[IVX0-9]+\s*[:\-]?\s*([^\n]+)/gi;
    let m;
    while ((m = regex.exec(text)) !== null) {
        topics.push(m[1].trim());
    }
    return topics;
}
function extractMarks(text) {
    const marks = {};
    const patterns = [
        { key: "Internal", regex: /(?:Internal|CIE|Continuous)\s*[:\-]?\s*(\d+)/i },
        { key: "External", regex: /(?:External|SEE|Semester End)\s*[:\-]?\s*(\d+)/i },
        { key: "Total", regex: /(?:Total|Max)\s*[:\-]?\s*(\d+)/i }
    ];
    for (const p of patterns) {
        const m = text.match(p.regex);
        if (m)
            marks[p.key] = m[1];
    }
    return Object.keys(marks).length > 0 ? marks : undefined;
}
async function parsePdfAndExtract(filePath) {
    const data = fs_1.default.readFileSync(filePath);
    const parsed = await (0, pdf_parse_1.default)(data, { pagerender: undefined });
    const rawText = parsed.text || "";
    const chunks = rawText.split(/\f+/).filter(Boolean);
    const docId = (0, uuid_1.v4)();
    const pages = [];
    const entries = [];
    chunks.forEach((t, i) => {
        const { subject, code } = findSubjectFromText(t);
        const credits = extractCredits(t);
        const topics = extractTopics(t);
        const marks = extractMarks(t);
        pages.push({ pageNumber: i + 1, text: t.trim(), subject, code, topics });
        // If we found a subject code, treat it as a potential syllabus entry
        if (code) {
            entries.push({
                id: (0, uuid_1.v4)(),
                docId,
                subjectCode: code,
                subjectName: subject || "Unknown Subject",
                credits,
                topics,
                marksCriteria: marks,
                sourcePage: i + 1
            });
        }
    });
    return {
        id: docId,
        title: `Syllabus ${new Date().toISOString()}`,
        meta: { originalName: filePath },
        pages,
        entries
    };
}
