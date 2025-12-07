const mongoose = require("mongoose");

const RoomMessageSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'PrivateRoom', required: true },
    sender: { type: String, required: true },
    text: String,
    image: String
}, { timestamps: true });

// Index for efficient queries
RoomMessageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model("RoomMessage", RoomMessageSchema);
