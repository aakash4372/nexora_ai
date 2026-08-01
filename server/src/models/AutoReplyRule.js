import mongoose from 'mongoose';

const autoReplyRuleSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  postId: {
    type: String,
    required: true,
  },
  postCaption: {
    type: String,
    default: '',
  },
  postMediaUrl: {
    type: String,
    default: '',
  },
  mediaType: {
    type: String,
    default: 'IMAGE', // IMAGE, VIDEO, CAROUSEL_ALBUM, REEL
  },
  permalink: {
    type: String,
    default: '',
  },
  triggerKeyword: {
    type: String,
    default: '*', // '*' means any comment, or specific keywords like 'PRICE,LINK'
  },
  autoDmMessage: {
    type: String,
    required: true,
  },
  publicCommentReply: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Live', 'Paused'],
    default: 'Live',
  },
  runs: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

autoReplyRuleSchema.index({ workspaceId: 1, postId: 1 });

const AutoReplyRule = mongoose.model('AutoReplyRule', autoReplyRuleSchema);
export default AutoReplyRule;
