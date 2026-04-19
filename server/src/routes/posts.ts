import { optionalAuth, requiredAuth } from '@/middleware/auth.js'
import {
  createPost,
  findPostById,
  findPostsPaginated,
  voteOnPost,
} from '@/models/post/post.js'
import { findUserById } from '@/models/user/user.js'
import { Router, type Request, type Response } from 'express'
import { validate as isUuid } from 'uuid'

const router = Router()

router.post('/', requiredAuth, async (req: Request, res: Response) => {
  const { title, content } = req.body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res
      .status(400)
      .json({ message: 'Title is required', code: 'VALIDATION_ERROR' })
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res
      .status(400)
      .json({ message: 'Content is required', code: 'VALIDATION_ERROR' })
  }

  const creatorId = req.token!.userId
  const creator = await findUserById(creatorId)
  if (!creator) {
    return res
      .status(401)
      .json({ message: 'Authentication required', code: 'UNAUTHENTICATED' })
  }
  const post = await createPost({
    title: title.trim(),
    content: content.trim(),
    creatorId,
    creatorUsername: creator.username,
    creatorDisplayName: creator.displayName,
  })

  return res.status(201).json({ post })
})

router.post(
  '/:id/votes',
  requiredAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    const { value } = req.body as { value?: unknown }

    if (value !== 'up' && value !== 'down') {
      return res.status(400).json({
        message: 'value must be "up" or "down"',
        code: 'VALIDATION_ERROR',
      })
    }

    const postId = req.params.id
    if (!isUuid(postId)) {
      return res.status(400).json({
        message: `Malformed post ID: ${postId}`,
        code: 'VALIDATION_ERROR',
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
      return res.status(400).json({
        message: `Malformed post ID: ${id}`,
        code: 'VALIDATION_ERROR',
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
