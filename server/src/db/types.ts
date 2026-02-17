import type { ColumnType, Generated } from 'kysely';

export interface UsersTable {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  password_hash: string;
  created_at: ColumnType<Date, string | Date, string | Date>;
}

export interface RefreshTokensTable {
  token: string;
  user_id: string;
  expires_at: ColumnType<Date, string | Date, string | Date>;
}

export interface PostsTable {
  id: string;
  title: string;
  content: string;
  creator_id: string;
  creator_username: string;
  creator_display_name: string;
  created_at: ColumnType<Date, string | Date, string | Date>;
  updated_at: ColumnType<Date, string | Date, string | Date>;
  deleted_at: ColumnType<Date | null, string | Date | null, string | Date | null>;
}

export interface MediaAttachmentsTable {
  id: string;
  post_id: string;
  uri: string;
  mime_type: string;
  filename: string;
  display_order: number;
}

export interface Database {
  users: UsersTable;
  refresh_tokens: RefreshTokensTable;
  posts: PostsTable;
  media_attachments: MediaAttachmentsTable;
}
