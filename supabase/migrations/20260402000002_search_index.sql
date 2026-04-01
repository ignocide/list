CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS memos_content_trgm_idx
  ON memos USING GIN (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS tags_name_trgm_idx
  ON tags USING GIN (name gin_trgm_ops);
