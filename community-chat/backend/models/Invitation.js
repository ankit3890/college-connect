const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  community: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true, index: true },
  status: { type: String, required: true, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 1 day
});

// Compound index for efficient queries
InvitationSchema.index({ to: 1, status: 1, createdAt: -1 });
InvitationSchema.index({ community: 1, to: 1, status: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

module.exports = mongoose.model('Invitation', InvitationSchema);
