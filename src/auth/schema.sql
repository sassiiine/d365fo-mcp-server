-- ============================================================================
-- Per-customer API keys.
--
-- One row per issued key. The plaintext key is NEVER stored - only its SHA-256
-- digest - so a dump of this table does not let the reader call the service.
-- The key is shown exactly once, at issue time, and cannot be recovered
-- afterwards; a customer who loses it gets a new one and the old is revoked.
--
-- Revocation is an UPDATE, not a DELETE, so the row survives as an audit record
-- of who had access and when it ended. Nothing here is ever hard-deleted.
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS tenancy;

CREATE TABLE IF NOT EXISTS tenancy.api_keys (
  id           bigserial PRIMARY KEY,
  -- SHA-256 hex of the key. Plain SHA-256 rather than bcrypt/argon2 on purpose:
  -- the key is 256 bits of CSPRNG output, not a human-chosen password, so it has
  -- no dictionary to attack and a slow KDF would only add latency to every
  -- request. UNIQUE doubles as the lookup index for the auth hot path.
  key_hash     text        NOT NULL UNIQUE,
  -- Who this key belongs to. Not a foreign key yet: there is no customers table
  -- until billing exists, and inventing one now would guess at its shape.
  customer     text        NOT NULL,
  -- Free text for humans: "Contoso prod VM", "trial - expires Sept".
  label        text,
  status       text        NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz,
  -- Advanced at most once per LAST_USED_THROTTLE_MS per key, so an idle-detection
  -- signal does not cost a write on every request.
  last_used_at timestamptz,

  CONSTRAINT api_keys_status_valid CHECK (status IN ('active', 'revoked')),
  -- Keeps status and revoked_at from disagreeing, which is the kind of drift
  -- that turns "we revoked it" into "we thought we revoked it".
  CONSTRAINT api_keys_revoked_consistent CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS api_keys_customer_idx ON tenancy.api_keys (customer);
