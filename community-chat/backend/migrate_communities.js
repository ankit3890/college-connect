const mongoose = require('mongoose');
require('dotenv').config();

const Community = require('./models/Community.js');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all communities to have members array if they don't
    const result = await Community.updateMany(
      { members: { $exists: false } },
      { $set: { members: [] } }
    );
    
    console.log(`Updated ${result.modifiedCount} communities`);

    // Add creator to members if not already there
    const communities = await Community.find({});
    for (const comm of communities) {
      if (!comm.members) comm.members = [];
      if (comm.creator && !comm.members.includes(comm.creator)) {
        comm.members.push(comm.creator);
        await comm.save();
        console.log(`Added creator ${comm.creator} to ${comm.name} members`);
      }
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
