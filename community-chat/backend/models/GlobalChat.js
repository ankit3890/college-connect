const mongoose = require('mongoose');

const GlobalChatSchema = new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GlobalChat', GlobalChatSchema);
