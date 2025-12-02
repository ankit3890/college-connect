import mongoose, { Schema, Document as MongoDocument } from "mongoose";

export interface IDocument extends MongoDocument {
    title: string;
    uploadedAt: Date;
    filename: string;
    metadata: any;
}

const DocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    filename: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
});

export const DocumentModel = mongoose.model<IDocument>("Document", DocumentSchema);
