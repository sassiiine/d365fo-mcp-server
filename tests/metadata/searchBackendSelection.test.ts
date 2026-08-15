/**
 * Regression guard for the cloud deployment path.
 *
 * `searchBackend(context)` falls back to a local SQLite adapter whenever
 * `context.searchIndex` is absent. That fallback is correct for tests, but it
 * made a real defect invisible: the HTTP branch of initializeServices() built
 * its context WITHOUT searchIndex, so a server configured with NEON_DATABASE_URL
 * silently read from local SQLite instead of Neon. Nothing failed — it just
 * quietly used the wrong index, which in a container (no SQLite file) means an
 * empty one.
 *
 * These tests pin the two halves of that contract:
 *   1. makeSearchBackend() actually selects Neon when the env says so.
 *   2. searchBackend() honours an explicitly supplied backend rather than
 *      re-wrapping the local index.
 */
import { describe, it, expect, afterEach } from 'vitest';

import {
  makeSearchBackend,
  searchBackend,
  SqliteSearchAdapter,
  type ISearchIndex,
} from '../../src/metadata/searchBackend.js';
import { NeonSymbolIndex } from '../../src/metadata/neon/neonSymbolIndex.js';
import type { XppSymbolIndex } from '../../src/metadata/symbolIndex.js';

/** A stand-in for the local index — never touched by the Neon path. */
const fakeLocalIndex = {} as XppSymbolIndex;

const ENV_KEYS = ['NEON_DATABASE_URL', 'DATABASE_URL'] as const;
const saved = new Map<string, string | undefined>();

function setEnv(key: string, value: string | undefined): void {
  if (!saved.has(key)) saved.set(key, process.env[key]);
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

afterEach(async () => {
  for (const [key, value] of saved) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  saved.clear();
});

describe('makeSearchBackend', () => {
  it('selects the local SQLite adapter when Neon is not configured', () => {
    for (const key of ENV_KEYS) setEnv(key, undefined);

    const backend = makeSearchBackend(() => fakeLocalIndex);

    expect(backend).toBeInstanceOf(SqliteSearchAdapter);
  });

  it('selects the Neon backend when NEON_DATABASE_URL is set', async () => {
    setEnv('DATABASE_URL', undefined);
    // A syntactically valid DSN. pg's Pool is lazy — constructing it opens no
    // socket, so this test never touches the network.
    setEnv('NEON_DATABASE_URL', 'postgresql://user:pw@example.invalid/db?sslmode=require');

    const backend = makeSearchBackend(() => fakeLocalIndex);

    expect(backend).toBeInstanceOf(NeonSymbolIndex);
    await (backend as NeonSymbolIndex).close();
  });

  it('accepts DATABASE_URL as the fallback variable name', async () => {
    setEnv('NEON_DATABASE_URL', undefined);
    setEnv('DATABASE_URL', 'postgresql://user:pw@example.invalid/db?sslmode=require');

    const backend = makeSearchBackend(() => fakeLocalIndex);

    expect(backend).toBeInstanceOf(NeonSymbolIndex);
    await (backend as NeonSymbolIndex).close();
  });
});

describe('searchBackend', () => {
  it('returns the backend the server put on the context', () => {
    const provided = { marker: 'neon' } as unknown as ISearchIndex;

    const resolved = searchBackend({ symbolIndex: fakeLocalIndex, searchIndex: provided });

    expect(resolved).toBe(provided);
  });

  it('falls back to a local adapter only when no backend was supplied', () => {
    const resolved = searchBackend({ symbolIndex: fakeLocalIndex });

    expect(resolved).toBeInstanceOf(SqliteSearchAdapter);
  });
});
