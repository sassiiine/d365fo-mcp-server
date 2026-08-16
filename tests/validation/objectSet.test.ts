/**
 * Cross-object validation.
 *
 * The case that motivated it: a generated table and a generated form for it,
 * each valid alone, that could not compile together. xppc reported "Field group
 * 'Overview' does not exist" against the FORM while the cause was the TABLE.
 */
import { describe, it, expect } from 'vitest';
import { validateObjectSet, type ObjectDoc } from '../../src/validation/cloudValidator.js';

const table = (name: string, groups: string[]) => ({
  objectType: 'table',
  name,
  xml: `<AxTable><Name>${name}</Name><FieldGroups>${groups.map(g =>
    `<AxTableFieldGroup><Name>${g}</Name><Fields /></AxTableFieldGroup>`).join('')}</FieldGroups></AxTable>`,
});

const form = (name: string, dataSource: string, group: string) => ({
  objectType: 'form',
  name,
  xml: `<AxForm><Name>${name}</Name><AxFormControl i:type="AxFormGroupControl">
    <Name>Grid</Name><DataSource>${dataSource}</DataSource><DataGroup>${group}</DataGroup>
  </AxFormControl></AxForm>`,
});

const rules = (f: ReturnType<typeof validateObjectSet>) => f.map(x => x.rule);

describe('validateObjectSet', () => {
  it('catches a form binding a field group the table does not declare', () => {
    const docs: ObjectDoc[] = [
      table('Ex_Asset', ['AutoReport', 'AutoLookup']),
      form('Ex_Asset', 'Ex_Asset', 'Overview'),
    ];
    const f = validateObjectSet(docs);
    expect(rules(f)).toContain('datagroup-missing-on-table');
    // The message must point at the TABLE, since that is where the fix goes.
    expect(f[0].message).toMatch(/table 'Ex_Asset'.*no such group/s);
    expect(f[0].hint).toMatch(/wrong file/);
  });

  it('passes once the table declares the group', () => {
    const docs: ObjectDoc[] = [
      table('Ex_Asset', ['AutoReport', 'Overview']),
      form('Ex_Asset', 'Ex_Asset', 'Overview'),
    ];
    expect(validateObjectSet(docs)).toEqual([]);
  });

  it('is case-insensitive, as X++ identifiers are', () => {
    const docs: ObjectDoc[] = [
      table('Ex_Asset', ['overview']),
      form('Ex_Asset', 'ex_asset', 'Overview'),
    ];
    expect(validateObjectSet(docs)).toEqual([]);
  });

  it('says nothing when the table is not in the set', () => {
    // The table may already exist and be correct. Accusing it unseen would make
    // every finding suspect.
    expect(validateObjectSet([form('Ex_Asset', 'SomeExistingTable', 'Overview')])).toEqual([]);
  });

  it('ignores a DataGroup with no DataSource - that is the single-document rule', () => {
    const docs: ObjectDoc[] = [
      table('Ex_Asset', ['AutoReport']),
      { objectType: 'form', name: 'Ex_Asset', xml: `<AxForm><Name>Ex_Asset</Name><AxFormControl><Name>G</Name><DataGroup>Overview</DataGroup></AxFormControl></AxForm>` },
    ];
    expect(rules(validateObjectSet(docs))).not.toContain('datagroup-missing-on-table');
  });

  it('handles a set with no forms or no tables', () => {
    expect(validateObjectSet([table('Ex_Asset', ['Overview'])])).toEqual([]);
    expect(validateObjectSet([])).toEqual([]);
  });
});
