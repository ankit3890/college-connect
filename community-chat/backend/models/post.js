const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    title: String,
    content: String,
    community: String,
    author: String,
    image: String,
    upvotes: [String],
    downvotes: [String],
    isEdited: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
