import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export interface MediaAttachment {
  id: string;
  uri: string;
  mimeType: string;
  filename: string;
}

export interface Post {
  id: string;
  title: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  content: string;
  media: MediaAttachment[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const POSTS_FILE = resolve(DATA_DIR, 'posts.json');

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPosts(): Map<string, Post> {
  if (!existsSync(POSTS_FILE)) return new Map();
  try {
    const data = JSON.parse(readFileSync(POSTS_FILE, 'utf-8')) as [string, Post][];
    return new Map(data);
  } catch {
    return new Map();
  }
}

function savePosts(posts: Map<string, Post>): void {
  ensureDataDir();
  writeFileSync(POSTS_FILE, JSON.stringify([...posts.entries()], null, 2));
}

export function createPost(post: Post): Post {
  const posts = loadPosts();
  posts.set(post.id, post);
  savePosts(posts);
  return post;
}

export function findPostById(id: string): Post | undefined {
  return loadPosts().get(id);
}

export function findPostsByUserId(userId: string): Post[] {
  const result: Post[] = [];
  for (const post of loadPosts().values()) {
    if (post.creatorId === userId && !post.deletedAt) {
      result.push(post);
    }
  }
  return result;
}
