"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexDocuments = indexDocuments;
exports.buildIndex = buildIndex;
exports.rebuildIndex = rebuildIndex;
exports.searchIndex = searchIndex;
exports.getPage = getPage;
const lunr_1 = __importDefault(require("lunr"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const INDEX_FILE = path_1.default.join(__dirname, "../../indexes/lunr-index.json");
let idx = null;
const store = {};
function indexDocuments(pages, docId) {
    // pages: [{ pageNumber, text, subject, code }]
    // add to store
    for (const p of pages) {
        const docKey = `${docId}::${p.pageNumber}`;
        store[docKey] = { id: docKey, page: p.pageNumber, text: p.text, subject: p.subject, code: p.code };
    }
    buildIndex();
}
function buildIndex() {
    idx = (0, lunr_1.default)(function () {
        this.ref("id");
        this.field("text");
        this.field("subject");
        this.field("code");
        for (const k of Object.keys(store)) {
            this.add(store[k]);
        }
    });
    // persist
    try {
        fs_1.default.mkdirSync(path_1.default.dirname(INDEX_FILE), { recursive: true });
        fs_1.default.writeFileSync(INDEX_FILE, JSON.stringify({ index: idx.toJSON(), store }), "utf8");
    }
    catch (e) {
        console.warn("could not persist index", e);
    }
}
function rebuildIndex() {
    // rebuild from store if persistent file exists
    if (fs_1.default.existsSync(INDEX_FILE)) {
        const raw = JSON.parse(fs_1.default.readFileSync(INDEX_FILE, "utf8"));
        idx = lunr_1.default.Index.load(raw.index);
        Object.assign(store, raw.store || {});
    }
    else {
        buildIndex();
    }
}
function searchIndex(q, filters) {
    if (!idx)
        rebuildIndex();
    if (!idx)
        return [];
    const results = idx.search(q);
    return results.map(r => ({ score: r.score, id: r.ref, doc: store[r.ref] }));
}
function getPage(docId, pageNo) {
    if (!idx)
        rebuildIndex();
    const key = `${docId}::${pageNo}`;
    return store[key] || null;
}
