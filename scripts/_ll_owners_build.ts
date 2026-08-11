/**
 * RMEX 2.0 Owners — full generation run. TEMP driver, safe to delete.
 *
 * Source: "RMEX 2.0 Owners.xlsx" (Downloads) — 37 rows.
 * Produces, in model Ex_Test1 / project Ex_LL_Test, all prefixed Ex_LL_:
 *   • label file Ex_LL_Owner with en-US + ar text for every label AND help text
 *   • 5 base enums
 *   • 37 EDTs (one per sheet row) with Label + HelpText in both languages
 *   • table Ex_LL_Owner with a field per EDT, field groups, unique index
 *   • DetailsMaster form Ex_LL_Owner
 *   • incremental build of Ex_Test1
 */
import { Client }               from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';

const SERVER = 'C:\\Users\\localadmin\\Documents\\New folder\\d365fo-mcp-server\\dist\\index.js';
const PROJECT_FOLDER = 'C:\\Repo\\Local-Sassine\\Projects\\Ex_LL_Test\\Ex_LL_Test';
const PROJECT_PATH = PROJECT_FOLDER + '\\Ex_LL_Test.rnrproj';
const MODEL = 'Ex_Test1';
const PKG = 'C:\\AOSService\\PackagesLocalDirectory';
const LF = 'Ex_LL_Owner';                 // label file id
const L = (id: string) => `@${LF}:${id}`; // label reference

// ─────────────────────────────────────────────────────────────────────────────
// The sheet, transcribed. `edt` is the name AFTER the Ex_ prefix the tool adds.
// ─────────────────────────────────────────────────────────────────────────────
type Row = {
  field: string;            // table field name
  edt: string;              // EDT name without the Ex_ prefix
  labelId: string;          // label id in Ex_LL_Owner
  en: string; ar: string;   // label text
  enH: string; arH: string; // help text
  type: 'String' | 'Date' | 'Real' | 'Enum';
  extends?: string;
  stringSize?: number;
  enumType?: string;        // base enum for custom enum EDTs / 'NoYes' via extends
  mandatory?: boolean;
};

