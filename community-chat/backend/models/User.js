const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    email: String,
    profilePhoto: String
}, { collection: "users" });

module.exports = mongoose.model("User", UserSchema);
