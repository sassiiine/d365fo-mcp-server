/**
 * Server-side validation of generated AOT XML.
 *
 * Runs in the cloud, before XML is handed to the customer's agent, so a defect
 * is caught in the second it takes to check rather than after a file is written,
 * a project is built, and a compiler reports something several steps removed
 * from the cause.
 *
 * Every rule here is derived from a defect that actually shipped and was
 * reproduced - not from a style guide. Each carries the evidence in its comment.
 *
 * The rules are also the part of the product that cannot be copied by reading:
 * get_knowledge hands over text, which is the same asset after one request as it
 * was before. A rule that EXECUTES against a 1.15M-symbol index is only useful
 * where the index is.
 */

export type Severity = 'error' | 'warning';

export interface ValidationFinding {
  severity: Severity;
  /** Stable kebab-case id, safe to key metrics off. */
  rule: string;
  message: string;
  /** What to do about it. */
  hint?: string;
  /** Object/element path, when the rule can place it. */
  location?: string;
}

export interface ValidationContext {
  objectType?: string;
  /** Absent when Neon is unconfigured; rules needing it then stay silent. */
  edtTypes?: import('./edtTypeLookup.js').EdtTypeLookup | null;
}

/**
 * `i:type="AxTableFieldString"` -> `string`. The suffix is the field's storage
 * type and must agree with the base type of the EDT the field binds.
 */
const FIELD_ELEMENT_TO_BASE: Record<string, string> = {
  axtablefieldstring: 'string',
  axtablefieldreal: 'real',
  axtablefieldint: 'int',
  axtablefieldint64: 'int64',
  axtablefielddate: 'date',
  axtablefieldenum: 'enum',
  axtablefieldutcdatetime: 'utcdatetime',
  axtablefieldguid: 'guid',
  axtablefieldcontainer: 'container',
  axtablefieldtime: 'time',
};

/** The `AxTableField` blocks of a table XML, with their element type and EDT. */
interface ParsedField {
  name: string;
  elementType: string;
  edt: string | null;
  enumType: string | null;
}

function parseTableFields(xml: string): ParsedField[] {
  const out: ParsedField[] = [];
  // Deliberately regex rather than a DOM parse: this runs on generated XML that
  // may be malformed (that is part of what is being checked), and a parser that
  // throws on the first defect reports one problem where the caller wants all of
  // them. The shape is machine-generated and regular.
  const blocks = xml.matchAll(/<AxTableField\b([^>]*)>([\s\S]*?)<\/AxTableField>/gi);
  for (const b of blocks) {
    const attrs = b[1];
    const body = b[2];
    const elementType = /i:type\s*=\s*"([^"]+)"/i.exec(attrs)?.[1] ?? '';
    out.push({
      name: /<Name>([^<]*)<\/Name>/i.exec(body)?.[1]?.trim() ?? '(unnamed)',
      elementType,
      edt: /<ExtendedDataType>([^<]*)<\/ExtendedDataType>/i.exec(body)?.[1]?.trim() ?? null,
      enumType: /<EnumType>([^<]*)<\/EnumType>/i.exec(body)?.[1]?.trim() ?? null,
    });
  }
  return out;
}

/**
 * A table field's element type must match the base type of the EDT it binds.
 *
 * Evidence: Ex_V2_OwnerListTmp.Country was AxTableFieldInt bound to an
 * AxEdtString EDT, and Ex_V1_DemoTable.Ex_V1_Amount was AxTableFieldString bound
 * to AmountMST (real). Both compiled to "Data type mismatch" from xppc with no
 * indication of which side was wrong, and both sat broken in the model for weeks.
 */
async function ruleFieldTypeMatchesEdt(
  xml: string,
  ctx: ValidationContext,
): Promise<ValidationFinding[]> {
  if (!ctx.edtTypes) return [];
  const findings: ValidationFinding[] = [];
  for (const f of parseTableFields(xml)) {
    if (!f.edt) continue;
    const declared = FIELD_ELEMENT_TO_BASE[f.elementType.toLowerCase()];
    if (!declared) continue; // unrecognised element type - not this rule's business
    const actual = await ctx.edtTypes.baseTypeOf(f.edt);
    if (!actual) continue; // unknown EDT: silence beats a false accusation
    if (actual !== declared) {
      findings.push({
        severity: 'error',
        rule: 'field-type-mismatches-edt',
        location: `Fields/${f.name}`,
        message:
          `Field '${f.name}' is declared i:type="${f.elementType}" (${declared}) but its ` +
          `ExtendedDataType '${f.edt}' is a ${actual}.`,
        hint: `Change the field element to AxTableField${actual[0].toUpperCase()}${actual.slice(1)}, or bind a ${declared} EDT.`,
      });
    }
  }
  return findings;
}

/**
 * AOT metadata booleans are Yes/No, never true/false.
 *
 * Evidence: table creation emitted <CreatedBy>true</CreatedBy>. The AxTable XML
 * then could not be deserialised by IMetadataProvider, so every later modify on
 * that table failed - silent corruption at create time, surfacing much later as
 * an unrelated-looking failure. Verified against 30 Microsoft AxTable files:
 * zero literal true/false element values; the convention is <ModifiedBy>Yes</…>.
 */
