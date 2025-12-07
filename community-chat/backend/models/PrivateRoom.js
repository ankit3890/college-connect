const mongoose = require("mongoose");

const PrivateRoomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creator: { type: String, required: true },  // Must be r/Dev member
    members: [String],                          // Invited admins
    icon: String
}, { timestamps: true });

module.exports = mongoose.model("PrivateRoom", PrivateRoomSchema);
