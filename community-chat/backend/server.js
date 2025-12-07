require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Models
const Community = require('./models/Community');
const Post = require('./models/post');
const Comment = require('./models/Comment');
const Profile = require('./models/Profile');
const GlobalChat = require('./models/GlobalChat');
const Notification = require('./models/Notification');
const Invitation = require('./models/Invitation');
const DirectMessage = require('./models/DirectMessage');
const PrivateRoom = require('./models/PrivateRoom');
const RoomMessage = require('./models/RoomMessage');
const User = require('./models/User');

// Helper: Create notification and prune > 15
async function createAndPruneNotification(data) {
  try {
    await Notification.create(data);
    const count = await Notification.countDocuments({ user: data.user });
    if(count > 15) {
       const docs = await Notification.find({ user: data.user })
         .sort({ createdAt: -1 })
         .skip(15)
         .select('_id');
       if(docs.length > 0) {
         await Notification.deleteMany({ _id: { $in: docs.map(d => d._id) } });
       }
    }
  } catch(e) {
    console.error("Notif prune error", e);
  }
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// FRONTEND STATIC FILES
app.use(express.static(path.join(__dirname, "../frontend")));

// UPLOADS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// DB CONNECT
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected (Atlas)");
  })
  .catch((err) => console.error("DB error:", err));

// HEALTH
app.get("/api/health", (req, res) => res.json({ ok: true }));

// LOGIN
app.post("/api/user/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);
    const { username } = req.body;
    if (!username) return res.json({ success: false, msg: "Enter username" });

    let user = await Profile.findOne({ username });
    console.log("Found user:", user);
    if (!user) {
      user = await Profile.create({ username });
      console.log("Created new user:", user);
      
      // Auto-join r/Suggestions
      try {
        const sugg = await Community.findOne({ name: 'Suggestions' });
        if(sugg) {
            if(!sugg.members.includes(username)) {
                sugg.members.push(username);
                await sugg.save();
            }
        }
      } catch(e) { console.error("Auto-join error", e); }
    }

    res.json({ success: true, user: username });
  } catch (err) {
    console.log("Login error:", err);
    res.json({ success: false, msg: err.message });
  }
});

// PROFILE
app.post("/api/user/profile", async (req, res) => {
  try {
    const { username } = req.body;
    const p = await Profile.findOne({ username });
    res.json({ success: true, data: p });
  } catch (err) {
    res.json({ success: false });
  }
});

