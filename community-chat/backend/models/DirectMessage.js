const mongoose = require("mongoose");

const DirectMessageSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    text: String,
    image: String,
    read: { type: Boolean, default: false }
}, { timestamps: true });

// Index for efficient queries
DirectMessageSchema.index({ from: 1, to: 1, createdAt: -1 });

module.exports = mongoose.model("DirectMessage", DirectMessageSchema);