const ROWS: Row[] = [
  { field: 'OwnerId', edt: 'LL_OwnerId', labelId: 'OwnerId', type: 'String', stringSize: 20, mandatory: true,
    en: 'Owner ID', ar: 'رقم المالك',
    enH: 'Unique owner code or reference. Can be generated automatically from a number sequence.',
    arH: 'رمز أو مرجع فريد للمالك. يمكن إنشاؤه تلقائياً من تسلسل أرقام.' },

  { field: 'VendorId', edt: 'LL_VendorId', labelId: 'VendorId', type: 'String', extends: 'VendAccount',
    en: 'Vendor ID', ar: 'رقم المورّد',
    enH: 'Link to the vendor master (payables). All disbursements route through this vendor record.',
    arH: 'الارتباط بسجل المورّد الرئيسي (الذمم الدائنة). تتم جميع المدفوعات من خلال سجل المورّد هذا.' },

  { field: 'OwnerType', edt: 'LL_OwnerType', labelId: 'OwnerType', type: 'Enum', enumType: 'Ex_LL_OwnerTypeEnum',
    en: 'Owner Type', ar: 'نوع المالك',
    enH: 'Individual, entity/company, or trust.',
    arH: 'فرد أو كيان/شركة أو صندوق ائتماني.' },

  { field: 'OwnerStatus', edt: 'LL_OwnerStatus', labelId: 'OwnerStatus', type: 'Enum', enumType: 'Ex_LL_OwnerStatusEnum',
    en: 'Owner Status', ar: 'حالة المالك',
    enH: 'Prospective, active, inactive, or offboarded.',
    arH: 'محتمل أو نشط أو غير نشط أو منتهي التعامل.' },

  { field: 'EffectiveFrom', edt: 'LL_EffectiveFromDate', labelId: 'EffectiveFrom', type: 'Date',
    en: 'Effective From Date', ar: 'تاريخ السريان من',
    enH: 'Date from which the owner is active in the system.',
    arH: 'التاريخ الذي يصبح فيه المالك نشطاً في النظام.' },

  { field: 'EffectiveTo', edt: 'LL_EffectiveToDate', labelId: 'EffectiveTo', type: 'Date',
    en: 'Effective To Date', ar: 'تاريخ السريان إلى',
    enH: 'Optional end date, for example when a property is sold or the relationship ends.',
    arH: 'تاريخ انتهاء اختياري، مثل بيع العقار أو انتهاء العلاقة.' },

  { field: 'FirstName', edt: 'LL_FirstName', labelId: 'FirstName', type: 'String', extends: 'Name',
    en: 'First Name', ar: 'الاسم الأول',
    enH: "First name of an individual owner. Required when the owner type is Individual.",
    arH: 'الاسم الأول للمالك الفرد. مطلوب عندما يكون نوع المالك فرداً.' },

  { field: 'LastName', edt: 'LL_LastName', labelId: 'LastName', type: 'String', extends: 'Name',
    en: 'Last Name', ar: 'اسم العائلة',
    enH: "Last name of an individual owner. Required when the owner type is Individual.",
    arH: 'اسم عائلة المالك الفرد. مطلوب عندما يكون نوع المالك فرداً.' },

  { field: 'DateOfBirth', edt: 'LL_DateOfBirth', labelId: 'DateOfBirth', type: 'Date',
    en: 'Date Of Birth', ar: 'تاريخ الميلاد',
    enH: "Date of birth of an individual owner, used for KYC checks.",
    arH: 'تاريخ ميلاد المالك الفرد، يُستخدم لإجراءات اعرف عميلك.' },

  { field: 'EntityName', edt: 'LL_EntityName', labelId: 'EntityName', type: 'String', extends: 'Name',
    en: 'Entity Name', ar: 'اسم الكيان',
    enH: 'Registered company or trust name. Required when the owner type is Entity.',
    arH: 'الاسم المسجّل للشركة أو الصندوق. مطلوب عندما يكون نوع المالك كياناً.' },

  { field: 'EntityType', edt: 'LL_EntityType', labelId: 'EntityType', type: 'String', stringSize: 20,
    en: 'Entity Type', ar: 'نوع الكيان',
    enH: 'LLC, corporation, trust, partnership, and similar legal forms.',
    arH: 'شركة ذات مسؤولية محدودة أو مساهمة أو صندوق ائتماني أو شراكة وما شابهها.' },

  { field: 'EntityRegistrationNo', edt: 'LL_EntityRegistrationNo', labelId: 'EntityRegistrationNo', type: 'String', stringSize: 40,
    en: 'Entity Registration No.', ar: 'رقم تسجيل الكيان',
    enH: 'Company or trust registration or license number.',
    arH: 'رقم تسجيل أو ترخيص الشركة أو الصندوق.' },

  { field: 'EntityRegCountry', edt: 'LL_EntityRegCountry', labelId: 'EntityRegCountry', type: 'String', extends: 'AddressCountryRegionId',
    en: 'Entity Registration Country', ar: 'بلد تسجيل الكيان',
    enH: 'Jurisdiction where the entity is registered.',
    arH: 'الجهة القضائية التي سُجّل فيها الكيان.' },

  { field: 'SignatoryName', edt: 'LL_SignatoryName', labelId: 'SignatoryName', type: 'String', extends: 'Name',
    en: 'Authorized Signatory Name', ar: 'اسم المفوّض بالتوقيع',
    enH: 'Name of the person authorized to sign on behalf of an entity owner.',
    arH: 'اسم الشخص المفوّض بالتوقيع نيابةً عن المالك الاعتباري.' },

  { field: 'SignatoryTitle', edt: 'LL_SignatoryTitle', labelId: 'SignatoryTitle', type: 'String', stringSize: 60,
    en: 'Authorized Signatory Title', ar: 'صفة المفوّض بالتوقيع',
    enH: 'Title or role of the authorized signatory.',
    arH: 'المسمى الوظيفي أو دور المفوّض بالتوقيع.' },

  { field: 'NationalIdNo', edt: 'LL_NationalIdNo', labelId: 'NationalIdNo', type: 'String', stringSize: 40,
    en: 'National ID / Passport No.', ar: 'رقم الهوية الوطنية / جواز السفر',
    enH: 'Identification number used for KYC checks.',
    arH: 'رقم الهوية المستخدم في إجراءات اعرف عميلك.' },

  { field: 'Nationality', edt: 'LL_Nationality', labelId: 'Nationality', type: 'String', extends: 'AddressCountryRegionId',
    en: 'Nationality', ar: 'الجنسية',
    enH: 'Nationality of the owner.',
    arH: 'جنسية المالك.' },

  { field: 'TaxIdType', edt: 'LL_TaxIdType', labelId: 'TaxIdType', type: 'Enum', enumType: 'Ex_LL_TaxIdTypeEnum',
    en: 'Tax ID Type', ar: 'نوع الرقم الضريبي',
    enH: 'Type of tax identifier, such as SSN, EIN, TRN, or ITIN.',
    arH: 'نوع المعرّف الضريبي، مثل SSN أو EIN أو TRN أو ITIN.' },

  { field: 'TaxId', edt: 'LL_TaxId', labelId: 'TaxId', type: 'String', stringSize: 40,
    en: 'Tax ID', ar: 'الرقم الضريبي',
    enH: 'Tax identification number. Stored encrypted or tokenized.',
    arH: 'رقم التعريف الضريبي. يُخزَّن مشفّراً أو مرمّزاً.' },

  { field: 'TaxFormOnFile', edt: 'LL_TaxFormOnFile', labelId: 'TaxFormOnFile', type: 'Enum', enumType: 'NoYes',
    en: 'Tax Form On File', ar: 'النموذج الضريبي محفوظ',
    enH: 'Indicates whether a W-9 or local equivalent has been submitted.',
    arH: 'يشير إلى ما إذا كان قد تم تقديم نموذج W-9 أو ما يعادله محلياً.' },

  { field: 'RequiresTaxReporting', edt: 'LL_RequiresTaxReporting', labelId: 'RequiresTaxReporting', type: 'Enum', enumType: 'NoYes',
    en: 'Requires Tax Reporting', ar: 'يتطلب إقراراً ضريبياً',
    enH: 'Indicates whether the owner requires annual tax reporting, for example a 1099.',
    arH: 'يشير إلى ما إذا كان المالك يتطلب إقراراً ضريبياً سنوياً، مثل نموذج 1099.' },

  { field: 'PrimaryEmail', edt: 'LL_PrimaryEmail', labelId: 'PrimaryEmail', type: 'String', extends: 'Email',
    en: 'Primary Email', ar: 'البريد الإلكتروني الأساسي',
    enH: 'Main contact email address.',
    arH: 'عنوان البريد الإلكتروني الرئيسي للتواصل.' },

  { field: 'PrimaryPhone', edt: 'LL_PrimaryPhone', labelId: 'PrimaryPhone', type: 'String', extends: 'Phone',
    en: 'Primary Phone', ar: 'الهاتف الأساسي',
    enH: 'Main contact phone number.',
    arH: 'رقم الهاتف الرئيسي للتواصل.' },

  { field: 'SecondaryPhone', edt: 'LL_SecondaryPhone', labelId: 'SecondaryPhone', type: 'String', extends: 'Phone',
    en: 'Secondary Phone', ar: 'الهاتف الثانوي',
    enH: 'Alternate phone number.',
    arH: 'رقم هاتف بديل.' },

  { field: 'ContactMethod', edt: 'LL_ContactMethod', labelId: 'ContactMethod', type: 'Enum', enumType: 'Ex_LL_ContactMethodEnum',
    en: 'Preferred Contact Method', ar: 'طريقة التواصل المفضلة',
    enH: 'Email, phone, mail, or portal.',
    arH: 'البريد الإلكتروني أو الهاتف أو البريد العادي أو البوابة.' },

  { field: 'PreferredLanguage', edt: 'LL_PreferredLanguage', labelId: 'PreferredLanguage', type: 'String', extends: 'LanguageId',
    en: 'Preferred Language', ar: 'اللغة المفضلة',
    enH: 'Language the owner prefers for communication.',
    arH: 'اللغة التي يفضّلها المالك في المراسلات.' },

  { field: 'MailingAddress', edt: 'LL_MailingAddress', labelId: 'MailingAddress', type: 'String', extends: 'LogisticsAddressing',
    en: 'Mailing Address', ar: 'العنوان البريدي',
    enH: 'Full mailing address, used for statements and physical checks.',
    arH: 'العنوان البريدي الكامل، يُستخدم لكشوف الحساب والشيكات الورقية.' },

  { field: 'Country', edt: 'LL_Country', labelId: 'Country', type: 'String', extends: 'AddressCountryRegionId',
    en: 'Country', ar: 'البلد',
    enH: 'Country of the mailing address.',
    arH: 'بلد العنوان البريدي.' },

  { field: 'PaymentMethod', edt: 'LL_PaymentMethod', labelId: 'PaymentMethod', type: 'String', extends: 'VendPaymMode',
    en: 'Preferred Payment Method', ar: 'طريقة الدفع المفضلة',
    enH: 'Bank transfer, check, or wire.',
    arH: 'حوالة مصرفية أو شيك أو تحويل بنكي.' },

  { field: 'BankAccountRef', edt: 'LL_BankAccountRef', labelId: 'BankAccountRef', type: 'String', extends: 'VendBankAccountId',
    en: 'Bank Account Reference', ar: 'مرجع الحساب البنكي',
    enH: 'Usually inherited from the linked vendor record; can be referenced directly when needed.',
    arH: 'يُورَث عادةً من سجل المورّد المرتبط؛ ويمكن الإشارة إليه مباشرةً عند الحاجة.' },

  { field: 'DisbFrequency', edt: 'LL_DisbFrequency', labelId: 'DisbFrequency', type: 'Enum', enumType: 'Ex_LL_DisbFrequencyEnum',
    en: 'Disbursement Frequency', ar: 'تكرار الصرف',
    enH: 'Monthly, quarterly, on collection, or manual.',
    arH: 'شهري أو ربع سنوي أو عند التحصيل أو يدوي.' },

  { field: 'ReserveMinBalance', edt: 'LL_ReserveMinBalance', labelId: 'ReserveMinBalance', type: 'Real', extends: 'AmountCur',
    en: 'Reserve Minimum Balance', ar: 'الحد الأدنى للرصيد الاحتياطي',
    enH: 'Minimum balance retained per property before funds are disbursed to the owner.',
    arH: 'الحد الأدنى للرصيد المحتفظ به لكل عقار قبل صرف الأموال إلى المالك.' },

  { field: 'DisbursementHold', edt: 'LL_DisbursementHold', labelId: 'DisbursementHold', type: 'Enum', enumType: 'NoYes',
    en: 'Disbursement Hold', ar: 'إيقاف الصرف',
    enH: 'Freezes payouts, for example during a dispute.',
    arH: 'يوقف عمليات الصرف، على سبيل المثال أثناء وجود نزاع.' },

  { field: 'Currency', edt: 'LL_Currency', labelId: 'Currency', type: 'String', extends: 'CurrencyCode',
    en: 'Currency', ar: 'العملة',
    enH: 'Default disbursement currency.',
    arH: 'عملة الصرف الافتراضية.' },

  { field: 'TaxApplicable', edt: 'LL_TaxApplicable', labelId: 'TaxApplicable', type: 'Enum', enumType: 'NoYes',
    en: 'Tax Applicable', ar: 'الضريبة مطبّقة',
    enH: 'Indicates whether tax or withholding applies to disbursements.',
    arH: 'يشير إلى ما إذا كانت الضريبة أو الاستقطاع تنطبق على عمليات الصرف.' },

  { field: 'TaxGroupId', edt: 'LL_TaxGroupId', labelId: 'TaxGroupId', type: 'String', extends: 'TaxGroup',
    en: 'Tax Group / Withholding Tax Group', ar: 'المجموعة الضريبية / مجموعة ضريبة الاستقطاع',
    enH: 'Tax or withholding setup applied to disbursements.',
    arH: 'إعداد الضريبة أو الاستقطاع المطبّق على عمليات الصرف.' },

  { field: 'Notes', edt: 'LL_OwnerNotes', labelId: 'OwnerNotes', type: 'String', extends: 'Notes',
    en: 'Notes / Remarks', ar: 'ملاحظات',
    enH: 'General comments.',
    arH: 'تعليقات عامة.' },
];

