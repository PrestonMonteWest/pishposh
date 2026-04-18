import { getDb } from '@/db/connection.js'
import { type Posts, type VoteValue } from '@/db/types.js'
import type { Selectable } from 'kysely'
import { viewerVoteExpression } from './queries.js'
import {
  CreatePostData,
  PaginatedPosts,
  Post,
  PostWithViewerContext,
  VoteResult,
} from './types.js'

export function dbRowToPost(row: Selectable<Posts>): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    creatorId: row.creator_id,
    creatorUsername: row.creator_username,
    creatorDisplayName: row.creator_display_name,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    deletedAt: row.deleted_at ? (row.deleted_at as Date).toISOString() : null,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    score: row.score,
  }
}

export function dbRowToPostWithViewer(
  row: Selectable<Posts> & { viewer_vote: VoteValue | null },
): PostWithViewerContext {
  return {
    ...dbRowToPost(row),
    viewerVote: row.viewer_vote,
  }
}

export async function createPost(post: CreatePostData): Promise<Post> {
  const db = getDb()
  const row = await db
    .insertInto('posts')
    .values({
      title: post.title,
      content: post.content,
      creator_id: post.creatorId,
      creator_username: post.creatorUsername,
      creator_display_name: post.creatorDisplayName,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return dbRowToPost(row)
}

export async function voteOnPost(
  userId: string,
  postId: string,
  value: VoteValue,
): Promise<VoteResult> {
  const db = getDb()
  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom('post_votes')
      .select('value')
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .executeTakeFirst()

    let action: VoteResult['action']
    let userVote: VoteValue | null

    if (!existing) {
      // No vote yet → insert
      await trx
        .insertInto('post_votes')
        .values({ user_id: userId, post_id: postId, value })
        .execute()
      action = 'created'
      userVote = value
    } else if (existing.value === value) {
      // Same vote clicked again → retract
      await trx
        .deleteFrom('post_votes')
        .where('user_id', '=', userId)
        .where('post_id', '=', postId)
        .execute()
      action = 'retracted'
      userVote = null
    } else {
      // Different vote → flip
      await trx
        .updateTable('post_votes')
        .set({ value })
        .where('user_id', '=', userId)
        .where('post_id', '=', postId)
        .execute()
      action = 'flipped'
      userVote = value
    }

    // Read the post's updated counts — the trigger has already run
    // within this transaction, so these reflect the mutation above.
    const counts = await trx
      .selectFrom('posts')
      .select(['upvotes', 'downvotes', 'score'])
      .where('id', '=', postId)
      .executeTakeFirstOrThrow()

    return {
      action,
      userVote,
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      score: counts.score,
    }
  })
}

export async function findPostById(
  id: string,
  viewerId: string | null,
): Promise<Post | undefined> {
  const row = await getDb()
    .selectFrom('posts')
    .selectAll('posts')
    .select((eb) => viewerVoteExpression(eb, viewerId))
    .where('posts.id', '=', id)
    .where('posts.deleted_at', 'is', null)
    .executeTakeFirst()

  if (!row) return undefined
  return dbRowToPostWithViewer(row)
}

export async function findPostsByUserId(userId: string): Promise<Post[]> {
  const rows = await getDb()
    .selectFrom('posts')
    .selectAll()
    .where('creator_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .execute()

  return rows.map((r) => dbRowToPost(r))
}

export async function findPostsPaginated(
  limit: number,
  cursor: string | null,
  viewerId: string | null,
): Promise<PaginatedPosts> {
  let query = getDb()
    .selectFrom('posts')
    .selectAll('posts')
    .select((eb) => viewerVoteExpression(eb, viewerId))
    .where('posts.deleted_at', 'is', null)
    .orderBy('posts.created_at', 'desc')
    .limit(limit + 1)

  if (cursor) {
    query = query.where('posts.created_at', '<', new Date(cursor))
  }

  const rows = await query.execute()
  const hasMore = rows.length > limit

  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const posts = pageRows.map((r) => dbRowToPostWithViewer(r))

  const nextCursor = hasMore ? posts[posts.length - 1].createdAt : null

  return { posts, nextCursor, hasMore }
}
