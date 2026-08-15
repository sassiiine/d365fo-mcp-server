-- ============================================================================
-- EDT base types.
--
-- The symbols table records an EDT's Extends (in `signature`) but not its
-- DECLARED base type - the `i:type="AxEdtString|AxEdtReal|AxEdtDate|AxEdtEnum|…"`
-- discriminator on the AxEdt root element. Without it the cloud cannot answer
-- "is this EDT a string or a real", which is the fact the table-field validation
-- rule turns on, and the fact the generator needs in order to stop emitting
-- AxTableFieldString for every field regardless of what it binds.
--
-- Deriving it from the Extends chain does not work: the chain bottoms out on
-- names that are not themselves indexed as EDTs (MoneyMST, ItemIdBase), so the
-- walk ends with no answer for a large share of EDTs.
--
-- Kept in its own table rather than a column on `symbols` so the backfill can be
-- re-run and truncated independently of the 1.15M-row index, and so a failed
-- backfill degrades to "no rule" rather than corrupting the index.
-- ============================================================================
CREATE TABLE IF NOT EXISTS arch_a.edt_types (
  -- Lower-cased EDT name. X++ identifiers are case-insensitive, and callers
  -- reach this table with whatever casing the XML happened to use.
  name_lower text PRIMARY KEY,
  name       text NOT NULL,
  -- 'string' | 'real' | 'date' | 'enum' | 'int' | 'int64' | 'guid' |
  -- 'container' | 'time' | 'utcdatetime' - the i:type suffix, lower-cased.
  base_type  text NOT NULL,
  -- The Extends value, kept so a future rule can check that an EDT agrees with
  -- the EDT it extends.
  extends    text,
  model      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
