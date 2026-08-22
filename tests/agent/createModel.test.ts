/**
 * Model creation as a tool rather than a script the customer runs by hand.
 *
 * The layout tests matter most: getting the descriptor or the module references
 * wrong produces failures inside the objects that follow, pointing at a table or
 * a field rather than at the model that cannot resolve them.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createModel, modelIdFor, buildDescriptorXml } from '../../src/agent/createModel.ts';

let root: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'model-')); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

const packages = () => join(root, 'PackagesLocalDirectory');

describe('createModel', () => {
  it('creates descriptor, AOT skeleton and project in place', async () => {
    await mkdir(packages(), { recursive: true });
    const r = await createModel({ modelName: 'Tk_Demo', packagesPath: packages() });

    expect(r.modelName).toBe('Tk_Demo');
    const desc = await readFile(join(packages(), 'Tk_Demo', 'Descriptor', 'Tk_Demo.xml'), 'utf8');
    expect(desc).toContain('<Name>Tk_Demo</Name>');
    expect(desc).toContain('<Layer>14</Layer>');
    expect(await readFile(r.projectPath, 'utf8')).toContain('<Model>Tk_Demo</Model>');
  });

  it('writes the descriptor with a BOM, which the compiler requires', async () => {
    await mkdir(packages(), { recursive: true });
    await createModel({ modelName: 'Tk_Demo', packagesPath: packages() });
    const raw = await readFile(join(packages(), 'Tk_Demo', 'Descriptor', 'Tk_Demo.xml'));
    expect([raw[0], raw[1], raw[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it('references the modules the standard EDTs live in', async () => {
    // Without ApplicationPlatform/ApplicationFoundation, every field bound to
    // Name/AmountMST/TransDate fails to compile.
    await mkdir(packages(), { recursive: true });
    await createModel({ modelName: 'Tk_Demo', packagesPath: packages() });
    const desc = await readFile(join(packages(), 'Tk_Demo', 'Descriptor', 'Tk_Demo.xml'), 'utf8');
    expect(desc).toContain('ApplicationPlatform');
    expect(desc).toContain('ApplicationFoundation');
  });

  it('refuses to overwrite a model the AOS can already see', async () => {
    await mkdir(join(packages(), 'Tk_Demo'), { recursive: true });
    await expect(createModel({ modelName: 'Tk_Demo', packagesPath: packages() }))
      .rejects.toThrow(/already exists/);
  });

  it('rejects a name that cannot be a folder, namespace and assembly', async () => {
    await mkdir(packages(), { recursive: true });
    for (const bad of ['1Bad', 'has space', 'has-dash', '']) {
      await expect(createModel({ modelName: bad, packagesPath: packages() })).rejects.toThrow();
    }
  });

  it('derives a stable id in the custom range', () => {
    const a = modelIdFor('Tk_Demo');
    expect(a).toBe(modelIdFor('Tk_Demo'));       // stable across runs
    expect(a).not.toBe(modelIdFor('Tk_Other'));  // distinct per model
    expect(a).toBeGreaterThanOrEqual(896_000_000);
  });

  it('honours an explicit layer and publisher', () => {
    const xml = buildDescriptorXml({
      modelName: 'Tk_Demo', modelId: 1, description: 'd', publisher: 'Kaneidos', layer: 8, modules: ['A'],
    });
    expect(xml).toContain('<Layer>8</Layer>');
    expect(xml).toContain('<Publisher>Kaneidos</Publisher>');
  });

  it('places metadata under the repo and links it when a repoRoot is given', async () => {
    await mkdir(packages(), { recursive: true });
    const repo = join(root, 'Repo');
    const r = await createModel({ modelName: 'Tk_Demo', packagesPath: packages(), repoRoot: repo });

    // Under source control, not loose in PackagesLocalDirectory.
    expect(r.metadataPath.startsWith(repo)).toBe(true);
    expect(r.projectPath.startsWith(join(repo, 'Projects'))).toBe(true);
    // Junction creation can fail on a sandboxed filesystem; if it did, it must
    // say so rather than report a model the compiler cannot see.
    if (!r.linkedFrom) expect(r.warnings.join(' ')).toMatch(/could not link/i);
  });

  it('explains itself when no packages root is known', async () => {
    const saved = process.env.D365FO_PACKAGE_PATH;
    delete process.env.D365FO_PACKAGE_PATH;
    try {
      await expect(createModel({ modelName: 'Tk_Demo' })).rejects.toThrow(/packages root/i);
    } finally {
      if (saved) process.env.D365FO_PACKAGE_PATH = saved;
    }
  });

  it('is idempotent: re-creating an existing model returns it instead of throwing', async () => {
    // The agent creates a model, then fails partway through the objects that
    // follow. Every retry used to die on the directory its own first attempt
    // had made, which made a half-built model unrecoverable.
    await mkdir(packages(), { recursive: true });
    const first = await createModel({ modelName: 'Tk_Demo', packagesPath: packages() });
    expect(first.alreadyExisted).toBe(false);

    const second = await createModel({ modelName: 'Tk_Demo', packagesPath: packages() });
    expect(second.alreadyExisted).toBe(true);
    expect(second.modelId).toBe(first.modelId);
    expect(second.projectPath).toBe(first.projectPath);
    expect(second.created).toEqual([]);
    expect(second.warnings.join(' ')).toMatch(/already exists/i);
  });

  it('still refuses a directory that exists but is not a model', async () => {
    // A name collision with an unrelated package must not be swallowed by the
    // idempotent path - there is no descriptor, so nothing to return.
    await mkdir(join(packages(), 'Tk_Demo'), { recursive: true });
    await expect(createModel({ modelName: 'Tk_Demo', packagesPath: packages() }))
      .rejects.toThrow(/not a model/i);
  });

  it('keeps the repo layout when returning an existing model', async () => {
    const repo = join(root, 'Repo');
    await mkdir(packages(), { recursive: true });
    const first = await createModel({ modelName: 'Tk_Demo', packagesPath: packages(), repoRoot: repo });
    if (!first.linkedFrom) return; // junction unavailable on this filesystem
    const second = await createModel({ modelName: 'Tk_Demo', packagesPath: packages(), repoRoot: repo });
    expect(second.alreadyExisted).toBe(true);
    expect(second.projectPath).toBe(first.projectPath);
  });
});
