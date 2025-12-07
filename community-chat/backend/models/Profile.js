const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  about: String,
  hobbies: String,
  avatar: String
}, { timestamps: true });

module.exports = mongoose.model("Profile", ProfileSchema, "users");