app.post("/api/user/update", upload.single("avatar"), async (req, res) => {
  try {
    console.log("Update Profile Request:", req.body);
    console.log("Update Profile File:", req.file);
    
    const { username, about, hobbies } = req.body;
    if(!username) return res.json({ success: false, msg: "Missing username" });

    const update = { about, hobbies };
    if (req.file) update.avatar = "/uploads/" + req.file.filename;

    const result = await Profile.findOneAndUpdate({ username }, update, { new: true });
    console.log("Update Result:", result);
    
    if(!result) return res.json({ success: false, msg: "User not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.json({ success: false });
  }
});

app.post("/api/group/delete", async (req, res) => {
  try {
    const { name, username } = req.body;
    const group = await Community.findOne({ name });
    if (!group) return res.json({ success: false, msg: "Not found" });
    
    if (group.creator !== username) return res.json({ success: false, msg: "Unauthorized" });
    
    await Community.deleteOne({ name });
    // Optional: Delete posts in this community
    await Post.deleteMany({ community: name });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// GROUPS
app.get("/api/groups", async (req, res) => {
  try {
    const { username } = req.query;
    
    // Auto-join user to r/Suggestions if they have a username
    if (username) {
      const suggestions = await Community.findOne({ name: 'Suggestions' });
      if (suggestions && !suggestions.members.includes(username)) {
        suggestions.members.push(username);
        await suggestions.save();
      }
    }
    
    res.json(await Community.find({}).sort({ createdAt: -1 }));
  } catch (err) {
    console.error("Groups fetch error:", err);
    res.json([]);
  }
});

app.post("/api/group/create", async (req, res) => {
  try {
    const { name, creator } = req.body;
    if (!name) return res.json({ success: false, msg: "Community name is required" });

    // Case-insensitive duplicate check
    const existing = await Community.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.json({ success: false, msg: "A community with this name already exists" });
    }

    // Create community with creator as first member
    await Community.create({ name, creator, members: [creator], description: "" });
    res.json({ success: true });
  } catch (err) {
    console.error("Community create error:", err);
    res.json({ success: false, msg: "Failed to create community" });
  }
});

app.post("/api/community/join", async (req, res) => {
  try {
    console.log("Join request:", req.body);
    const { name, username } = req.body;
    const community = await Community.findOne({ name });
    console.log("Found community:", community);
    
    if (!community) return res.json({ success: false, msg: "Not found" });
    
    // Custom error message for Dev and Suggestions
    if (name === 'Dev' || name === 'Suggestions') {
        return res.json({ success: false, msg: "This community is only for application developers not for regular members" });
    }

    // Check if community is closed
    if (community.isClosed) {
      return res.json({ success: false, msg: "This community is closed." });
    }

    if (!community.members) community.members = [];
    if (community.members.includes(username)) {
      console.log("User already joined");
      return res.json({ success: false, msg: "Already joined" });
    }
    
    community.members.push(username);
    await community.save();
    console.log("User joined successfully, new members:", community.members);
    res.json({ success: true });
  } catch (err) {
    console.error("Join error:", err);
    res.json({ success: false, msg: err.message });
  }
});

app.post("/api/community/leave", async (req, res) => {
  try {
    const { name, username } = req.body;
    
    // Prevent leaving r/Suggestions
    if (name === 'Suggestions') {
      return res.json({ 
        success: false, 
        msg: "You cannot leave the Suggestions community" 
      });
    }
    
    const community = await Community.findOne({ name });
    if (!community) return res.json({ success: false, msg: "Not found" });
    
    if (!community.members) community.members = [];
    community.members = community.members.filter(m => m !== username);
    await community.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// Toggle Community Status (Close/Open)
app.post("/api/community/toggle-status", async (req, res) => {
  try {
    const { communityName, username } = req.body;
    const community = await Community.findOne({ name: communityName });
    
    if(!community) return res.json({ success: false, msg: "Community not found" });
    if(community.creator !== username) return res.json({ success: false, msg: "Not authorized" });
    
    community.isClosed = !community.isClosed;
    await community.save();
    
    res.json({ success: true, isClosed: community.isClosed });
  } catch (e) {
    console.error(e);
    res.json({ success: false, msg: "Server error" });
  }
});

app.post("/api/community/update", upload.single("icon"), async (req, res) => {
  try {
    const { name, username, description } = req.body;
    const community = await Community.findOne({ name });
    if (!community) return res.json({ success: false, msg: "Not found" });
    
    if (community.creator !== username) {
      return res.json({ success: false, msg: "Unauthorized" });
    }
    
    if (description) community.description = description;
    if (req.file) community.icon = "/uploads/" + req.file.filename;
    
    await community.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// VERIFIED COMMUNITY APIs
app.get("/api/community/search", async (req, res) => {
  try {
    const { q } = req.query;
    if(!q) return res.json([]);
    
    const communities = await Community.find({ 
      name: { $regex: q, $options: 'i' } 
    }).select('name icon isVerified members').limit(10);
    
    res.json(communities);
  } catch(e) {
    console.error(e);
    res.json([]);
  }
});

app.post("/api/community/verify", async (req, res) => {
  try {
    const { communityName, username } = req.body;
    
    // Check if user is in r/Dev
    const devCommunity = await Community.findOne({ name: 'Dev' });
    if (!devCommunity) return res.json({ success: false, msg: "r/Dev community not found" });
    
    if (!devCommunity.members.includes(username)) {
      return res.json({ success: false, msg: "Only r/Dev members can verify communities" });
    }
    
    const community = await Community.findOne({ name: communityName });
    if (!community) return res.json({ success: false, msg: "Community not found" });
    
    community.isVerified = !community.isVerified;
    await community.save();
    
    res.json({ success: true, isVerified: community.isVerified });
  } catch (e) {
     console.error(e);
     res.json({ success: false, msg: "Server error" });
  }
});

// ADMIN MODERATION APIs
// Promote to subadmin (admin only, max 2)
app.post("/api/community/promote", async (req, res) => {
  try {
    const { communityName, username, targetUser } = req.body;
    const community = await Community.findOne({ name: communityName });
    if (!community) return res.json({ success: false, msg: "Community not found" });
    
    // Only admin can promote
    if (community.creator !== username) {
      return res.json({ success: false, msg: "Only admin can promote" });
    }
    
    // Check max 2 subadmins
    if (community.subadmins.length >= 2) {
      return res.json({ success: false, msg: "Maximum 2 subadmins allowed" });
    }
    
    // Check if already subadmin
    if (community.subadmins.includes(targetUser)) {
      return res.json({ success: false, msg: "Already a subadmin" });
    }
    
    // Check if user is member
    if (!community.members.includes(targetUser)) {
      return res.json({ success: false, msg: "User must be a member" });
    }
    
    community.subadmins.push(targetUser);
    await community.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

// Demote subadmin (admin only)
app.post("/api/community/demote", async (req, res) => {
  try {
    const { communityName, username, targetUser } = req.body;
    const community = await Community.findOne({ name: communityName });
    if (!community) return res.json({ success: false, msg: "Community not found" });
    
    // Only admin can demote
    if (community.creator !== username) {
      return res.json({ success: false, msg: "Only admin can demote" });
    }
    
    community.subadmins = community.subadmins.filter(u => u !== targetUser);
    await community.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

// Kick member (admin or subadmin)
app.post("/api/community/kick", async (req, res) => {
  try {
    const { communityName, username, targetUser } = req.body;
    const community = await Community.findOne({ name: communityName });
    if (!community) return res.json({ success: false, msg: "Community not found" });
    
    // Check if user can moderate (admin or subadmin)
    const isAdmin = community.creator === username;
    const isSubadmin = community.subadmins && community.subadmins.includes(username);
    
    if (!isAdmin && !isSubadmin) {
      return res.json({ success: false, msg: "Unauthorized" });
    }
    
    // Remove from members
    community.members = community.members.filter(m => m !== targetUser);
    // Remove from subadmins if they were one
    community.subadmins = community.subadmins.filter(u => u !== targetUser);
    
    await community.save();
    
    // Create notification
    await createAndPruneNotification({
      user: targetUser,
      type: 'kick',
      message: `You were kicked from r/${communityName}`,
      community: communityName
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

// Ban user (admin or subadmin)
app.post("/api/community/ban", async (req, res) => {
  try {
    const { communityName, username, targetUser } = req.body;
    const community = await Community.findOne({ name: communityName });
    if (!community) return res.json({ success: false, msg: "Community not found" });
    
    // Check if user can moderate
    const isAdmin = community.creator === username;
    const isSubadmin = community.subadmins && community.subadmins.includes(username);
    
    if (!isAdmin && !isSubadmin) {
      return res.json({ success: false, msg: "Unauthorized" });
    }
    
    // Check if already banned
    if (community.bannedUsers && community.bannedUsers.some(b => b.username === targetUser)) {
      return res.json({ success: false, msg: "Already banned" });
    }
    
    // Remove from members and subadmins
    community.members = community.members.filter(m => m !== targetUser);
    community.subadmins = community.subadmins.filter(u => u !== targetUser);
    
    // Add to banned list
    if (!community.bannedUsers) community.bannedUsers = [];
    community.bannedUsers.push({
      username: targetUser,
      bannedBy: username,
      bannedAt: new Date()
    });
    
    await community.save();
    
    // Create notification
    await createAndPruneNotification({
      user: targetUser,
      type: 'ban',
      message: `You were banned from r/${communityName}`,
      community: communityName
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

// Unban user (admin only)
app.post("/api/community/unban", async (req, res) => {
  try {
    const { communityName, username, targetUser } = req.body;
    const community = await Community.findOne({ name: communityName });
    if (!community) return res.json({ success: false, msg: "Community not found" });
    
    // Only admin can unban
    if (community.creator !== username) {
      return res.json({ success: false, msg: "Only admin can unban" });
    }
    
    community.bannedUsers = community.bannedUsers.filter(b => b.username !== targetUser);
    await community.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

// POSTS
app.post("/api/post/create", upload.single("image"), async (req, res) => {
  try {
    const { title, content, community, author } = req.body;
    
    // Check if user is banned from community
    const comm = await Community.findOne({ name: community });
    if (comm && comm.bannedUsers && comm.bannedUsers.some(b => b.username === author)) {
      return res.json({ success: false, msg: "You are banned from this community" });
    }
    
    // r/Dev is read-only for regular users
    if (community === 'Dev') {
      const devCommunity = await Community.findOne({ name: 'Dev' });
      const isCreator = devCommunity.creator === author;
      const isSubadmin = devCommunity.subadmins && devCommunity.subadmins.includes(author);
      
      if (!isCreator && !isSubadmin) {
        return res.json({ 
          success: false, 
          msg: "Only admins can post in r/Dev" 
        });
      }
    }
    
    let image = null;

    if (req.file) image = "/uploads/" + req.file.filename;

    const newPost = await Post.create({ title, content, community, author, image });
    
    // Platform-wide notifications for r/Dev posts
    if (community === 'Dev') {
      try {
        // Get all users
        const allUsers = await Profile.find({}).distinct('username');
        
        // Create notification for each user (except author)
        const notifications = allUsers
          .filter(u => u !== author)
          .map(user => ({
            user,
            type: 'general',
            message: `New announcement in r/Dev: ${title}`,
            community: 'Dev'
          }));
        
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (notifErr) {
        console.error("Notification error:", notifErr);
        // Don't fail post creation if notifications fail
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "Server error" });
  }
});

app.post("/api/post/list", async (req, res) => {
  console.log("Post list request:", req.body);
  try {
    const { community, communities, sortBy } = req.body;
    let match = {};
  
    if (community) {
        match = { community };
    } else if (communities && Array.isArray(communities) && communities.length > 0) {
        match = { community: { $in: communities } };
    }
  
    // Pipeline
    const pipeline = [];
  
    // 1. Match
    if(Object.keys(match).length > 0){
        pipeline.push({ $match: match });
    }

    // 2. Add engagement
    pipeline.push({
        $addFields: {
            upvotes: { $ifNull: ["$upvotes", []] },
            downvotes: { $ifNull: ["$downvotes", []] }
        }
    });

    // 3. Lookup
    pipeline.push({
        $lookup: {
            from: "communities",
            localField: "community",
            foreignField: "name",
            as: "communityDetails"
        }
    });
  
    pipeline.push({
        $addFields: {
            communityIsClosed: { $arrayElemAt: ["$communityDetails.isClosed", 0] }
        }
    });
  
    pipeline.push({ $project: { communityDetails: 0 } });

    if (sortBy === 'hot') {
        pipeline.push({
        $addFields: {
            engagement: { $add: [{ $size: "$upvotes" }, { $size: "$downvotes" }] }
        }
        });
        pipeline.push({ $sort: { engagement: -1, createdAt: -1 } });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }
  
    console.log("Running aggregation...");
    let posts = await Post.aggregate(pipeline);
    console.log("Aggregation done, count:", posts.length);
    
    // Fallback if empty and looking for feed
    if (posts.length === 0 && (!community && (!communities || communities.length > 0))) {
        console.log("Fallback to global hot posts");
        const fallbackPipeline = [
        {
            $addFields: {
                upvotes: { $ifNull: ["$upvotes", []] },
                downvotes: { $ifNull: ["$downvotes", []] }
            }
        },
        {
            $addFields: {
                engagement: { $add: [{ $size: "$upvotes" }, { $size: "$downvotes" }] }
            }
        },
        { $sort: { engagement: -1, createdAt: -1 } },
        { $limit: 20 }
        ];
        posts = await Post.aggregate(fallbackPipeline);
    }
  
    res.json(posts);
  } catch (err) {
    console.error("Post list error:", err);
    res.json([]);
  }
});

app.post("/api/post/delete", async (req, res) => {
  const { postId, username } = req.body;

  const p = await Post.findById(postId);
  if (!p) return res.json({ success: false });

  if (p.author !== username) return res.json({ success: false });

  await Post.findByIdAndDelete(postId);
  await Comment.deleteMany({ postId });

  res.json({ success: true });
});

app.post("/api/post/edit", async (req, res) => {
  try {
    const { postId, username, title, content } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, msg: "Post not found" });

    if (post.author !== username) return res.json({ success: false, msg: "Unauthorized" });

    post.title = title;
    post.content = content;
    post.isEdited = true;
    await post.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});


app.post("/api/post/vote", async (req, res) => {
  try {
    const { postId, username, type } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, msg: "Post not found" });
    
    // Check if user is banned
    const comm = await Community.findOne({ name: post.community });
    if (comm && comm.bannedUsers && comm.bannedUsers.some(b => b.username === username)) {
      return res.json({ success: false, msg: "You are banned from this community" });
    }

    // Ensure arrays exist
    if (!post.upvotes) post.upvotes = [];
    if (!post.downvotes) post.downvotes = [];

    const upIdx = post.upvotes.indexOf(username);
    const downIdx = post.downvotes.indexOf(username);

    if (type === "up") {
      if (upIdx > -1) {
        post.upvotes.splice(upIdx, 1); // Toggle off
      } else {
        if (downIdx > -1) post.downvotes.splice(downIdx, 1); // Remove downvote
        post.upvotes.push(username); // Add upvote
      }
    } else if (type === "down") {
      if (downIdx > -1) {
        post.downvotes.splice(downIdx, 1); // Toggle off
      } else {
        if (upIdx > -1) post.upvotes.splice(upIdx, 1); // Remove upvote
        post.downvotes.push(username); // Add downvote
      }
    }

    await post.save();
    res.json({ success: true, upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

// COMMENTS
app.post("/api/comments", async (req, res) => {
  res.json(
    await Comment.find({ postId: req.body.postId }).sort({ createdAt: 1 })
  );
});

app.post("/api/comment/add", async (req, res) => {
  try {
    const { postId, user, text, parentId } = req.body;
    
    // Get post to find community
    const post = await Post.findById(postId);
    if (post) {
      const comm = await Community.findOne({ name: post.community });
      if (comm && comm.bannedUsers && comm.bannedUsers.some(b => b.username === user)) {
        return res.json({ success: false, msg: "You are banned from this community" });
      }
    }
    
    await Comment.create({ postId, user, text, parentId: parentId || null });
    res.json({ success: true });
  } catch(e) {
    res.json({ success: false, msg: "Error" });
  }
});

app.post("/api/comment/edit", async (req, res) => {
  try {
    const { commentId, user, text } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.json({ success: false, msg: "Comment not found" });
    if (comment.user !== user) return res.json({ success: false, msg: "Unauthorized" });

    comment.text = text;
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

app.post("/api/comment/delete", async (req, res) => {
  try {
    const { commentId, user } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.json({ success: false, msg: "Comment not found" });
    if (comment.user !== user) return res.json({ success: false, msg: "Unauthorized" });

    await Comment.findByIdAndDelete(commentId);
    // Optional: Delete replies recursively? For now, let's keep it simple or delete direct replies.
    // A better approach for a real app is soft delete or recursive delete.
    // Let's just delete the comment. Replies will become orphaned (or we can handle in frontend).
    await Comment.deleteMany({ parentId: commentId }); // Delete direct replies

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

app.post("/api/comment/vote", async (req, res) => {
  try {
    const { commentId, username, type } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.json({ success: false, msg: "Comment not found" });

    if (!comment.upvotes) comment.upvotes = [];
    if (!comment.downvotes) comment.downvotes = [];

    const upIdx = comment.upvotes.indexOf(username);
    const downIdx = comment.downvotes.indexOf(username);

    if (type === "up") {
      if (upIdx > -1) {
        comment.upvotes.splice(upIdx, 1); // Remove
      } else {
        if (downIdx > -1) comment.downvotes.splice(downIdx, 1);
        comment.upvotes.push(username);
      }
    } else if (type === "down") {
      if (downIdx > -1) {
        comment.downvotes.splice(downIdx, 1); // Remove
      } else {
        if (upIdx > -1) comment.upvotes.splice(upIdx, 1);
        comment.downvotes.push(username);
      }
    }

    await comment.save();
    res.json({ success: true, upvotes: comment.upvotes, downvotes: comment.downvotes });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: "Server error" });
  }
});

// --- Community Chat ---
const CommunityChat = require('./models/CommunityChat');

app.get("/api/chat/community/:name", async (req, res) => {
  try {
    const { name } = req.params;
    // Fetch last 50 messages
    const msgs = await CommunityChat.find({ community: name })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(msgs.reverse());
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

app.post("/api/chat/community", upload.single("image"), async (req, res) => {
  try {
    console.log("Community Chat Post:", req.body);
    const { community, user, text } = req.body;
    
    if (!community || !user || !text) {
        console.log("Missing fields in community chat post");
        return res.json({ success: false, msg: "Missing fields" });
    }

    const chatData = { community, user, text };
    if(req.file) chatData.image = "/uploads/" + req.file.filename;

    await CommunityChat.create(chatData);
    console.log("Community chat message saved for:", community);
    res.json({ success: true });
  } catch (err) {
    console.error("Community Chat Error:", err);
    res.json({ success: false });
  }
});

// LAST ROUTE → SERVE FRONTEND
// --- Global Chat ---
app.get("/api/chat/global", async (req, res) => {
  try{
    const msgs = await GlobalChat.find().sort({createdAt: -1}).limit(50);
    res.json(msgs.reverse());
  }catch(e){ res.json([]); }
});

app.post("/api/chat/global", upload.single("image"), async (req, res) => {
  try{
    const { user, text } = req.body;
    if(!user || !text) return res.json({ success: false });
    
    const chatData = { user, text };
    if(req.file) chatData.image = "/uploads/" + req.file.filename;
    
    const msg = new GlobalChat(chatData);
    await msg.save();
    res.json({ success: true });
  }catch(e){ res.json({ success: false }); }
});

// --- NOTIFICATIONS & INVITATIONS ---

// Get user's notifications
app.get("/api/notifications", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ success: false, msg: "Missing username" });
    
    const notifications = await Notification.find({ 
      user: username,
      expiresAt: { $gt: new Date() } // Only non-expired
    })
      .sort({ createdAt: -1 })
      .limit(15);
    
    res.json({ success: true, notifications });
  } catch (e) {
    console.error("Notifications error:", e);
    res.json({ success: false });
  }
});

// Mark notification as read
app.post("/api/notification/read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// Delete notification
app.post("/api/notification/delete/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// Clear all read notifications
app.post("/api/notifications/clear", async (req, res) => {
  try {
    const { username } = req.body;
    console.log(`[DEBUG] Clearing read notifications for user: ${username}`);
    const result = await Notification.deleteMany({ user: username, read: true });
    console.log(`[DEBUG] Deleted count: ${result.deletedCount}`);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (e) {
    console.error("[DEBUG] Clear notifications error:", e);
    res.json({ success: false });
  }
});

// Get user's invitations
app.get("/api/invitations", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ success: false });
    
    const invitations = await Invitation.find({
      to: username,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, invitations });
  } catch (e) {
    console.error("Invitations error:", e);
    res.json({ success: false });
  }
});

// Send invitation
app.post("/api/invitation/send", async (req, res) => {
  try {
    const { community, from, to } = req.body;
    
    // Verify sender is admin or subadmin
    const comm = await Community.findOne({ name: community });
    if (!comm) return res.json({ success: false, msg: "Community not found" });
    
    const isAdmin = comm.creator === from;
    const isSubadmin = comm.subadmins && comm.subadmins.includes(from);
    
    if (!isAdmin && !isSubadmin) {
      return res.json({ success: false, msg: "Only admins and subadmins can invite" });
    }
    
    // Check if user is already a member
    if (comm.members && comm.members.includes(to)) {
      return res.json({ success: false, msg: "User is already a member" });
    }
    
    // Check for existing pending invitation
    const existing = await Invitation.findOne({
      community,
      to,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existing) {
      return res.json({ success: false, msg: "Invitation already sent" });
    }
    
    // Create invitation
    const invitation = await Invitation.create({ community, from, to });
    
    // Create notification
    await createAndPruneNotification({
      user: to,
      type: 'invitation',
      message: `${from} invited you to join r/${community}`,
      community,
      invitationId: invitation._id.toString()
    });
    
    res.json({ success: true });
  } catch (e) {
    console.error("Send invitation error:", e);
    res.json({ success: false, msg: "Server error" });
  }
});

// Accept invitation
app.post("/api/invitation/accept/:id", async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.json({ success: false, msg: "Invitation not found" });
    
    // Check expiration
    if (new Date() > invitation.expiresAt) {
      return res.json({ success: false, msg: "Invitation expired" });
    }
    
    // Add user to community
    const community = await Community.findOne({ name: invitation.community });
    if (!community) return res.json({ success: false, msg: "Community not found" });
    
    if (!community.members) community.members = [];
    if (!community.members.includes(invitation.to)) {
      community.members.push(invitation.to);
      await community.save();
    }
    
    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();
    
    // Notify inviter
    await createAndPruneNotification({
      user: invitation.from,
      type: 'invitation_accepted',
      message: `${invitation.to} accepted your invitation to r/${invitation.community}`,
      community: invitation.community
    });
    
    res.json({ success: true });
  } catch (e) {
    console.error("Accept invitation error:", e);
    res.json({ success: false });
  }
});

// Reject invitation
app.post("/api/invitation/reject/:id", async (req, res) => {
  try {
    const invitation = await Invitation.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    
    if (!invitation) return res.json({ success: false });
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// Search users
app.get("/api/users/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });
    
    const users = await Profile.find({
      username: { $regex: q, $options: 'i' }
    })
      .limit(20)
      .select('username avatar');
    
    res.json({ success: true, users });
  } catch (e) {
    console.error("Search error:", e);
    res.json({ success: false });
  }
});

// Get random users (not in specified community)
app.get("/api/users/random", async (req, res) => {
  try {
    const { community, limit = 15, username } = req.query;
    
    let excludeUsers = [];
    
    // Always exclude the current user
    if (username) {
      excludeUsers.push(username);
      
      // Find communities created by this user
      const createdCommunities = await Community.find({ creator: username });
      
      // Add all members from their created communities to exclude list
      createdCommunities.forEach(comm => {
        if (comm.members && Array.isArray(comm.members)) {
          excludeUsers = excludeUsers.concat(comm.members);
        }
      });
    }
    
    // If a specific community is provided, also exclude its members
    if (community) {
      const comm = await Community.findOne({ name: community });
      if (comm && comm.members) {
        excludeUsers = excludeUsers.concat(comm.members);
      }
    }
    
    // Remove duplicates
    excludeUsers = [...new Set(excludeUsers)];
    
    const users = await Profile.aggregate([
      { $match: { username: { $nin: excludeUsers } } },
      { $sample: { size: parseInt(limit) } },
      { $project: { username: 1, avatar: 1 } }
    ]);
    
    res.json({ success: true, users });
  } catch (e) {
    console.error("Random users error:", e);
    res.json({ success: false });
  }
});

// --- COMMENTS ---
app.post("/api/comments", async (req, res) => {
  try {
    const { postId } = req.body;
    const comments = await Comment.find({ postId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

app.post("/api/comment/add", async (req, res) => {
  try {
    const { postId, user, text, parentId } = req.body;
    const comment = await Comment.create({ postId, user, text, parentId });
    res.json({ success: true, comment }); 
  } catch (e) {
    console.error(e);
    res.json({ success: false, msg: "Failed" });
  }
});

app.post("/api/comment/edit", async (req, res) => {
  try {
    const { commentId, user, text } = req.body;
    const c = await Comment.findById(commentId);
    if (!c) return res.json({ success: false, msg: "Not found" });
    if (c.user !== user) return res.json({ success: false, msg: "Unauthorized" });

    c.text = text;
    await c.save();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ success: false });
  }
});

app.post("/api/comment/delete", async (req, res) => {
  try {
    const { commentId, user } = req.body;
    const c = await Comment.findById(commentId);
    if (!c) return res.json({ success: false, msg: "Not found" });
    
    if (c.user !== user) {
         const p = await Post.findById(c.postId);
         if (!p || p.author !== user) return res.json({ success: false, msg: "Unauthorized" });
    }

    await Comment.deleteOne({ _id: commentId });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ success: false });
  }
});

// =====================================================
// ADMIN MESSAGING SYSTEM APIs
// =====================================================

// Get all verified community admins
app.get("/api/verified-admins", async (req, res) => {
  try {
    const { username } = req.query;
    
    // Get all verified communities
    const verifiedCommunities = await Community.find({ isVerified: true });
    
    // If no verified communities, return empty
    if (verifiedCommunities.length === 0) {
      return res.json([]);
    }
    
    // Collect unique admins (creators) from verified communities
    const adminUsernames = [...new Set(verifiedCommunities.map(c => c.creator))];
    
    // Get profiles for these admins (may be empty for some)
    const profiles = await Profile.find({ username: { $in: adminUsernames } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.username] = p; });
    
    // Get r/Dev members
    const devCommunity = await Community.findOne({ name: 'Dev' });
    const devMembers = devCommunity ? devCommunity.members : [];
    
    // Build result for each admin (even if no profile)
    const result = adminUsernames.map(adminUsername => {
      const profile = profileMap[adminUsername];
      const adminCommunities = verifiedCommunities
        .filter(c => c.creator === adminUsername)
        .map(c => c.name);
      
      return {
        username: adminUsername,
        avatar: profile?.avatar || null,
        about: profile?.about || '',
        communities: adminCommunities,
        isDevMember: devMembers.includes(adminUsername)
      };
    });
    
    res.json(result);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

// --- Direct Message APIs ---

// Get all conversations for a user
app.get("/api/dm/conversations", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]);
    
    // Find all DMs involving this user
    const messages = await DirectMessage.find({
      $or: [{ from: username }, { to: username }]
    }).sort({ createdAt: -1 });
    
    // Group by conversation partner
    const conversationsMap = {};
    messages.forEach(msg => {
      const partner = msg.from === username ? msg.to : msg.from;
      if (!conversationsMap[partner]) {
        conversationsMap[partner] = {
          partner,
          lastMessage: msg.text || '[Image]',
          lastTime: msg.createdAt,
          unread: msg.to === username && !msg.read ? 1 : 0
        };
      } else if (msg.to === username && !msg.read) {
        conversationsMap[partner].unread++;
      }
    });
    
    res.json(Object.values(conversationsMap));
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

// Get messages with a specific user
app.get("/api/dm/:partner", async (req, res) => {
  try {
    const { partner } = req.params;
    const { username } = req.query;
    
    const messages = await DirectMessage.find({
      $or: [
        { from: username, to: partner },
        { from: partner, to: username }
      ]
    }).sort({ createdAt: 1 }).limit(100);
    
    // Mark messages as read
    await DirectMessage.updateMany(
      { from: partner, to: username, read: false },
      { $set: { read: true } }
    );
    
    res.json(messages);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

// Send a direct message
app.post("/api/dm/send", upload.single("image"), async (req, res) => {
  try {
    const { from, to, text } = req.body;
    
    const msgData = { from, to, text };
    if (req.file) {
      msgData.image = "/uploads/" + req.file.filename;
    }
    
    await DirectMessage.create(msgData);
    
    // Create notification
    await createAndPruneNotification({
      user: to,
      type: 'dm',
      message: `New message from ${from}`,
      community: null
    });
    
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ success: false, msg: "Error sending message" });
  }
});

// --- Private Room APIs ---

// Create a private room (r/Dev only)
app.post("/api/room/create", async (req, res) => {
  try {
    const { name, username } = req.body;
    
    // Check if user is r/Dev member
    const devCommunity = await Community.findOne({ name: 'Dev' });
    if (!devCommunity || !devCommunity.members.includes(username)) {
      return res.json({ success: false, msg: "Only r/Dev members can create rooms" });
    }
    
    const room = await PrivateRoom.create({
      name,
      creator: username,
      members: [username]
    });
    
    res.json({ success: true, room });
  } catch (e) {
    console.error(e);
    res.json({ success: false, msg: "Error creating room" });
  }
});

// Get rooms user is in
app.get("/api/room/list", async (req, res) => {
  try {
    const { username } = req.query;
    const rooms = await PrivateRoom.find({ members: username });
    res.json(rooms);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

// Validate username exists in database
app.get("/api/user/validate/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    res.json({ exists: !!user, username });
  } catch (e) {
    console.error(e);
    res.json({ exists: false, username: req.params.username });
  }
});

// Invite admin to room
app.post("/api/room/invite", async (req, res) => {
  try {
    const { roomId, username, invitee } = req.body;
    
    const room = await PrivateRoom.findById(roomId);
    if (!room) return res.json({ success: false, msg: "Room not found" });
    
    // Check if inviter is in room
    if (!room.members.includes(username)) {
      return res.json({ success: false, msg: "You are not in this room" });
    }
    
    // Check if invitee already in room
    if (room.members.includes(invitee)) {
      return res.json({ success: false, msg: "User already in room" });
    }
    
    // Validate invitee exists in users collection
    const userExists = await User.findOne({ username: invitee });
    if (!userExists) {
      return res.json({ success: false, msg: "Invalid username - user not found", invalidUser: true });
    }
    
    room.members.push(invitee);
    await room.save();
    
    // Notify invitee
    await createAndPruneNotification({
      user: invitee,
      type: 'room_invite',
      message: `You were invited to room "${room.name}" by ${username}`,
      community: null
    });
    
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ success: false, msg: "Error inviting user" });
  }
});

// Leave room
app.post("/api/room/leave", async (req, res) => {
  try {
    const { roomId, username } = req.body;
    
    const room = await PrivateRoom.findById(roomId);
    if (!room) return res.json({ success: false, msg: "Room not found" });
    
    room.members = room.members.filter(m => m !== username);
    
    // If no members left, delete room
    if (room.members.length === 0) {
      await PrivateRoom.findByIdAndDelete(roomId);
      await RoomMessage.deleteMany({ roomId });
    } else {
      await room.save();
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ success: false, msg: "Error leaving room" });
  }
});

// Get room messages
app.get("/api/room/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.query;
    
    const room = await PrivateRoom.findById(id);
    if (!room || !room.members.includes(username)) {
      return res.json([]);
    }
    
    const messages = await RoomMessage.find({ roomId: id })
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

// Send message to room
app.post("/api/room/:id/send", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, text } = req.body;
    
    const room = await PrivateRoom.findById(id);
    if (!room || !room.members.includes(username)) {
      return res.json({ success: false, msg: "Not authorized" });
    }
    
    const msgData = { roomId: id, sender: username, text };
    if (req.file) {
      msgData.image = "/uploads/" + req.file.filename;
    }
    
    await RoomMessage.create(msgData);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ success: false, msg: "Error sending message" });
  }
});

// Get room details
app.get("/api/room/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const room = await PrivateRoom.findById(id);
    res.json(room || {});
  } catch (e) {
    console.error(e);
    res.json({});
  }
});

// LAST ROUTE → SERVE FRONTEND
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log("🔥 Server running → http://localhost:" + PORT)
);