function ruleBooleanYesNo(xml: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  for (const m of xml.matchAll(/<([A-Za-z0-9_]+)>(true|false)<\/\1>/g)) {
    findings.push({
      severity: 'error',
      rule: 'boolean-must-be-yes-no',
      location: m[1],
      message: `<${m[1]}> is '${m[2]}'. AOT metadata booleans are Yes/No.`,
      hint: `Write <${m[1]}>${m[2] === 'true' ? 'Yes' : 'No'}</${m[1]}>. XML that uses true/false cannot be deserialised by IMetadataProvider, which breaks every later modify on the object.`,
    });
  }
  return findings;
}

/**
 * A control bound to a table field group via <DataGroup> needs a <DataSource> on
 * the same control for the group to resolve.
 *
 * Evidence: Ex_LL_Owner had <DataGroup>Overview</DataGroup> on a group with no
 * DataSource. The field group existed on the table, but the compiler reported
 * "Field group 'Overview' does not exist" - an error that points at the group
 * rather than at the missing binding, and sends you looking in the wrong file.
 */
function ruleDataGroupNeedsDataSource(xml: string): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  for (const c of xml.matchAll(/<AxFormControl\b[^>]*>([\s\S]*?)<\/AxFormControl>/gi)) {
    const body = c[1];
    const group = /<DataGroup>([^<]+)<\/DataGroup>/i.exec(body);
    if (!group) continue;
    // Only this control's own DataSource counts; a nested child's does not bind
    // the group. Cut the body at the first nested control.
    const own = body.split(/<AxFormControl\b/i)[0];
    if (!/<DataSource>[^<]+<\/DataSource>/i.test(own)) {
      const name = /<Name>([^<]*)<\/Name>/i.exec(own)?.[1]?.trim() ?? '(unnamed)';
      findings.push({
        severity: 'error',
        rule: 'datagroup-without-datasource',
        location: name,
        message: `Control '${name}' binds field group '${group[1]}' via <DataGroup> but declares no <DataSource>.`,
        hint: `Add <DataSource> naming the form data source, or drop the <DataGroup> if the control lists its fields explicitly. The compiler reports this as "Field group '${group[1]}' does not exist", which is misleading.`,
      });
    }
  }
  return findings;
}

/**
 * Every AOT object XML must name itself.
 *
 * Cheap, and it catches a whole class of template-substitution failures where a
 * placeholder was never replaced - which otherwise reaches the compiler as a
 * confusing structural error.
 */
function ruleHasName(xml: string, ctx: ValidationContext): ValidationFinding[] {
  const name = /<Name>([^<]*)<\/Name>/i.exec(xml)?.[1]?.trim();
  if (name) return [];
  return [{
    severity: 'error',
    rule: 'missing-object-name',
    message: `Generated ${ctx.objectType ?? 'object'} XML has no <Name> element.`,
    hint: 'The object cannot be written or compiled without a name.',
  }];
}

/**
 * Well-formedness, to the extent that matters here: the root element must close.
 *
 * A truncated generation (token limit, interrupted stream) produces XML that
 * looks fine until the compiler rejects it, and the agent will happily write a
 * half file to disk.
 */
function ruleRootElementCloses(xml: string): ValidationFinding[] {
  const root = /<(Ax[A-Za-z0-9_]+)\b/.exec(xml)?.[1];
  if (!root) {
    return [{
      severity: 'error',
      rule: 'not-aot-xml',
      message: 'No AOT root element (expected something like <AxTable>, <AxClass>, <AxForm>).',
    }];
  }
  if (!new RegExp(`</${root}>\\s*$`).test(xml.trim())) {
    return [{
      severity: 'error',
      rule: 'truncated-xml',
      message: `XML does not end with </${root}> - it looks truncated.`,
      hint: 'Regenerate. Writing this to disk produces a file the compiler cannot parse.',
    }];
  }
  return [];
}

/**
 * Validate generated AOT XML. Returns findings, most severe first; empty means
 * nothing known to be wrong (NOT a proof of correctness).
 */
export async function validateGeneratedXml(
  xml: string,
  ctx: ValidationContext = {},
): Promise<ValidationFinding[]> {
  if (!xml || !xml.trim()) {
    return [{ severity: 'error', rule: 'empty-xml', message: 'No XML was generated.' }];
  }

  const findings: ValidationFinding[] = [
    ...ruleRootElementCloses(xml),
    ...ruleHasName(xml, ctx),
    ...ruleBooleanYesNo(xml),
    ...ruleDataGroupNeedsDataSource(xml),
    ...(await ruleFieldTypeMatchesEdt(xml, ctx)),
  ];

  return findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));
}

/** Render findings for a tool response. Empty string when there are none. */
export function formatFindings(findings: ValidationFinding[]): string {
  if (findings.length === 0) return '';
  const errors = findings.filter(f => f.severity === 'error').length;
  const warnings = findings.length - errors;
  const head = `⚠️ Cloud validation: ${errors} error(s), ${warnings} warning(s)`;
  const body = findings.map((f, i) => {
    const icon = f.severity === 'error' ? '🔴' : '🟡';
    const where = f.location ? ` [${f.location}]` : '';
    return `${i + 1}. ${icon} ${f.rule}${where}: ${f.message}${f.hint ? `\n   💡 ${f.hint}` : ''}`;
  }).join('\n');
  return `${head}\n\n${body}`;
}
