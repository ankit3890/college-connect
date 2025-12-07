const mongoose = require('mongoose');
require('dotenv').config();

const MONGO = process.env.MONGO_URI;

(async () => {
  try {
    await mongoose.connect(MONGO);
    console.log("Connected to DB");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Check if 'users' or 'profiles' exists
    const userCol = collections.find(c => c.name.toLowerCase().includes('user'));
    if (userCol) {
        console.log(`Found user collection: ${userCol.name}`);
        const users = await mongoose.connection.db.collection(userCol.name).find().limit(1).toArray();
        console.log("Sample user:", users);
    } else {
        console.log("No explicit user collection found.");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