// ── base enums ──────────────────────────────────────────────────────────────
type EnumDef = { name: string; labelId: string; values: Array<{ name: string; id: string; en: string; ar: string }> };
const ENUMS: EnumDef[] = [
  { name: 'LL_OwnerTypeEnum', labelId: 'OwnerType', values: [
    { name: 'Individual', id: 'OwnerTypeIndividual', en: 'Individual',      ar: 'فرد' },
    { name: 'Entity',     id: 'OwnerTypeEntity',     en: 'Entity / Company', ar: 'كيان / شركة' },
    { name: 'Trust',      id: 'OwnerTypeTrust',      en: 'Trust',            ar: 'صندوق ائتماني' },
  ] },
  { name: 'LL_OwnerStatusEnum', labelId: 'OwnerStatus', values: [
    { name: 'Prospective', id: 'OwnerStatusProspective', en: 'Prospective', ar: 'محتمل' },
    { name: 'Active',      id: 'OwnerStatusActive',      en: 'Active',      ar: 'نشط' },
    { name: 'Inactive',    id: 'OwnerStatusInactive',    en: 'Inactive',    ar: 'غير نشط' },
    { name: 'Offboarded',  id: 'OwnerStatusOffboarded',  en: 'Offboarded',  ar: 'منتهي التعامل' },
  ] },
  { name: 'LL_TaxIdTypeEnum', labelId: 'TaxIdType', values: [
    { name: 'SSN',   id: 'TaxIdTypeSSN',   en: 'SSN',   ar: 'SSN' },
    { name: 'EIN',   id: 'TaxIdTypeEIN',   en: 'EIN',   ar: 'EIN' },
    { name: 'TRN',   id: 'TaxIdTypeTRN',   en: 'TRN',   ar: 'TRN' },
    { name: 'ITIN',  id: 'TaxIdTypeITIN',  en: 'ITIN',  ar: 'ITIN' },
    { name: 'Other', id: 'TaxIdTypeOther', en: 'Other', ar: 'أخرى' },
  ] },
  { name: 'LL_ContactMethodEnum', labelId: 'ContactMethod', values: [
    { name: 'Email',  id: 'ContactMethodEmail',  en: 'Email',  ar: 'البريد الإلكتروني' },
    { name: 'Phone',  id: 'ContactMethodPhone',  en: 'Phone',  ar: 'الهاتف' },
    { name: 'Mail',   id: 'ContactMethodMail',   en: 'Mail',   ar: 'البريد العادي' },
    { name: 'Portal', id: 'ContactMethodPortal', en: 'Portal', ar: 'البوابة' },
  ] },
  { name: 'LL_DisbFrequencyEnum', labelId: 'DisbFrequency', values: [
    { name: 'Monthly',      id: 'DisbFreqMonthly',   en: 'Monthly',       ar: 'شهري' },
    { name: 'Quarterly',    id: 'DisbFreqQuarterly', en: 'Quarterly',     ar: 'ربع سنوي' },
    { name: 'OnCollection', id: 'DisbFreqOnColl',    en: 'On Collection', ar: 'عند التحصيل' },
    { name: 'Manual',       id: 'DisbFreqManual',    en: 'Manual',        ar: 'يدوي' },
  ] },
];

