-- users (Supabase Auth 트리거로 동기화)
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- user_preferences (세션 복원용)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id             uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_notebook_id    uuid,
  last_scroll_memo_id uuid,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- notebooks (notebook_id = null인 메모가 미분류 → is_default 컬럼 불필요)
CREATE TABLE IF NOT EXISTS notebooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#868e96',
  "order"     int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- memos (title 컬럼 없음 — content 첫 줄 파싱)
CREATE TABLE IF NOT EXISTS memos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notebook_id  uuid REFERENCES notebooks(id) ON DELETE SET NULL,
  content      text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- tags
CREATE TABLE IF NOT EXISTS tags (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name     text NOT NULL,
  UNIQUE(user_id, name)
);

-- memo_tags
CREATE TABLE IF NOT EXISTS memo_tags (
  memo_id  uuid NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(memo_id, tag_id)
);

-- attachments
CREATE TABLE IF NOT EXISTS attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id      uuid NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_type    text NOT NULL,
  storage_path text NOT NULL,
  size         int NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (NestJS는 service role key로 RLS 우회)
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "preferences_own" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notebooks_own" ON notebooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "memos_own" ON memos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "tags_own" ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "memo_tags_own" ON memo_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM memos WHERE id = memo_id AND user_id = auth.uid()));
CREATE POLICY "attachments_own" ON attachments FOR ALL USING (auth.uid() = user_id);
