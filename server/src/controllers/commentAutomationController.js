import CommentAutomation from '../models/CommentAutomation.js';

const isValidUrl = (url) => {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const VALID_MEDIA_TYPES = ['NONE', 'IMAGE', 'VIDEO', 'FILE', 'YOUTUBE'];

function validatePayload(body) {
  const { commentMatchType, keywords, commentReply, openingMessage, finalMessage, finalCtaButtons, finalMediaType, finalMediaUrl } = body;

  if (!commentReply?.trim()) return 'A public comment reply message is required.';
  if (!openingMessage?.trim()) return 'An opening DM message is required.';
  if (!finalMessage?.trim()) return 'A final DM message is required.';

  if (commentMatchType === 'KEYWORDS' && (!Array.isArray(keywords) || keywords.filter((k) => k?.trim()).length === 0)) {
    return 'At least one keyword is required when matching specific words.';
  }

  for (const b of finalCtaButtons || []) {
    if (b?.name && b?.url && !isValidUrl(b.url)) {
      return `CTA button "${b.name}" has an invalid URL. It must start with http:// or https://`;
    }
  }

  if (finalMediaType && finalMediaType !== 'NONE') {
    if (!VALID_MEDIA_TYPES.includes(finalMediaType)) return 'Invalid media type for the final DM.';
    if (!finalMediaUrl?.trim() || !isValidUrl(finalMediaUrl)) {
      return 'Add a valid media URL (http:// or https://), or turn media off.';
    }
  }

  return null;
}

function cleanPayload(body, userId) {
  return {
    userId,
    name: body.name?.trim() || 'Untitled Automation',
    postIds: Array.isArray(body.postIds) && body.postIds.length ? body.postIds : ['ALL'],
    posts: Array.isArray(body.posts) ? body.posts : [],
    commentMatchType: body.commentMatchType === 'KEYWORDS' ? 'KEYWORDS' : 'ANY',
    keywords: Array.isArray(body.keywords) ? body.keywords.map((k) => k.trim()).filter(Boolean) : [],
    commentReply: body.commentReply.trim(),
    openingMessage: body.openingMessage.trim(),
    openingButtonName: body.openingButtonName?.trim() || 'Send me the link',
    requireFollow: !!body.requireFollow,
    finalMessage: body.finalMessage.trim(),
    finalCtaButtons: Array.isArray(body.finalCtaButtons)
      ? body.finalCtaButtons.filter((b) => b?.name && b?.url).map((b) => ({ name: b.name.trim(), url: b.url.trim() })).slice(0, 3)
      : [],
    finalMediaType: VALID_MEDIA_TYPES.includes(body.finalMediaType) ? body.finalMediaType : 'NONE',
    finalMediaUrl: body.finalMediaType && body.finalMediaType !== 'NONE' ? (body.finalMediaUrl?.trim() || '') : '',
  };
}

export const commentAutomationController = {
  /**
   * GET /api/instagram/comment-automations
   */
  async list(req, res) {
    try {
      const automations = await CommentAutomation.find({ userId: req.userId }).sort({ createdAt: -1 });
      res.json({ success: true, data: automations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch comment automations.', error: error.message });
    }
  },

  /**
   * POST /api/instagram/comment-automations
   */
  async create(req, res) {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
      const automation = await CommentAutomation.create(cleanPayload(req.body, req.userId));
      res.status(201).json({ success: true, data: automation, message: 'Comment automation created successfully!' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create comment automation.', error: err.message });
    }
  },

  /**
   * PUT /api/instagram/comment-automations/:id
   */
  async update(req, res) {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
      const automation = await CommentAutomation.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        cleanPayload(req.body, req.userId),
        { new: true }
      );
      if (!automation) return res.status(404).json({ success: false, message: 'Automation not found.' });
      res.json({ success: true, data: automation, message: 'Comment automation updated successfully!' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update comment automation.', error: err.message });
    }
  },

  /**
   * PATCH /api/instagram/comment-automations/:id
   * Toggles Live/Paused status.
   */
  async toggleStatus(req, res) {
    try {
      const automation = await CommentAutomation.findOne({ _id: req.params.id, userId: req.userId });
      if (!automation) return res.status(404).json({ success: false, message: 'Automation not found.' });

      automation.status = automation.status === 'Live' ? 'Paused' : 'Live';
      await automation.save();
      res.json({ success: true, data: automation });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to toggle automation.', error: err.message });
    }
  },

  /**
   * DELETE /api/instagram/comment-automations/:id
   */
  async remove(req, res) {
    try {
      const result = await CommentAutomation.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!result) return res.status(404).json({ success: false, message: 'Automation not found.' });
      res.json({ success: true, message: 'Comment automation deleted successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete comment automation.', error: err.message });
    }
  },
};
