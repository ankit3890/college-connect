import mongoose, { Schema, Document as MongoDocument } from "mongoose";

export interface IPage extends MongoDocument {
    docId: mongoose.Types.ObjectId;
    pageNumber: number;
    text: string;
    subject?: string;
    code?: string;
    topics?: string[];
}

const PageSchema: Schema = new Schema({
    docId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    pageNumber: { type: Number, required: true },
    text: { type: String, required: true },
    subject: { type: String },
    code: { type: String },
    topics: { type: [String], default: [] }
});

// Create text index for search
PageSchema.index({ text: "text", subject: "text", code: "text", topics: "text" });

export const PageModel = (mongoose.models.Page as mongoose.Model<IPage>) || mongoose.model<IPage>("Page", PageSchema);
