// Quick fix script - run this once to fix existing communities
const mongoose = require('mongoose');
require('dotenv').config();

async function fixCommunities() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Community = require('./models/Community.js');
    
    // Get all communities
    const communities = await Community.find({});
    console.log(`Found ${communities.length} communities`);

    for (const comm of communities) {
      let updated = false;
      
      // Add members array if missing
      if (!comm.members || comm.members.length === 0) {
        comm.members = [comm.creator];
        updated = true;
      }
      
      // Add description if missing
      if (!comm.description) {
        comm.description = "";
        updated = true;
      }
      
      if (updated) {
        await comm.save();
        console.log(`✓ Fixed ${comm.name} - added creator ${comm.creator} as member`);
      }
    }

    console.log('\n✅ All communities fixed!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixCommunities();
