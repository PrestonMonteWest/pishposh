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

export interface CreatePostRequest {
  title: string
  content: string
  media: MediaAttachment[]
}

export interface CreatePostResponse {
  post: Post
}

export interface PostsPage {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}