// ── field groups (drive the form FastTabs) ──────────────────────────────────
const GROUPS: Array<{ name: string; id: string; en: string; ar: string; fields: string[] }> = [
  { name: 'Overview', id: 'GrpOverview', en: 'Overview', ar: 'نظرة عامة',
    fields: ['OwnerId', 'OwnerType', 'EntityName', 'OwnerStatus', 'VendorId'] },
  { name: 'Identification', id: 'GrpIdentification', en: 'Identification', ar: 'التعريف',
    fields: ['OwnerType', 'FirstName', 'LastName', 'DateOfBirth', 'EntityName', 'EntityType',
             'EntityRegistrationNo', 'EntityRegCountry', 'SignatoryName', 'SignatoryTitle',
             'NationalIdNo', 'Nationality'] },
  { name: 'Contact', id: 'GrpContact', en: 'Contact', ar: 'بيانات التواصل',
    fields: ['PrimaryEmail', 'PrimaryPhone', 'SecondaryPhone', 'ContactMethod',
             'PreferredLanguage', 'MailingAddress', 'Country'] },
  { name: 'TaxInfo', id: 'GrpTax', en: 'Tax', ar: 'الضرائب',
    fields: ['TaxIdType', 'TaxId', 'TaxFormOnFile', 'RequiresTaxReporting', 'TaxApplicable', 'TaxGroupId'] },
  { name: 'Disbursement', id: 'GrpDisbursement', en: 'Disbursement', ar: 'الصرف',
    fields: ['PaymentMethod', 'BankAccountRef', 'DisbFrequency', 'ReserveMinBalance',
             'DisbursementHold', 'Currency'] },
  { name: 'Validity', id: 'GrpValidity', en: 'Status', ar: 'الحالة',
    fields: ['OwnerStatus', 'EffectiveFrom', 'EffectiveTo'] },
  { name: 'Remarks', id: 'GrpRemarks', en: 'Remarks', ar: 'ملاحظات',
    fields: ['Notes'] },
];

