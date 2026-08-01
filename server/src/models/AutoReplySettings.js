import mongoose from 'mongoose';

const ctaButtonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const autoReplySettingsSchema = new mongoose.Schema({
  // Keyed by the authenticated user's stable Mongo ID rather than the
  // free-text/renameable workspace display name, so settings never get
  // orphaned by a workspace rename or account-switch on the client.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  messages: {
    type: [String],
    default: ['Hello! 👋 Thanks for messaging us. How can we help you today?'],
  },
  delaySeconds: {
    type: Number,
    default: 0,
  },
  ctaButtons: {
    type: [ctaButtonSchema],
    default: [],
  },
}, {
  timestamps: true,
});

const AutoReplySettings = mongoose.model('AutoReplySettings', autoReplySettingsSchema);
export default AutoReplySettings;
