const mongoose = require("mongoose");

const CommunityChatSchema = new mongoose.Schema({
  community: { type: String, required: true },
  user: { type: String, required: true },
  text: { type: String, required: true },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("CommunityChat", CommunityChatSchema, "community_chats");
