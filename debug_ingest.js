
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const FILE_PATH = "C:/Users/ankit/Desktop/college-connect/syllabus-tool/backend/uploads/bookbtech118092025.pdf";

function findSubjectFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let subject = "", code = "";

    for (const line of lines) {
        const codeMatch = line.match(/(?:Course|Subject)\s*Code\s*[:\-]?\s*([A-Z0-9\s]+?)(?=\s*(?:Course|Subject)|$)/i);
        if (codeMatch) {
            code = codeMatch[1].replace(/\s+/g, "");
        }
    }
    return { code };
}

async function debug() {
    const dataBuffer = fs.readFileSync(FILE_PATH);
    const renderPage = (pageData) => {
        return pageData.getTextContent().then((textContent) => {
            let text = "";
            for (const item of textContent.items) {
                text += item.str + " ";
            }
            return text + "\f";
        });
    };

    const parsed = await pdf(dataBuffer, { pagerender: renderPage });
    const chunks = parsed.text.split(/\f+/).filter(Boolean);

    chunks.forEach((t, i) => {
        if (i + 1 === 18) {
            const { code } = findSubjectFromText(t);
            if (code === "MA202L") {
                const codeRegex = new RegExp(`(?:Course|Subject)\\s*Code\\s*[:\\-]?\\s*${code}`, "i");
                const match = t.match(codeRegex);
                if (match) {
                    console.log("--- UNIT 5 TEXT START ---");
                    console.log(t.substring(0, match.index));
                    console.log("--- UNIT 5 TEXT END ---");
                }
            }
        }
    });
}

debug();
