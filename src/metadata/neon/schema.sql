-- ============================================================================
-- Architecture A — canonical Neon Postgres schema for the X++ metadata index.
-- This is the exact shape deployed to schema `arch_a` and queried by
-- NeonSymbolIndex. FTS5 (SQLite) is replaced by a generated `search_light`
-- column + a pg_trgm GIN index. Verified at full scale (1.15M symbols /
-- 363k labels) at 100% search parity vs the live SQLite FTS5 index.
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE SCHEMA IF NOT EXISTS arch_a;

CREATE TABLE IF NOT EXISTS arch_a.symbols (
  id                    bigint PRIMARY KEY,
  name                  text NOT NULL,
  type                  text NOT NULL,
  parent_name           text,
  signature             text,
  file_path             text NOT NULL,
  model                 text NOT NULL,
  package_name          text,
  description           text,
  tags                  text,
  source_snippet        text,     -- full X++ source; NOT trigram-indexed (huge)
  source                text,
  complexity            integer,
  used_types            text,
  method_calls          text,
  inline_comments       text,
  extends_class         text,
  implements_interfaces text,
  usage_example         text,
  usage_frequency       integer DEFAULT 0,
  pattern_type          text,
  typical_usages        text,
  called_by_count       integer DEFAULT 0,
  related_methods       text,
  api_patterns          text,
  -- Mirrors the SQLite FTS5 "light column set" the app scans on the hot path.
  -- coalesce(...)||' '||... is IMMUTABLE (concat_ws is only STABLE and is
  -- rejected for generated columns / functional indexes).
  search_light text GENERATED ALWAYS AS (
    lower(coalesce(name,'')||' '||coalesce(type,'')||' '||coalesce(parent_name,'')
       ||' '||coalesce(signature,'')||' '||coalesce(description,'')||' '||coalesce(tags,''))
  ) STORED
);
CREATE INDEX IF NOT EXISTS symbols_light_trgm  ON arch_a.symbols USING gin (search_light gin_trgm_ops);
CREATE INDEX IF NOT EXISTS symbols_name_prefix ON arch_a.symbols (lower(name) text_pattern_ops);
CREATE INDEX IF NOT EXISTS symbols_type_idx    ON arch_a.symbols (type);

CREATE TABLE IF NOT EXISTS arch_a.labels (
  id            bigint PRIMARY KEY,
  label_id      text NOT NULL,
  label_file_id text NOT NULL,
  model         text NOT NULL,
  language      text NOT NULL,
  text          text NOT NULL,
  comment       text,
  file_path     text NOT NULL,
  search_light  text GENERATED ALWAYS AS (
    lower(coalesce(label_id,'')||' '||coalesce(text,'')||' '||coalesce(comment,''))
  ) STORED
);
CREATE INDEX IF NOT EXISTS labels_light_trgm ON arch_a.labels USING gin (search_light gin_trgm_ops);
CREATE INDEX IF NOT EXISTS labels_model_idx  ON arch_a.labels (model);
CREATE INDEX IF NOT EXISTS labels_lang_idx   ON arch_a.labels (language);
