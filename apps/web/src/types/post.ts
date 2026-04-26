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
  viewerVote: VoteValue | null
}

export interface CreatePostRequest {
  title: string
  content: string
}

export interface CreatePostResponse {
  post: Post
}

export interface PostsPage {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

export type VoteValue = 'down' | 'up'

export interface VoteResponse {
  action: 'created' | 'retracted' | 'flipped'
  userVote: VoteValue | null
  upvotes: number
  downvotes: number
  score: number
}
