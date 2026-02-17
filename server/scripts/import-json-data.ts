import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getDb, closeDb } from '../src/db/connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');

interface JsonUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  passwordHash: string;
  createdAt: string;
}

interface JsonRefreshToken {
  token: string;
  userId: string;
  expiresAt: string;
}

interface JsonMediaAttachment {
  id: string;
  uri: string;
  mimeType: string;
  filename: string;
}

interface JsonPost {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  media: JsonMediaAttachment[];
}

function loadJsonFile<T>(filename: string): T[] {
  const filepath = resolve(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    console.log(`${filename} not found, skipping`);
    return [];
  }
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf-8')) as [string, T][];
    return data.map(([, val]) => val);
  } catch (err) {
    console.error(`Failed to parse ${filename}:`, err);
    return [];
  }
}

async function importData() {
  const db = getDb();

  // Import users
  const users = loadJsonFile<JsonUser>('users.json');
  if (users.length > 0) {
    for (const user of users) {
      await db
        .insertInto('users')
        .values({
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.displayName,
          avatar_url: user.avatarUrl ?? null,
          password_hash: user.passwordHash,
          created_at: user.createdAt,
        })
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();
    }
    console.log(`Imported ${users.length} users`);
  }

  // Import refresh tokens
  const tokens = loadJsonFile<JsonRefreshToken>('refresh-tokens.json');
  if (tokens.length > 0) {
    for (const token of tokens) {
      await db
        .insertInto('refresh_tokens')
        .values({
          token: token.token,
          user_id: token.userId,
          expires_at: token.expiresAt,
        })
        .onConflict((oc) => oc.column('token').doNothing())
        .execute();
    }
    console.log(`Imported ${tokens.length} refresh tokens`);
  }

  // Import posts
  const posts = loadJsonFile<JsonPost>('posts.json');
  if (posts.length > 0) {
    for (const post of posts) {
      await db
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
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();

      // Import media attachments
      if (post.media.length > 0) {
        for (let i = 0; i < post.media.length; i++) {
          const m = post.media[i];
          await db
            .insertInto('media_attachments')
            .values({
              id: m.id,
              post_id: post.id,
              uri: m.uri,
              mime_type: m.mimeType,
              filename: m.filename,
              display_order: i,
            })
            .onConflict((oc) => oc.column('id').doNothing())
            .execute();
        }
      }
    }
    console.log(`Imported ${posts.length} posts`);
  }

  await closeDb();
  console.log('Import complete');
}

importData().catch((err) => {
  console.error('Import failed:', err);
  closeDb().then(() => process.exit(1));
});
