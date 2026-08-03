import mongoose from 'mongoose';

const ctaButtonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const commentAutomationSchema = new mongoose.Schema({
  // Keyed by the authenticated user's stable Mongo ID (see AutoReplySettings
  // for the rationale) — non-unique here since a user can have many
  // comment-automations, one per post/keyword combination.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    default: 'Untitled Automation',
  },

  // Which posts/reels this automation watches. 'ALL' means every post.
  postIds: {
    type: [String],
    default: ['ALL'],
  },
  posts: {
    // Lightweight snapshot of the selected media for display in the list
    // view without re-fetching from Instagram every time.
    type: [{
      id: String,
      caption: String,
      mediaUrl: String,
      mediaType: String,
      permalink: String,
      _id: false,
    }],
    default: [],
  },

  // Comment condition
  commentMatchType: {
    type: String,
    enum: ['ANY', 'KEYWORDS'],
    default: 'ANY',
  },
  keywords: {
    type: [String],
    default: [],
  },

  // Public reply left on the comment itself
  commentReply: {
    type: String,
    required: true,
  },

  // Opening DM (sent as a private reply to the comment)
  openingMessage: {
    type: String,
    required: true,
  },
  openingButtonName: {
    type: String,
    default: 'Send me the link',
  },

  // Optional non-blocking "please follow us" reminder — since Instagram
  // gives no API to verify a follow, this only nudges the user with a
  // message + a link button to the profile. It never gates or continues
  // the flow itself.
  sendFollowReminder: {
    type: Boolean,
    default: false,
  },
  followReminderMessage: {
    type: String,
    default: "We'd love to have you follow us! 🙌",
  },
  followReminderButtonName: {
    type: String,
    default: 'Follow Now',
  },

  // Final DM once the user has clicked through
  finalMessage: {
    type: String,
    required: true,
  },
  finalCtaButtons: {
    type: [ctaButtonSchema],
    default: [],
  },

  status: {
    type: String,
    enum: ['Live', 'Paused'],
    default: 'Live',
  },
  runs: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

commentAutomationSchema.index({ userId: 1, status: 1 });

const CommentAutomation = mongoose.model('CommentAutomation', commentAutomationSchema);
export default CommentAutomation;