// ─────────────────────────────────────────────────────────────────────────────
const toFileUri = (p: string) => 'file:///' + p.replace(/\\/g, '/');
const transport = new StdioClientTransport({
  command: 'node',
  args: [SERVER],
  env: { ...(process.env as Record<string, string>), MCP_SERVER_MODE: 'full', DEBUG_LOGGING: 'false' },
  stderr: 'pipe',
});
transport.stderr?.on('data', (c: Buffer) => process.stderr.write(c));

const client = new Client({ name: 'owners-build', version: '1.0.0' }, { capabilities: { roots: { listChanged: true } } });
client.setRequestHandler(ListRootsRequestSchema, async () => ({
  roots: [{ uri: toFileUri(PROJECT_FOLDER), name: PROJECT_FOLDER }],
}));

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const textOf = (r: any) => (r.content as Array<{ type: string; text: string }>).filter(c => c.type === 'text').map(c => c.text).join('\n');

const failures: string[] = [];
async function call(step: string, name: string, args: any, quiet = false) {
  let r: { isError: boolean; text: string };
  try {
    const raw: any = await client.callTool({ name, arguments: args });
    r = { isError: !!raw.isError, text: textOf(raw) };
  } catch (e: any) {
    r = { isError: true, text: 'THROW: ' + (e?.message ?? String(e)) };
  }
  const head = r.text.split('\n').slice(0, quiet ? 2 : 12).join('\n');
  if (r.isError) failures.push(`${step} :: ${r.text.split('\n').slice(0, 3).join(' | ')}`);
  console.log(`${r.isError ? '❌' : '✅'} ${step}${quiet && !r.isError ? '' : '\n' + head}`);
  return r;
}
function banner(t: string) { console.log('\n' + '='.repeat(72) + '\n  ' + t + '\n' + '='.repeat(72)); }

