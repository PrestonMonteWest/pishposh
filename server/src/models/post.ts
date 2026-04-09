import type { Selectable } from 'kysely'
import { getDb } from '../db/connection.js'
import type { PostsTable } from '../db/types.js'

export interface MediaAttachment {
  id: string
  uri: string
  mimeType: string
  filename: string
}

export interface Post {
  id: string
  title: string
  creatorId: string
  creatorUsername: string
  creatorDisplayName: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  content: string
  media: MediaAttachment[]
}

export interface PaginatedPosts {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

function dbRowToPost(
  row: Selectable<PostsTable>,
  media: MediaAttachment[],
): Post {
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
    media,
  }
}

async function fetchMediaForPost(postId: string): Promise<MediaAttachment[]> {
  const rows = await getDb()
    .selectFrom('media_attachments')
    .selectAll()
    .where('post_id', '=', postId)
    .orderBy('display_order', 'asc')
    .execute()
  return rows.map((r) => ({
    id: r.id,
    uri: r.uri,
    mimeType: r.mime_type,
    filename: r.filename,
  }))
}

async function fetchMediaForPosts(
  postIds: string[],
): Promise<Map<string, MediaAttachment[]>> {
  if (postIds.length === 0) return new Map()
  const rows = await getDb()
    .selectFrom('media_attachments')
    .selectAll()
    .where('post_id', 'in', postIds)
    .orderBy('post_id', 'asc')
    .orderBy('display_order', 'asc')
    .execute()

  const map = new Map<string, MediaAttachment[]>()
  for (const r of rows) {
    const list = map.get(r.post_id) ?? []
    list.push({
      id: r.id,
      uri: r.uri,
      mimeType: r.mime_type,
      filename: r.filename,
    })
    map.set(r.post_id, list)
  }
  return map
}

export async function createPost(post: Post): Promise<Post> {
  const db = getDb()
  const row = await db
    .insertInto('posts')
    .values({
      id: post.id,
      title: post.title,
      content: post.content,
      creator_id: post.creatorId,
      creator_username: post.creatorUsername,
      creator_display_name: post.creatorDisplayName,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      deleted_at: post.deletedAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  if (post.media.length > 0) {
    await db
      .insertInto('media_attachments')
      .values(
        post.media.map((m, i) => ({
          id: m.id,
          post_id: post.id,
          uri: m.uri,
          mime_type: m.mimeType,
          filename: m.filename,
          display_order: i,
        })),
      )
      .execute()
  }

  return dbRowToPost(row, post.media)
}

export async function findPostById(id: string): Promise<Post | undefined> {
  const row = await getDb()
    .selectFrom('posts')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
  if (!row) return undefined
  const media = await fetchMediaForPost(id)
  return dbRowToPost(row, media)
}

export async function findPostsByUserId(userId: string): Promise<Post[]> {
  const rows = await getDb()
    .selectFrom('posts')
    .selectAll()
    .where('creator_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .execute()

  const mediaMap = await fetchMediaForPosts(rows.map((r) => r.id))
  return rows.map((r) => dbRowToPost(r, mediaMap.get(r.id) ?? []))
}

export async function findPostsPaginated(
  cursor: string | null,
  limit: number,
): Promise<PaginatedPosts> {
  let query = getDb()
    .selectFrom('posts')
    .selectAll()
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .limit(limit + 1)

  if (cursor) {
    query = query.where('created_at', '<', new Date(cursor))
  }

  const rows = await query.execute()
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows

  const mediaMap = await fetchMediaForPosts(pageRows.map((r) => r.id))
  const posts = pageRows.map((r) => dbRowToPost(r, mediaMap.get(r.id) ?? []))

  const nextCursor = hasMore ? posts[posts.length - 1].createdAt : null

  return { posts, nextCursor, hasMore }
}
