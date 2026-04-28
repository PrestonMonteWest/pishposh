import { optionalAuth, requireAuth } from '@/middleware/auth.js'
import {
  createPost,
  findPostById,
  findPostsPaginated,
  voteOnPost,
} from '@/models/post/post.js'
import { Router, type Request, type Response } from 'express'
import { validate as isUuid } from 'uuid'
import { requireVerifiedEmail } from '../middleware/email.js'

const router = Router()

router.post(
  '/',
  requireAuth,
  requireVerifiedEmail,
  async (req: Request, res: Response) => {
    const title = req.body.title?.trim()
    const content = req.body.content?.trim()

    if (!title || typeof title !== 'string' || !title) {
      return res
        .status(400)
        .json({ message: 'Title is required', code: 'MISSING_FIELDS' })
    }

    if (title.length > 100) {
      return res.status(400).json({
        message: 'Title must be 100 characters or less',
        code: 'VERIFICATION_FAILED',
      })
    }

    if (!content || typeof content !== 'string' || !content) {
      return res
        .status(400)
        .json({ message: 'Content is required', code: 'MISSING_FIELDS' })
    }

    if (content.length > 2000) {
      return res.status(400).json({
        message: 'Content must be 2000 characters or less',
        code: 'VERIFICATION_FAILED',
      })
    }

    const creatorId = req.token!.userId
    const post = await createPost({
      title,
      content,
      creatorId,
      creatorUsername: req.user!.username,
      creatorDisplayName: req.user!.displayName,
    })

    return res.status(201).json({ post })
  },
)

router.post(
  '/:id/votes',
  requireAuth,
  requireVerifiedEmail,
  async (req: Request<{ id: string }>, res: Response) => {
    const { value } = req.body as { value?: unknown }

    if (value !== 'up' && value !== 'down') {
      return res.status(400).json({
        message: 'value must be "up" or "down"',
        code: 'VERIFICATION_FAILED',
      })
    }

    const postId = req.params.id
    if (!isUuid(postId)) {
      return res.status(404).json({
        message: 'Post not found',
        code: 'NOT_FOUND',
      })
    }

    const post = await findPostById(postId, null)
    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        code: 'NOT_FOUND',
      })
    }

    const result = await voteOnPost(req.token!.userId, postId, value)
    return res.status(200).json(result)
  },
)

router.get(
  '/:id',
  optionalAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id
    if (!isUuid(id)) {
      return res.status(404).json({
        message: 'Post not found',
        code: 'NOT_FOUND',
      })
    }

    const viewerId = req.token?.userId ?? null
    const post = await findPostById(id, viewerId)
    if (!post) {
      return res
        .status(404)
        .json({ message: 'Post not found', code: 'NOT_FOUND' })
    }

    return res.json({ post })
  },
)

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || 20, 1),
    50,
  )
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null
  const viewerId = req.token?.userId ?? null
  const result = await findPostsPaginated(limit, cursor, viewerId)
  return res.json(result)
})

export default router
