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
  instagramUserId: {
    type: String,
    required: true,
  },
  instagramBusinessId: {
    type: String,
  },
  username: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    default: 'BUSINESS',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  accessToken: {
    type: String,
    required: true,
    set: (val) => encrypt(val),
    get: (val) => decrypt(val),
  },
  tokenType: {
    type: String,
    default: 'Bearer',
  },
  tokenExpiry: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  connected: {
    type: Boolean,
    default: true,
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
  webhookSubscribed: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

instagramConnectionSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const InstagramConnection = mongoose.model('InstagramConnection', instagramConnectionSchema);
export default InstagramConnection;
