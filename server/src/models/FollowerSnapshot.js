import mongoose from 'mongoose';

// Daily point-in-time snapshot of the connected IG account's followers_count
// (from the official Graph API — no follower list is available there, only
// the aggregate count). Comparing consecutive snapshots surfaces net
// follower loss without scraping.
const followerSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  instagramUserId: {
    type: String,
    required: true,
  },
  followersCount: {
    type: Number,
    required: true,
  },
  capturedAt: {
    type: Date,
    default: Date.now,
  },
});

// At most one snapshot per user per calendar day (UTC), so a snapshot job
// running more than once a day never creates noisy duplicate points.
followerSnapshotSchema.index({ userId: 1, capturedAt: 1 });

const FollowerSnapshot = mongoose.model('FollowerSnapshot', followerSnapshotSchema);
export default FollowerSnapshot;
