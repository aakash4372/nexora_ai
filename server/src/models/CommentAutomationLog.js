import mongoose from 'mongoose';

// Dedupe guard so a retried webhook delivery for the same comment (Meta
// retries on slow/failed responses) never triggers the reply/DM flow twice.
const commentAutomationLogSchema = new mongoose.Schema({
  automationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommentAutomation',
    required: true,
  },
  commentId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

commentAutomationLogSchema.index({ automationId: 1, commentId: 1 }, { unique: true });

const CommentAutomationLog = mongoose.model('CommentAutomationLog', commentAutomationLogSchema);
export default CommentAutomationLog;
