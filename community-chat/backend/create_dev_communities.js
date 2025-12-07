const mongoose = require('mongoose');
require('dotenv').config();

const Community = require('./models/Community');

const MONGO = process.env.MONGO_URI;

async function createDevCommunities() {
  try {
    await mongoose.connect(MONGO);
    console.log("Connected to MongoDB");

    // Create r/Dev (read-only for users)
    const dev = await Community.findOneAndUpdate(
      { name: 'Dev' },
      {
        name: 'Dev',
        creator: 'system',
        description: 'Official developer announcements and platform updates. Read-only for users.',
        members: ['system'],
        icon: '',
        subadmins: []
      },
      { upsert: true, new: true }
    );
    console.log("✅ r/Dev created/updated:", dev.name);

    // Create r/Suggestions (auto-join, cannot leave)
    const suggestions = await Community.findOneAndUpdate(
      { name: 'Suggestions' },
      {
        name: 'Suggestions',
        creator: 'system',
        description: 'Share your suggestions and feedback for the platform. Everyone is welcome!',
        members: ['system'],
        icon: '',
        subadmins: []
      },
      { upsert: true, new: true }
    );
    console.log("✅ r/Suggestions created/updated:", suggestions.name);

    console.log("\n🎉 Developer communities setup complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

createDevCommunities();
