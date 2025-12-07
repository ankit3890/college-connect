const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['kick', 'ban', 'invitation', 'invitation_accepted', 'general'] },
  message: { type: String, required: true },
  community: { type: String },
  invitationId: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // 7 days
});

// Index for efficient queries
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

module.exports = mongoose.model('Notification', NotificationSchema);
