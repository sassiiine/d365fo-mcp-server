/**
 * Cloud validator rules.
 *
 * The positive cases are the ACTUAL XML shapes that shipped broken and were
 * reproduced on the VM, not invented examples - so a rule that stops catching
 * its defect fails here rather than silently in production. The negative cases
 * are the corrected shapes that compile clean.
 */
import { describe, it, expect } from 'vitest';
import { validateGeneratedXml, formatFindings } from '../../src/validation/cloudValidator.js';
import { StaticEdtTypes } from '../../src/validation/edtTypeLookup.js';

const edtTypes = new StaticEdtTypes({
  AmountMST: 'real',
  TransDate: 'date',
  Ex_V2_Country: 'string',
  Ex_V2_ReserveMinBalance: 'real',
  Name: 'string',
});

const table = (fields: string) =>
  `<?xml version="1.0" encoding="utf-8"?>
<AxTable xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
\t<Name>Ex_Demo</Name>
\t<Fields>${fields}</Fields>
</AxTable>`;

const field = (type: string, name: string, edt: string) =>
  `\n\t\t<AxTableField xmlns="" i:type="${type}">\n\t\t\t<Name>${name}</Name>\n\t\t\t<ExtendedDataType>${edt}</ExtendedDataType>\n\t\t</AxTableField>`;

const rules = (f: Awaited<ReturnType<typeof validateGeneratedXml>>) => f.map(x => x.rule);

describe('field type vs EDT base type', () => {
  it('catches a string field bound to a real EDT (Ex_V1_Amount / AmountMST)', async () => {
    const f = await validateGeneratedXml(
      table(field('AxTableFieldString', 'Ex_V1_Amount', 'AmountMST')), { edtTypes });
    expect(rules(f)).toContain('field-type-mismatches-edt');
    expect(f[0].message).toMatch(/AmountMST' is a real/);
    expect(f[0].hint).toMatch(/AxTableFieldReal/);
  });

  it('catches an int field bound to a string EDT (Country / Ex_V2_Country)', async () => {
    const f = await validateGeneratedXml(
      table(field('AxTableFieldInt', 'Country', 'Ex_V2_Country')), { edtTypes });
    expect(rules(f)).toContain('field-type-mismatches-edt');
  });

  it('catches a string field bound to a date EDT (Ex_V1_TransDate / TransDate)', async () => {
    const f = await validateGeneratedXml(
      table(field('AxTableFieldString', 'Ex_V1_TransDate', 'TransDate')), { edtTypes });
    expect(rules(f)).toContain('field-type-mismatches-edt');
  });

  it('passes the corrected forms of all of the above', async () => {
    const xml = table(
      field('AxTableFieldReal', 'Ex_V1_Amount', 'AmountMST') +
      field('AxTableFieldDate', 'Ex_V1_TransDate', 'TransDate') +
      field('AxTableFieldString', 'Country', 'Ex_V2_Country') +
      field('AxTableFieldReal', 'ReserveMinBalance', 'Ex_V2_ReserveMinBalance'),
    );
    expect(await validateGeneratedXml(xml, { edtTypes })).toEqual([]);
  });

  it('stays silent on an EDT it does not know rather than guessing', async () => {
    const f = await validateGeneratedXml(
      table(field('AxTableFieldString', 'Thing', 'SomeCustomerEdtWeHaveNeverSeen')), { edtTypes });
    expect(rules(f)).not.toContain('field-type-mismatches-edt');
  });

  it('does nothing when no EDT lookup is available (Neon unconfigured)', async () => {
    const f = await validateGeneratedXml(
      table(field('AxTableFieldString', 'Ex_V1_Amount', 'AmountMST')), { edtTypes: null });
    expect(rules(f)).not.toContain('field-type-mismatches-edt');
  });
});

describe('boolean properties', () => {
  it('catches <CreatedBy>true</CreatedBy>, the silent-corruption defect', async () => {
    const xml = `<AxTable><Name>Ex_Demo</Name><CreatedBy>true</CreatedBy></AxTable>`;
    const f = await validateGeneratedXml(xml, { edtTypes });
    expect(rules(f)).toContain('boolean-must-be-yes-no');
    expect(f[0].hint).toMatch(/<CreatedBy>Yes<\/CreatedBy>/);
  });

  it('accepts Yes/No', async () => {
    const xml = `<AxTable><Name>Ex_Demo</Name><CreatedBy>Yes</CreatedBy><ModifiedBy>No</ModifiedBy></AxTable>`;
    expect(await validateGeneratedXml(xml, { edtTypes })).toEqual([]);
  });

  it('does not trip on the i:nil="true" attribute, which is legitimate', async () => {
    const xml = `<AxTable><Name>Ex_Demo</Name><FormControlExtension i:nil="true" /></AxTable>`;
    expect(rules(await validateGeneratedXml(xml, { edtTypes }))).not.toContain('boolean-must-be-yes-no');
  });
});

describe('form DataGroup binding', () => {
  it('catches a DataGroup with no DataSource on the same control', async () => {
    const xml = `<AxForm><Name>Ex_Demo</Name><AxFormControl i:type="AxFormGroupControl">
      <Name>OverviewGroup</Name><DataGroup>Overview</DataGroup></AxFormControl></AxForm>`;
    const f = await validateGeneratedXml(xml, { edtTypes });
    expect(rules(f)).toContain('datagroup-without-datasource');
    expect(f[0].hint).toMatch(/does not exist/); // explains the misleading compiler error
  });

  it('accepts a DataGroup that has its DataSource', async () => {
    const xml = `<AxForm><Name>Ex_Demo</Name><AxFormControl i:type="AxFormGroupControl">
      <Name>OverviewGroup</Name><DataSource>Ex_Demo</DataSource><DataGroup>Overview</DataGroup></AxFormControl></AxForm>`;
    expect(rules(await validateGeneratedXml(xml, { edtTypes }))).not.toContain('datagroup-without-datasource');
  });
});

describe('structural rules', () => {
  it('flags truncated XML rather than letting it reach disk', async () => {
    const xml = `<AxTable><Name>Ex_Demo</Name><Fields><AxTableField`;
    expect(rules(await validateGeneratedXml(xml, { edtTypes }))).toContain('truncated-xml');
  });

  it('flags XML with no name', async () => {
    const xml = `<AxTable><Fields /></AxTable>`;
    expect(rules(await validateGeneratedXml(xml, { edtTypes }))).toContain('missing-object-name');
  });

  it('flags empty output', async () => {
    expect(rules(await validateGeneratedXml('   ', { edtTypes }))).toContain('empty-xml');
  });

  it('accepts a well-formed minimal object', async () => {
    const xml = `<AxEnum><Name>Ex_V3_DeployProofStatus</Name></AxEnum>`;
    expect(await validateGeneratedXml(xml, { edtTypes })).toEqual([]);
  });
});

describe('formatFindings', () => {
  it('renders nothing when there is nothing to say', () => {
    expect(formatFindings([])).toBe('');
  });

  it('counts errors and warnings separately', async () => {
    const f = await validateGeneratedXml(
      table(field('AxTableFieldString', 'Ex_V1_Amount', 'AmountMST')), { edtTypes });
    expect(formatFindings(f)).toMatch(/1 error\(s\), 0 warning\(s\)/);
  });
});
