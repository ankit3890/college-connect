const mongoose = require("mongoose");

const CommunitySchema = new mongoose.Schema({
    name: String,
    creator: String,
    icon: String,
    description: String,
    members: [String],
    subadmins: { type: [String], default: [] },
    bannedUsers: [{
        username: String,
        bannedAt: { type: Date, default: Date.now },
        bannedBy: String
    }],
    isClosed: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Community", CommunitySchema);
