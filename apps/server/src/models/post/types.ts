import type { VoteValue } from '@/db/types.js'

export interface Post {
  id: string
  title: string
  content: string
  creatorId: string
  creatorUsername: string
  creatorDisplayName: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  upvotes: number
  downvotes: number
  score: number
}

export interface PaginatedPosts {
  posts: PostWithViewerContext[]
  nextCursor: string | null
  hasMore: boolean
}

export interface VoteResult {
  action: 'created' | 'retracted' | 'flipped'
  userVote: VoteValue | null
  upvotes: number
  downvotes: number
  score: number
}

// Input shapes
export interface CreatePostInput {
  title: string
  content: string
}

export interface CreatePostData extends CreatePostInput {
  creatorId: string
  creatorUsername: string
  creatorDisplayName: string
}

export interface PostWithViewerContext extends Post {
  viewerVote: VoteValue | null
}