/** Re-runnable: create refuses to overwrite, so skip anything already on disk. */
const aotPath = (axFolder: string, name: string) => `${PKG}\\${MODEL}\\${MODEL}\\${axFolder}\\${name}.xml`;
const exists = (axFolder: string, name: string) => fs.existsSync(aotPath(axFolder, name));

const common = { modelName: MODEL, packagePath: PKG, projectPath: PROJECT_PATH, solutionPath: PROJECT_FOLDER };
const labelCommon = {
  action: 'create', labelFileId: LF, model: MODEL, packagePath: PKG,
  projectPath: PROJECT_PATH, solutionPath: PROJECT_FOLDER,
  createLabelFileIfMissing: true, languages: ['en-US', 'ar'], description: 'RMEX 2.0 Owners',
};
const tr = (en: string, ar: string) => [
  { language: 'en-US', text: en },
  { language: 'ar', text: ar },
];

async function main() {
  console.log('Connecting (full mode)…');
  await client.connect(transport);
  console.log('Connected. Warming up bridge (25s)…');
  await wait(25000);

  // Drop anything an earlier run generated WRONG so it is rebuilt correctly:
  //  • enum EDTs that only <Extends>NoYesId</Extends> — xppc cannot resolve the
  //    underlying type; shipped enum EDTs name <EnumType> directly.
  //  • forms the C# bridge wrote as an empty shell (no classDeclaration).
  for (const r of ROWS) {
    const p = aotPath('AxEdt', `Ex_${r.edt}`);
    if (r.type === 'Enum' && fs.existsSync(p) && !fs.readFileSync(p, 'utf-8').includes('<EnumType>')) {
      fs.unlinkSync(p); console.log(`🧹 removed malformed enum EDT Ex_${r.edt}`);
    }
  }
  const formPath = aotPath('AxForm', 'Ex_LL_Owner');
  if (fs.existsSync(formPath) && !fs.readFileSync(formPath, 'utf-8').includes('classDeclaration')) {
    fs.unlinkSync(formPath); console.log('🧹 removed empty bridge-generated form Ex_LL_Owner');
  }
  // …and a table whose custom field groups / indexes were lost when the bridge
  // create threw on the index shape and the run silently fell back to XML.
  const tablePath = aotPath('AxTable', 'Ex_LL_Owner');
  if (fs.existsSync(tablePath) && !fs.readFileSync(tablePath, 'utf-8').includes('<Name>Overview</Name>')) {
    fs.unlinkSync(tablePath); console.log('🧹 removed table Ex_LL_Owner (field groups + indexes missing)');
  }

  // ── PHASE 1: labels ───────────────────────────────────────────────────────
  banner('PHASE 1 — labels (en-US + ar)');
  const labelEntries: Array<{ labelId: string; translations: any }> = [];
  labelEntries.push({ labelId: 'OwnerTable', translations: tr('Owners', 'الملاك') });
  labelEntries.push({ labelId: 'OwnerTableHelp', translations: tr(
    'Master record for property owners in RMEX 2.0.',
    'السجل الرئيسي لمُلاك العقارات في RMEX 2.0.') });
  for (const r of ROWS) {
    labelEntries.push({ labelId: r.labelId, translations: tr(r.en, r.ar) });
    labelEntries.push({ labelId: r.labelId + 'Help', translations: tr(r.enH, r.arH) });
  }
  for (const e of ENUMS) for (const v of e.values) {
    labelEntries.push({ labelId: v.id, translations: tr(v.en, v.ar) });
  }
  for (const g of GROUPS) labelEntries.push({ labelId: g.id, translations: tr(g.en, g.ar) });

  if (process.env.LL_SKIP_LABELS) {
    console.log('(skipped — LL_SKIP_LABELS set; labels already written)');
  } else {
    for (let i = 0; i < labelEntries.length; i += 25) {
      const batch = labelEntries.slice(i, i + 25);
      await call(`labels batch ${i / 25 + 1} (${batch.length})`, 'labels', { ...labelCommon, labels: batch }, true);
    }
  }

  // ── PHASE 2: base enums ───────────────────────────────────────────────────
  banner('PHASE 2 — base enums');
  for (const e of ENUMS) {
    if (exists('AxEnum', `Ex_${e.name}`)) { console.log(`⏭️  enum Ex_${e.name} (exists)`); continue; }
    await call(`enum Ex_${e.name}`, 'd365fo_file', {
      action: 'create', objectType: 'enum', objectName: e.name, ...common,
      properties: {
        label: L(e.labelId),
        helpText: L(e.labelId + 'Help'),
        enumValues: e.values.map((v, idx) => ({ name: v.name, value: idx, label: L(v.id) })),
      },
    }, true);
  }

  // ── PHASE 3: EDTs ─────────────────────────────────────────────────────────
  banner('PHASE 3 — EDTs');
  for (const r of ROWS) {
    if (exists('AxEdt', `Ex_${r.edt}`)) { console.log(`⏭️  edt Ex_${r.edt} (exists)`); continue; }
    const props: Record<string, unknown> = {
      edtType: r.type === 'Real' ? 'Real' : r.type,   // String | Date | Real | Enum
      label: L(r.labelId),
      helpText: L(r.labelId + 'Help'),
    };
    if (r.extends) props.extends = r.extends;
    else if (r.type === 'String') props.stringSize = r.stringSize ?? 30;
    // Only enum EDTs that do NOT inherit their base enum need an explicit EnumType.
    if (r.type === 'Enum' && !r.extends) props.enumType = r.enumType;

    await call(`edt Ex_${r.edt}`, 'd365fo_file', {
      action: 'create', objectType: 'edt', objectName: r.edt, ...common, properties: props,
    }, true);
  }

  // ── PHASE 4: table ────────────────────────────────────────────────────────
  banner('PHASE 4 — table Ex_LL_Owner');
  const tableFields = ROWS.map(r => ({
    name: r.field,
    type: r.type,
    edt: `Ex_${r.edt}`,
    ...(r.type === 'Enum' ? { enumType: r.enumType } : {}),
    ...(r.mandatory ? { mandatory: true } : {}),
  }));

  if (exists('AxTable', 'Ex_LL_Owner')) console.log('⏭️  table Ex_LL_Owner (exists)');
  else await call('table Ex_LL_Owner', 'd365fo_file', {
    action: 'create', objectType: 'table', objectName: 'LL_Owner', ...common,
    properties: {
      label: L('OwnerTable'),
      developerDocumentation: L('OwnerTableHelp'),  // AxTable has no HelpText property
      tableGroup: 'Main',
      titleField1: 'OwnerId',
      titleField2: 'EntityName',
      cacheLookup: 'Found',
      fields: tableFields,
      fieldGroups: GROUPS.map(g => ({ name: g.name, label: L(g.id), fields: g.fields })),
      indexes: [{ name: 'OwnerIdIdx', fields: [{ fieldName: 'OwnerId' }], allowDuplicates: false, alternateKey: true }],
    },
  });

  // ── PHASE 5: form ─────────────────────────────────────────────────────────
  banner('PHASE 5 — DetailsMaster form Ex_LL_Owner');
  if (exists('AxForm', 'Ex_LL_Owner')) console.log('⏭️  form Ex_LL_Owner (exists)');
  else await call('form Ex_LL_Owner', 'd365fo_file', {
    action: 'create', objectType: 'form', objectName: 'LL_Owner', ...common,
    properties: {
      pattern: 'DetailsMaster',
      caption: L('OwnerTable'),
      dataSource: 'Ex_LL_Owner',
      dataSourceTable: 'Ex_LL_Owner',
      gridFields: ROWS.map(r => r.field),
      fieldTypes: tableFields,
    },
  });

  // ── PHASE 6: build ────────────────────────────────────────────────────────
  banner('PHASE 6 — build Ex_Test1');
  let b = await call('build', 'build_d365fo_project', { modelName: MODEL, wait: true, waitTimeoutMs: 900000 });
  for (let i = 0; i < 12 && /still running/i.test(b.text); i++) {
    await wait(20000);
    b = await call(`build poll ${i + 1}`, 'build_d365fo_project', { modelName: MODEL, wait: true, waitTimeoutMs: 900000 });
  }
  console.log('\n----- FULL BUILD OUTPUT -----\n' + b.text);

  banner('SUMMARY');
  console.log(failures.length === 0 ? '✅ no tool-level failures' : `❌ ${failures.length} failures:\n` + failures.join('\n'));

  await client.close();
  process.exit(0);
}

main().catch((err) => { console.error('DRIVER FATAL:', err); process.exit(1); });
