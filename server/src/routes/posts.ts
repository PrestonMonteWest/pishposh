import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import { createPost } from '../models/post.js';

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/gif',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/x-matroska',
  'video/webm',
]);

router.post('/', authenticateToken, (req: Request, res: Response) => {
  const { title, content, media } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ message: 'Title is required', code: 'VALIDATION_ERROR' });
    return;
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ message: 'Content is required', code: 'VALIDATION_ERROR' });
    return;
  }

  const mediaAttachments = Array.isArray(media) ? media : [];

  for (const attachment of mediaAttachments) {
    if (!attachment.mimeType || !ALLOWED_MIME_TYPES.has(attachment.mimeType)) {
      res.status(400).json({
        message: `Unsupported media type: ${attachment.mimeType}`,
        code: 'VALIDATION_ERROR',
      });
      return;
    }
  }

  const now = new Date().toISOString();
  const post = createPost({
    id: randomUUID(),
    title: title.trim(),
    content: content.trim(),
    creatorId: req.user!.userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    media: mediaAttachments.map((m: { mimeType: string; filename: string }) => ({
      id: randomUUID(),
      uri: '',
      mimeType: m.mimeType,
      filename: m.filename,
    })),
  });

  res.status(201).json({ post });
});

export default router;
