import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto.js';

const instagramConnectionSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  facebookUserId: {
    type: String,
    required: true,
  },
  facebookPageId: {
    type: String,
    required: true,
  },
  facebookPageName: {
    type: String,
    required: true,
  },
  instagramBusinessId: {
    type: String,
    required: true,
  },
  instagramUsername: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
  },
  accessToken: {
    type: String,
    required: true,
    // Automatically encrypt value when saving
    set: (val) => encrypt(val),
    // Automatically decrypt value when retrieving
    get: (val) => decrypt(val),
  },
  tokenType: {
    type: String,
    default: 'Bearer',
  },
  expiresAt: {
    type: Date,
  },
  connected: {
    type: Boolean,
    default: true,
  },
  webhookSubscribed: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
  // Enable getters so that decrypt is invoked automatically
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Ensure a single connection per workspace and user to prevent duplicates
instagramConnectionSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const InstagramConnection = mongoose.model('InstagramConnection', instagramConnectionSchema);
export default InstagramConnection;
