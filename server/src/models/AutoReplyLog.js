import mongoose from 'mongoose';

// Tracks when a DM sender last received the auto-reply for a given user, so
// the welcome message fires at most once per 24h per sender — not on every
// message in the conversation.
const autoReplyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

autoReplyLogSchema.index({ userId: 1, senderId: 1 }, { unique: true });

const AutoReplyLog = mongoose.model('AutoReplyLog', autoReplyLogSchema);
export default AutoReplyLog;
