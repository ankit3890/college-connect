
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    postId: String,
    user: String,
    text: String,
    parentId: String,
    upvotes: [String],
    downvotes: [String]
}, { timestamps: true });

module.exports = mongoose.model("Comment", CommentSchema);
