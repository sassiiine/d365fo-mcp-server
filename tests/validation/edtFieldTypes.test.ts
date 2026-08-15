/**
 * Deriving a table field's element type from the EDT it binds.
 *
 * Regression cover for generator defect #3: fields bound to AmountMST (real) and
 * TransDate (date) were emitted as AxTableFieldString because the fallback
 * guessed from the EDT's NAME, which carries no type information. Those exact
 * two EDTs are the cases below.
 */
import { describe, it, expect } from 'vitest';
import { resolveFieldElementTypes } from '../../src/tools/xml/edtFieldTypes.js';
import { StaticEdtTypes } from '../../src/validation/edtTypeLookup.js';

const lookup = new StaticEdtTypes({
  AmountMST: 'real',
  TransDate: 'date',
  Name: 'string',
  NoYesId: 'enum',
  RecId: 'int64',
});

describe('resolveFieldElementTypes', () => {
  it('types a real EDT as AxTableFieldReal, not String', async () => {
    const [f] = await resolveFieldElementTypes([{ name: 'Amount', edt: 'AmountMST' }], lookup);
    expect(f.fieldType).toBe('AxTableFieldReal');
  });

  it('types a date EDT as AxTableFieldDate', async () => {
    const [f] = await resolveFieldElementTypes([{ name: 'TrDate', edt: 'TransDate' }], lookup);
    expect(f.fieldType).toBe('AxTableFieldDate');
  });

  it('honours the extendedDataType spelling, which used to be dropped', async () => {
    const [f] = await resolveFieldElementTypes(
      [{ name: 'Amount', extendedDataType: 'AmountMST' }], lookup);
    expect(f.fieldType).toBe('AxTableFieldReal');
  });

  it('maps the remaining base types', async () => {
    const out = await resolveFieldElementTypes([
      { name: 'A', edt: 'Name' },
      { name: 'B', edt: 'NoYesId' },
      { name: 'C', edt: 'RecId' },
    ], lookup);
    expect(out.map(f => f.fieldType)).toEqual([
      'AxTableFieldString', 'AxTableFieldEnum', 'AxTableFieldInt64',
    ]);
  });

  it('leaves an explicit fieldType alone', async () => {
    // An explicit request outranks inference; the validator still flags it if it
    // contradicts the EDT, which is the right division of labour.
    const [f] = await resolveFieldElementTypes(
      [{ name: 'Amount', edt: 'AmountMST', fieldType: 'AxTableFieldString' }], lookup);
    expect(f.fieldType).toBe('AxTableFieldString');
  });

  it('leaves an enum field alone - enumType is its own answer', async () => {
    const [f] = await resolveFieldElementTypes(
      [{ name: 'Status', enumType: 'Ex_V3_DeployProofStatus' }], lookup);
    expect(f.fieldType).toBeUndefined();
  });

  it('leaves a field bound to an unknown EDT untouched rather than guessing', async () => {
    const [f] = await resolveFieldElementTypes(
      [{ name: 'X', edt: 'SomeCustomerEdtCreatedThisSession' }], lookup);
    expect(f.fieldType).toBeUndefined();
  });

  it('is a no-op without a lookup, so an unconfigured server still generates', async () => {
    const input = [{ name: 'Amount', edt: 'AmountMST' }];
    expect(await resolveFieldElementTypes(input, null)).toBe(input);
  });

  it('does not mutate the caller\'s specs', async () => {
    const input = [{ name: 'Amount', edt: 'AmountMST' }];
    await resolveFieldElementTypes(input, lookup);
    expect(input[0]).not.toHaveProperty('fieldType');
  });
});
