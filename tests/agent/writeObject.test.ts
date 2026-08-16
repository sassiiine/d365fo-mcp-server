/**
 * The thin agent's write path.
 *
 * The load-bearing test here is the one asserting it REFUSES without xmlContent.
 * That refusal is what keeps generation on the hosted server; if it ever softens
 * into "generate it locally when convenient", the templates come back to the
 * customer's disk and the packaging work is undone.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeObject, resolveObjectPath, normalizeMetadataXml } from '../../src/agent/writeObject.ts';

let root: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'agent-')); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

const XML = '<?xml version="1.0" encoding="utf-8"?>\n<AxEnum>\n\t<Name>Ex_T</Name>\n</AxEnum>';
const base = { objectType: 'enum', objectName: 'Ex_T', modelName: 'Ex_M', xmlContent: XML };

describe('writeObject', () => {
  it('refuses without xmlContent - the agent must not generate', async () => {
    await expect(writeObject({ ...base, xmlContent: '', packagePath: root }))
      .rejects.toThrow(/does not generate/);
  });

  it('writes to <packages>/<model>/<model>/<AxFolder>/<name>.xml', async () => {
    const r = await writeObject({ ...base, packagePath: root });
    expect(r.path).toBe(join(root, 'Ex_M', 'Ex_M', 'AxEnum', 'Ex_T.xml'));
    expect(await readFile(r.path, 'utf8')).toContain('<Name>Ex_T</Name>');
  });

  it('writes CRLF with no BOM and no trailing newline, as D365FO expects', async () => {
    const r = await writeObject({ ...base, packagePath: root });
    const raw = await readFile(r.path);
    expect(raw[0]).not.toBe(0xef);            // no UTF-8 BOM
    expect(raw.toString('utf8')).toContain('\r\n');
    expect(raw.toString('utf8')).not.toMatch(/\r?\n$/);
  });

  it('refuses to clobber an existing object unless told to', async () => {
    await writeObject({ ...base, packagePath: root });
    await expect(writeObject({ ...base, packagePath: root })).rejects.toThrow(/already exists/);
    await expect(writeObject({ ...base, packagePath: root, overwrite: true })).resolves.toBeTruthy();
  });

  it('rejects an unknown object type rather than inventing a folder', async () => {
    await expect(writeObject({ ...base, objectType: 'widget', packagePath: root }))
      .rejects.toThrow(/Unknown object type/);
  });

  it('registers the file in a .rnrproj', async () => {
    const proj = join(root, 'p.rnrproj');
    await writeFile(proj, '<Project>\r\n  <ItemGroup />\r\n</Project>', 'utf8');
    const r = await writeObject({ ...base, packagePath: root, projectPath: proj });
    expect(r.addedToProject).toBe(true);
    expect(await readFile(proj, 'utf8')).toContain('Ex_T.xml');
  });

  it('does not duplicate an entry when the same object is rewritten', async () => {
    const proj = join(root, 'p.rnrproj');
    await writeFile(proj, '<Project>\r\n  <ItemGroup />\r\n</Project>', 'utf8');
    await writeObject({ ...base, packagePath: root, projectPath: proj });
    await writeObject({ ...base, packagePath: root, projectPath: proj, overwrite: true });
    const xml = await readFile(proj, 'utf8');
    expect(xml.split('Ex_T.xml').length - 1).toBe(1);
  });

  it('warns rather than fails when the project file is missing', async () => {
    const r = await writeObject({ ...base, packagePath: root, projectPath: join(root, 'nope.rnrproj') });
    expect(r.addedToProject).toBe(false);
    expect(r.warnings.join(' ')).toMatch(/build is unaffected/);
  });

  it('creates the AOT folder when the model is new', async () => {
    await mkdir(join(root, 'Ex_M'), { recursive: true });
    await expect(writeObject({ ...base, packagePath: root })).resolves.toBeTruthy();
  });

  it('explains itself when no packages root is configured', () => {
    const saved = process.env.D365FO_PACKAGE_PATH;
    delete process.env.D365FO_PACKAGE_PATH;
    try {
      expect(() => resolveObjectPath({ objectType: 'enum', objectName: 'A', modelName: 'M' }))
        .toThrow(/D365FO_PACKAGE_PATH/);
    } finally {
      if (saved) process.env.D365FO_PACKAGE_PATH = saved;
    }
  });
});

describe('normalizeMetadataXml', () => {
  it('is idempotent, so rewriting an unchanged object is a no-op diff', () => {
    const once = normalizeMetadataXml(XML);
    expect(normalizeMetadataXml(once)).toBe(once);
  });
});
