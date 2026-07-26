-- Idempotent migration for auth fields on existing databases.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS register_ip text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS github_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_google_id_key'
  ) THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_google_id_key UNIQUE (google_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_github_id_key'
  ) THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_github_id_key UNIQUE (github_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_sessions_user_idx ON app_sessions (user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expires_idx ON app_sessions (expires_at);

ALTER TABLE app_api_keys ADD COLUMN IF NOT EXISTS last_used_at timestamptz;
