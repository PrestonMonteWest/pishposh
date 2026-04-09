import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import { authenticateToken } from '../middleware/auth.js'
import { createPost, findPostById, findPostsPaginated } from '../models/post.js'
import { findUserById } from '../models/user.js'

const router = Router()

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/gif',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/x-matroska',
  'video/webm',
])

router.get('/', async (req: Request, res: Response) => {
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || 20, 1),
    50,
  )
  const result = await findPostsPaginated(cursor, limit)
  res.json(result)
})

router.get('/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const post = await findPostById(id)
  if (!post || post.deletedAt) {
    res.status(404).json({ message: 'Post not found', code: 'NOT_FOUND' })
    return
  }
  res.json({ post })
})

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { title, content, media } = req.body

  if (!title || typeof title !== 'string' || !title.trim()) {
    res
      .status(400)
      .json({ message: 'Title is required', code: 'VALIDATION_ERROR' })
    return
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    res
      .status(400)
      .json({ message: 'Content is required', code: 'VALIDATION_ERROR' })
    return
  }

  const mediaAttachments = Array.isArray(media) ? media : []

  for (const attachment of mediaAttachments) {
    if (!attachment.mimeType || !ALLOWED_MIME_TYPES.has(attachment.mimeType)) {
      res.status(400).json({
        message: `Unsupported media type: ${attachment.mimeType}`,
        code: 'VALIDATION_ERROR',
      })
      return
    }
  }

  const creator = await findUserById(req.user!.userId)
  const now = new Date().toISOString()
  const post = await createPost({
    id: randomUUID(),
    title: title.trim(),
    content: content.trim(),
    creatorId: req.user!.userId,
    creatorUsername: creator?.username ?? 'unknown',
    creatorDisplayName: creator?.displayName ?? 'Unknown User',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    media: mediaAttachments.map(
      (m: { mimeType: string; filename: string }) => ({
        id: randomUUID(),
        uri: '',
        mimeType: m.mimeType,
        filename: m.filename,
      }),
    ),
  })

  res.status(201).json({ post })
})

export default router
