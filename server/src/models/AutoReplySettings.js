import mongoose from 'mongoose';

const ctaButtonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const templateSchema = new mongoose.Schema({
  text: { type: String, required: true },
  ctaButtons: { type: [ctaButtonSchema], default: [] },
  // Exactly one template should be active at a time — that's the one sent
  // to new DMs. Enforced in the controller on save.
  active: { type: Boolean, default: false },
}, { _id: true });

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
  delaySeconds: {
    type: Number,
    default: 0,
  },
  templates: {
    type: [templateSchema],
    default: () => ([{
      text: 'Hello! 👋 Thanks for messaging us.\nHow can we help you today?',
      ctaButtons: [],
      active: true,
    }]),
  },
}, {
  timestamps: true,
});

const AutoReplySettings = mongoose.model('AutoReplySettings', autoReplySettingsSchema);
export default AutoReplySettings;
