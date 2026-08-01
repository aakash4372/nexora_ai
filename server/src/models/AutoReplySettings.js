import mongoose from 'mongoose';

const ctaButtonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const autoReplySettingsSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
