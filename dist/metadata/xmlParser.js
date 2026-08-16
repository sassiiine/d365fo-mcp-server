/**
 * X++ Metadata XML Parser
 * Parses D365 F&O AOT XML files (AxClass, AxTable, etc.)
 */
import * as fs from 'fs/promises';
import { Parser } from '../utils/xml.js';
import { EnhancedXppParser } from './enhancedParser.js';
import { walkFormDesign, collectPatternNodes } from './formPatternMiner.js';
import { parseXppDeclaration, parseXppClassHeader, parseExtensionOfAttribute, callsNext, visibilityFromModifiers, } from './xppDeclaration.js';
/**
 * Classify the methods of an extension into added / CoC-wrapping / event-
 * subscribing. Shared by parseExtensionFile (Ax*Extension XML) and the class
 * extension path in extract-metadata, which reach the same X++ from different
 * XML shapes and must classify it identically.
 */
export function extensionMembersFrom(methods) {
    const addedMethods = [];
    const cocMethods = [];
    const eventSubscriptions = [];
    for (const { name, source } of methods) {
        if (!name)
            continue;
        addedMethods.push(name);
        if (callsNext(source || ''))
            cocMethods.push(name);
        if (/\[SubscribesTo\s*\(/i.test(source || '')) {
            eventSubscriptions.push(source.match(/\[SubscribesTo\s*\([^)]+\)/)?.[0] || name);
        }
    }
    return { addedMethods, cocMethods, eventSubscriptions };
}
/**
 * Build the class-extension record for an AxClass carrying [ExtensionOf(...)],
 * or null when the class is not an extension.
 *
 * The AOT has no AxClassExtension artifact — class extensions are ordinary
 * AxClass files — so these records are the only source of class-extension rows
 * in symbols/extension_metadata. Extraction writes them into the
 * `class-extensions/` folder symbolIndex.indexExtensions already reads, in the
 * shape parseExtensionFile emits for the other extension kinds (#693).
 */
export function buildClassExtensionRecord(classInfo, model) {
    if (!classInfo.extensionOf)
        return null;
    const { baseObjectName, baseKind, memberName } = classInfo.extensionOf;
    return {
        name: classInfo.name,
        baseObjectName,
        baseKind,
        ...(memberName ? { baseMemberName: memberName } : {}),
        sourcePath: classInfo.sourcePath,
        addedFields: [],
        addedIndexes: [],
        ...extensionMembersFrom(classInfo.methods),
        model,
        type: 'class-extension',
    };
}
export class XppMetadataParser {
    enhancedParser;
    get parser() {
        return new Parser({
            explicitArray: false,
            mergeAttrs: true,
            trim: true,
        });
    }
    constructor() {
        this.enhancedParser = new EnhancedXppParser();
    }
    /**
     * Parse an X++ class file (AxClass XML)
     */
    async parseClassFile(filePath, model) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            if (!parsed.AxClass) {
                return { success: false, error: 'Not a valid AxClass file' };
            }
            const axClass = parsed.AxClass;
            const className = axClass.Name || 'UnknownClass';
            // Methods are nested in SourceCode.Methods.Method
            const methodsData = axClass.SourceCode?.Methods?.Method || axClass.Methods?.Method;
            const parsedMethods = this.parseMethods(methodsData, className);
            // Inheritance lives in the Declaration CDATA as X++ text, not in XML
            // elements — see parseXppClassHeader. The element reads are kept only as
            // a fallback for hand-written/synthetic AxClass XML in tests and tools.
            const declarationCdata = this.cdataText(axClass.SourceCode?.Declaration);
            const header = parseXppClassHeader(declarationCdata);
            // [ExtensionOf(...)] marks this AxClass as a class extension. Extraction
            // reads it to emit an extension record; without it class extensions index
            // as plain classes and every class-extension lookup misses them (#693).
            const extensionOf = parseExtensionOfAttribute(declarationCdata) ?? undefined;
            const parsedImplements = header?.implements.length
                ? header.implements
                : this.parseImplements(axClass.Implements);
            const parsedDeclaration = this.extractClassDeclaration(axClass, header);
            const isAbstract = header?.isAbstract
                ?? (axClass.IsAbstract === 'Yes' || axClass.IsAbstract === 'true');
            const isFinal = header?.isFinal
                ?? (axClass.IsFinal === 'Yes' || axClass.IsFinal === 'true');
            const extendsClass = header?.extends || axClass.Extends || undefined;
            const classInfoBase = {
                name: className,
                model: model || 'Unknown',
                sourcePath: filePath,
                extends: extendsClass,
                implements: parsedImplements,
                isAbstract,
                isFinal,
                visibility: header?.visibility,
                declaration: parsedDeclaration,
                extensionOf,
                methods: parsedMethods,
                documentation: axClass.DeveloperDocumentation || undefined,
            };
            const classInfo = {
                ...classInfoBase,
                tags: this.enhancedParser.generateClassTags({ ...classInfoBase, methods: [] }),
                usedTypes: this.enhancedParser.extractClassDependencies(classInfoBase),
                description: axClass.DeveloperDocumentation || `${className} class${extendsClass ? ` extending ${extendsClass}` : ''}`,
            };
            return { success: true, data: classInfo };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Parse an X++ table file (AxTable XML)
     */
    async parseTableFile(filePath, model) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            if (!parsed.AxTable) {
                return { success: false, error: 'Not a valid AxTable file' };
            }
            const axTable = parsed.AxTable;
            const tableName = axTable.Name || 'UnknownTable';
            const tableInfo = {
                name: tableName,
                model: model || 'Unknown',
                sourcePath: filePath,
                label: axTable.Label || tableName,
                tableGroup: axTable.TableGroup || 'Main',
                primaryIndex: axTable.PrimaryIndex || undefined,
                clusteredIndex: axTable.ClusteredIndex || undefined,
                fields: this.parseFields(axTable.Fields?.AxTableField),
                indexes: this.parseIndexes(axTable.Indexes?.AxTableIndex),
                relations: this.parseRelations(axTable.Relations?.AxTableRelation),
                methods: this.parseMethods(axTable.SourceCode?.Methods?.Method, tableName),
            };
            return { success: true, data: tableInfo };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Parse an X++ view/data entity file (AxView or AxDataEntityView XML)
     */
    async parseViewFile(filePath, model) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const axView = parsed.AxDataEntityView || parsed.AxView;
            if (!axView) {
                return { success: false, error: 'Not a valid AxView/AxDataEntityView file' };
            }
            const isDataEntity = !!parsed.AxDataEntityView;
            const viewName = axView.Name || 'UnknownView';
            const viewInfo = {
                name: viewName,
                model: model || 'Unknown',
                sourcePath: filePath,
                type: isDataEntity ? 'data-entity' : 'view',
                label: axView.Label || undefined,
                isPublic: axView.IsPublic === 'Yes' || axView.IsPublic === 'true',
                isReadOnly: axView.IsReadOnly === 'Yes' || axView.IsReadOnly === 'true',
                primaryKey: axView.PrimaryKey || undefined,
                primaryKeyFields: this.parseViewPrimaryKeyFields(axView.Keys, axView.PrimaryKey),
                fields: this.parseViewFields(axView.Fields),
                relations: this.parseViewRelations(axView.Relations),
                methods: this.parseMethods(axView.SourceCode?.Methods?.Method, viewName),
            };
            return { success: true, data: viewInfo };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Text of a CDATA-bearing element. xml2js hands back a plain string, unless
     * the element carries an attribute (mergeAttrs) — then the text sits under
     * `_` and the raw value is an object.
     */
    cdataText(node) {
        if (typeof node === 'string')
            return node;
        const text = node?._;
        return typeof text === 'string' ? text : '';
    }
    parseImplements(implementsStr) {
        if (!implementsStr)
            return [];
        if (typeof implementsStr !== 'string')
            return [];
        return implementsStr.split(',').map(i => i.trim()).filter(Boolean);
    }
    /**
     * The class's declaration line. Rebuilt from the parsed Declaration CDATA so
     * it reflects what the source actually says; falls back to synthesising one
     * from XML elements when there is no declaration to read.
     */
    extractClassDeclaration(axClass, header) {
        const modifiers = [];
        if (header) {
            // The access modifier leads, as it does in the source: `internal final
            // class Foo`. Rebuilding from isAbstract/isFinal alone did not merely omit
            // it — under a heading that reads `## Declaration` it printed `final class
            // Foo` for a source line saying `internal final class Foo`, with nothing to
            // tell the reader the block was a reconstruction (#902). Absent from the
            // source means absent here: no synthesised `public`.
            if (header.visibility)
                modifiers.push(header.visibility);
            if (header.isAbstract)
                modifiers.push('abstract');
            if (header.isFinal)
                modifiers.push('final');
            let decl = modifiers.length > 0 ? `${modifiers.join(' ')} ` : '';
            decl += `${header.kind} ${header.name}`;
            if (header.extends)
                decl += ` extends ${header.extends}`;
            if (header.implements.length)
                decl += ` implements ${header.implements.join(', ')}`;
            return decl;
        }
        if (axClass.IsAbstract === 'Yes' || axClass.IsAbstract === 'true')
            modifiers.push('abstract');
        if (axClass.IsFinal === 'Yes' || axClass.IsFinal === 'true')
            modifiers.push('final');
        let decl = modifiers.length > 0 ? `${modifiers.join(' ')} ` : '';
        decl += `class ${axClass.Name}`;
        if (axClass.Extends)
            decl += ` extends ${axClass.Extends}`;
        if (axClass.Implements)
            decl += ` implements ${axClass.Implements}`;
        return decl;
    }
    parseMethods(methodsData, parentClass = 'Unknown') {
        if (!methodsData)
            return [];
        const methods = Array.isArray(methodsData) ? methodsData : [methodsData];
        return methods.map(method => {
            const source = method.Source || '';
            const methodName = method.Name || 'unknown';
            const decl = parseXppDeclaration(source, methodName);
            const baseMethod = {
                name: methodName,
                visibility: this.parseVisibility(decl?.modifiers, method.Visibility),
                returnType: decl?.returnType || method.ReturnType || 'void',
                parameters: this.toParameterInfo(decl),
                parametersUnknown: decl === null,
                isStatic: decl?.modifiers.includes('static') ?? false,
                source: source,
                documentation: method.DeveloperDocumentation || undefined,
            };
            return this.enhancedParser.parseMethodEnhanced(baseMethod, parentClass);
        });
    }
    /**
     * The method's access modifier, read from the declaration that was just parsed.
     *
     * It used to be read from a `<Method><Visibility>` element, which real AxClass
     * XML does not have — so every method in the AOT fell through to 'public',
     * including the protected ones, and `get_object_info` printed
     * `- **Visibility:** public` under each of them (#902). The modifiers were in
     * hand two lines above the call all along.
     *
     * The element is still honoured as a fallback for hand-written/synthetic XML
     * and for a declaration too malformed to parse; only then does the X++ default
     * of public apply.
     */
    parseVisibility(modifiers, vis) {
        const declared = modifiers ? visibilityFromModifiers(modifiers) : undefined;
        if (declared)
            return declared;
        if (modifiers)
            return 'public';
        if (!vis)
            return 'public';
        const lower = vis.toLowerCase();
        if (lower === 'private' || lower === 'protected' || lower === 'internal')
            return lower;
        return 'public';
    }
    /**
     * Parses <AxTableField i:type="AxTableFieldString"> nodes; the field type
     * comes from the i:type XML attribute (field.$['i:type']), not an element.
     */
    parseFields(fieldsData) {
        if (!fieldsData)
            return [];
        const fields = Array.isArray(fieldsData) ? fieldsData : [fieldsData];
        return fields.map(field => {
            const rawType = field.$?.['i:type'] || 'AxTableFieldString';
            const xppType = rawType.replace('AxTableField', '') || 'String';
            return {
                name: field.Name || 'unknown',
                type: xppType,
                extendedDataType: field.ExtendedDataType || undefined,
                enumType: field.EnumType || undefined,
                mandatory: field.Mandatory === 'Yes' || field.Mandatory === 'true',
                label: field.Label || undefined,
            };
        });
    }
    parseIndexes(indexesData) {
        if (!indexesData)
            return [];
        const indexes = Array.isArray(indexesData) ? indexesData : [indexesData];
        return indexes.map(index => ({
            name: index.Name || 'unknown',
            fields: this.parseIndexFields(index.Fields),
            // Uniqueness is marked via AlternateKey, not AllowDuplicates
            unique: index.AlternateKey === 'Yes' || index.AlternateKey === 'true',
            clustered: index.IsClustered === 'Yes' || index.IsClustered === 'true',
        }));
    }
    parseIndexFields(fieldsStr) {
        if (!fieldsStr)
            return [];
        if (fieldsStr.AxTableIndexField) {
            const indexFields = Array.isArray(fieldsStr.AxTableIndexField)
                ? fieldsStr.AxTableIndexField
                : [fieldsStr.AxTableIndexField];
            return indexFields
                .map((field) => field?.DataField || field?.Name || '')
                .filter((field) => !!field);
        }
        if (typeof fieldsStr !== 'string') {
            if (Array.isArray(fieldsStr)) {
                return fieldsStr
                    .map((field) => {
                    if (typeof field === 'string') {
                        return field;
                    }
                    if (field?.DataField) {
                        return field.DataField;
                    }
                    if (field?.Name) {
                        return field.Name;
                    }
                    return '';
                })
                    .filter(Boolean);
            }
            return [];
        }
        return fieldsStr.split(',').map(f => f.trim()).filter(Boolean);
    }
    parseRelations(relationsData) {
        if (!relationsData)
            return [];
        const relations = Array.isArray(relationsData) ? relationsData : [relationsData];
        return relations.map(rel => ({
            name: rel.Name || 'unknown',
            relatedTable: rel.RelatedTable || 'unknown',
            constraints: this.parseConstraints(rel.Constraints),
        }));
    }
    parseConstraints(constraintsData) {
        if (!constraintsData)
            return [];
        const constraintNodes = constraintsData.AxTableRelationConstraint
            ? (Array.isArray(constraintsData.AxTableRelationConstraint)
                ? constraintsData.AxTableRelationConstraint
                : [constraintsData.AxTableRelationConstraint])
            : (Array.isArray(constraintsData) ? constraintsData : [constraintsData]);
        return constraintNodes.map((constraint) => ({
            field: constraint.Field || '',
            relatedField: constraint.RelatedField || '',
        }));
    }
    parseViewFields(fieldsData) {
        if (!fieldsData)
            return [];
        const entityFields = this.ensureArray(fieldsData.AxDataEntityViewField);
        const viewFields = this.ensureArray(fieldsData.AxViewField);
        const allFields = [...entityFields, ...viewFields];
        return allFields.map((field) => ({
            name: field.Name || 'unknown',
            dataSource: field.DataSource || undefined,
            dataField: field.DataField || undefined,
            dataMethod: field.DataMethod || undefined,
            labelId: this.extractLabelId(field.Label),
            isComputed: !!field.DataMethod,
        }));
    }
    parseViewRelations(relationsData) {
        if (!relationsData)
            return [];
        const entityRelations = this.ensureArray(relationsData.AxDataEntityViewRelation);
        const viewRelations = this.ensureArray(relationsData.AxViewRelation);
        const allRelations = [...entityRelations, ...viewRelations];
        return allRelations.map((relation) => ({
            name: relation.Name || 'unknown',
            relatedTable: relation.RelatedDataEntity || relation.RelatedTable || 'unknown',
            relationType: relation.RelationType || 'Unknown',
            cardinality: relation.Cardinality || 'Unknown',
            fields: this.parseViewRelationFields(relation),
        }));
    }
    parseViewPrimaryKeyFields(keysData, primaryKeyName) {
        if (!keysData)
            return [];
        const keys = this.ensureArray(keysData.AxDataEntityViewKey);
        const keyNode = primaryKeyName
            ? keys.find((key) => key.Name === primaryKeyName)
            : keys[0];
        if (!keyNode || !keyNode.Fields)
            return [];
        const keyFields = this.ensureArray(keyNode.Fields.AxDataEntityViewKeyField);
        return keyFields
            .map((field) => field.DataField || field.Name || '')
            .filter((field) => !!field);
    }
    parseViewRelationFields(relation) {
        const mappings = [];
        const relationFields = this.ensureArray(relation?.Fields?.AxDataEntityViewRelationField);
        for (const field of relationFields) {
            mappings.push({
                field: field.DataField || field.Field || field.Name || '',
                relatedField: field.RelatedDataField || field.RelatedField || '',
            });
        }
        const constraints = this.ensureArray(relation?.Constraints?.AxDataEntityViewRelationConstraint);
        for (const constraint of constraints) {
            mappings.push({
                field: constraint.DataField || constraint.Field || '',
                relatedField: constraint.RelatedDataField || constraint.RelatedField || '',
            });
        }
        return mappings.filter(mapping => !!mapping.field || !!mapping.relatedField);
    }
    extractLabelId(labelValue) {
        if (!labelValue || typeof labelValue !== 'string')
            return undefined;
        const trimmed = labelValue.trim();
        if (!trimmed.startsWith('@'))
            return undefined;
        return trimmed;
    }
    ensureArray(value) {
        if (!value)
            return [];
        return Array.isArray(value) ? value : [value];
    }
    /**
     * Declaration parameters narrowed to the shape XppMethodInfo carries.
     * A null decl yields `[]`; the `parametersUnknown` flag set alongside is what
     * tells that apart from a genuinely empty list, so don't read this alone.
     */
    toParameterInfo(decl) {
        return decl?.parameters.map(p => (p.defaultValue
            ? { type: p.type, name: p.name, defaultValue: p.defaultValue }
            : { type: p.type, name: p.name })) ?? [];
    }
    /**
     * Parse Form XML file (AxForm)
     */
    async parseFormFile(filePath, model) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            if (!parsed.AxForm) {
                return { success: false, error: 'Not a valid AxForm file' };
            }
            const axForm = parsed.AxForm;
            const formName = axForm.Name || 'UnknownForm';
            // Extract form info with full structure
            const formInfo = {
                name: formName,
                model: model || 'Unknown',
                sourcePath: filePath,
                label: axForm.Label || undefined,
                caption: axForm.Caption || axForm.TitleDatasource || undefined,
                formPattern: undefined, // Will be detected from Design
                formPatternVersion: undefined,
                dataSources: [],
                design: [],
                patternNodes: [],
                methods: [],
            };
            // Extract data sources (top-level <DataSources>, not the SourceCode one)
            // xml2js with explicitArray:false yields a plain object here, never an array.
            if (axForm.DataSources && typeof axForm.DataSources === 'object') {
                formInfo.dataSources = this.extractFormDataSources(axForm.DataSources);
            }
            // Extract design (controls) — Design > Controls > AxFormControl tree,
            // including Pattern/PatternVersion on Design and on container controls.
            if (axForm.Design && typeof axForm.Design === 'object') {
                const designInfo = walkFormDesign(axForm.Design);
                formInfo.design = designInfo.controls;
                formInfo.formPattern = designInfo.pattern || designInfo.style;
                formInfo.formPatternVersion = designInfo.patternVersion;
                formInfo.patternNodes = collectPatternNodes(designInfo);
            }
            // Extract methods — form methods live under SourceCode > Methods > Method
            const methodsNode = axForm.SourceCode?.Methods ?? axForm.Methods;
            if (methodsNode && typeof methodsNode === 'object') {
                formInfo.methods = this.extractFormMethods(methodsNode, formName);
            }
            return { success: true, data: formInfo };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Extract form datasources
     */
    extractFormDataSources(dataSourcesNode) {
        const dataSources = [];
        // Form XML uses <AxFormDataSource>; AxFormDataSourceRoot kept as legacy fallback
        const dsData = dataSourcesNode.AxFormDataSource || dataSourcesNode.AxFormDataSourceRoot;
        if (!dsData) {
            return dataSources;
        }
        const dsRoots = this.ensureArray(dsData);
        for (const dsNode of dsRoots) {
            const ds = {
                name: dsNode.Name || 'Unknown',
                table: dsNode.Table || 'Unknown',
                allowEdit: dsNode.AllowEdit === 'Yes' || dsNode.AllowEdit === 'true',
                allowCreate: dsNode.AllowCreate === 'Yes' || dsNode.AllowCreate === 'true',
                allowDelete: dsNode.AllowDelete === 'Yes' || dsNode.AllowDelete === 'true',
                fields: [],
                methods: [],
            };
            // Extract fields
            if (dsNode.Fields && this.ensureArray(dsNode.Fields).length > 0) {
                const fieldsNode = this.ensureArray(dsNode.Fields)[0];
                if (fieldsNode.AxFormDataSourceField) {
                    const fieldNodes = this.ensureArray(fieldsNode.AxFormDataSourceField);
                    ds.fields = fieldNodes
                        .map((f) => f.DataField || 'Unknown')
                        .filter((name) => name !== 'Unknown');
                }
            }
            // Extract methods
            if (dsNode.Methods && this.ensureArray(dsNode.Methods).length > 0) {
                const methodsNode = this.ensureArray(dsNode.Methods)[0];
                if (methodsNode.Method) {
                    const methodNodes = this.ensureArray(methodsNode.Method);
                    ds.methods = methodNodes.map((m) => m.Name || 'Unknown');
                }
            }
            dataSources.push(ds);
        }
        return dataSources;
    }
    /**
     * Extract form methods
     */
    extractFormMethods(methodsNode, _formName) {
        const methods = [];
        if (!methodsNode.Method) {
            return methods;
        }
        const methodNodes = this.ensureArray(methodsNode.Method);
        for (const methodNode of methodNodes) {
            const name = methodNode.Name || 'Unknown';
            const source = methodNode.Source || '';
            const decl = parseXppDeclaration(source, name);
            // Parse method info (similar to class methods)
            const methodInfo = {
                name,
                visibility: 'public', // Forms typically have public methods
                returnType: decl?.returnType || 'void',
                parameters: this.toParameterInfo(decl),
                parametersUnknown: decl === null,
                isStatic: decl?.modifiers.includes('static') ?? false,
                source,
                sourceSnippet: source.split('\n').slice(0, 10).join('\n'),
            };
            methods.push(methodInfo);
        }
        return methods;
    }
    /**
     * Parse EDT XML file (AxEdt)
     */
    async parseEdtFile(filePath, model) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            if (!parsed.AxEdt) {
                return { success: false, error: 'Not a valid AxEdt file' };
            }
            const axEdt = parsed.AxEdt;
            const edtName = axEdt.Name || 'UnknownEDT';
            const getValue = (key) => {
                const raw = axEdt[key];
                if (!raw)
                    return undefined;
                const value = Array.isArray(raw) ? raw[0] : raw;
                return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
            };
            const edtInfo = {
                name: edtName,
                model: model || 'Unknown',
                sourcePath: filePath,
                extends: getValue('Extends'),
                enumType: getValue('EnumType'),
                referenceTable: getValue('ReferenceTable'),
                relationType: getValue('RelationType'),
                stringSize: getValue('StringSize'),
                databaseStringSize: getValue('DatabaseStringSize'),
                displayLength: getValue('DisplayLength'),
                label: getValue('Label'),
                helpText: getValue('HelpText'),
                formHelp: getValue('FormHelp'),
                configurationKey: getValue('ConfigurationKey'),
                alignment: getValue('Alignment'),
                decimalSeparator: getValue('DecimalSeparator'),
                signDisplay: getValue('SignDisplay'),
                noOfDecimals: getValue('NoOfDecimals'),
                additionalProperties: {},
            };
            // Extract additional properties
            const knownProperties = new Set([
                'Name', 'Extends', 'EnumType', 'ReferenceTable', 'RelationType', 'StringSize', 'DisplayLength',
                'DatabaseStringSize',
                'Label', 'HelpText', 'FormHelp', 'ConfigurationKey', 'Alignment', 'DecimalSeparator',
                'SignDisplay', 'NoOfDecimals', 'ArrayElements', 'Relations', 'TableReferences'
            ]);
            for (const [key, value] of Object.entries(axEdt)) {
                if (knownProperties.has(key))
                    continue;
                const first = Array.isArray(value) ? value[0] : value;
                if (typeof first === 'string' && first.trim().length > 0) {
                    edtInfo.additionalProperties[key] = first;
                }
            }
            return { success: true, data: edtInfo };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async parseSecurityPrivilegeFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxSecurityPrivilege;
            if (!root)
                return { success: false, error: 'Not an AxSecurityPrivilege file' };
            const name = root.Name || '';
            const label = root.Label || undefined;
            const rawEps = root.EntryPoints?.AxSecurityEntryPointReference;
            const epArray = rawEps ? (Array.isArray(rawEps) ? rawEps : [rawEps]) : [];
            const entryPoints = epArray.map((ep) => {
                // Grant / Access can be a plain string (e.g. "Allow") OR an object
                // ({ Read: "Allow", Create: "Allow", ... }) depending on the XML structure.
                // Normalise to a string so it can be stored as TEXT in SQLite.
                const rawAccess = ep.Grant ?? ep.Access;
                let accessLevel;
                if (rawAccess == null) {
                    accessLevel = '';
                }
                else if (typeof rawAccess === 'object') {
                    // Serialize to "Read:Allow,Create:Allow,..." form
                    accessLevel = Object.entries(rawAccess)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(',');
                }
                else {
                    accessLevel = String(rawAccess);
                }
                return { name: ep.Name || '', objectName: ep.ObjectName || ep.Name || '', objectType: ep.ObjectType || '', accessLevel };
            }).filter((ep) => ep.name);
            return { success: true, data: { name, label, sourcePath: filePath, entryPoints } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async parseSecurityDutyFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxSecurityDuty;
            if (!root)
                return { success: false, error: 'Not an AxSecurityDuty file' };
            const name = root.Name || '';
            const label = root.Label || undefined;
            // #34, same family as the role parser: a standard AxSecurityDuty lists its
            // privileges as <AxSecurityPrivilegeReference>.
            const rawPrivs = root.Privileges?.AxSecurityPrivilegeReference ??
                root.Privileges?.AxSecurityRolePermissionSet ??
                root.Privileges?.AxSecurityPrivilegePermissionSet;
            const privArray = rawPrivs ? (Array.isArray(rawPrivs) ? rawPrivs : [rawPrivs]) : [];
            const privileges = privArray
                .map((p) => (typeof p === 'string' ? p : p.Name || ''))
                .filter(Boolean);
            return { success: true, data: { name, label, sourcePath: filePath, privileges } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async parseSecurityRoleFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxSecurityRole;
            if (!root)
                return { success: false, error: 'Not an AxSecurityRole file' };
            const name = root.Name || '';
            const label = root.Label || undefined;
            const description = root.Description || undefined;
            // #34: a STANDARD AxSecurityRole lists its duties as <AxSecurityDutyReference>.
            // Only the two legacy/incorrect element names were read here, so a correctly
            // shaped role parsed as "0 duties" — which security_info(mode=artifact) then
            // reported as "Duties: none indexed" for a freshly indexed role.
            const rawDuties = root.Duties?.AxSecurityDutyReference ??
                root.Duties?.AxSecurityRoleDutyPermission ??
                root.Duties?.AxSecurityDutyPermission;
            const dutyArray = rawDuties ? (Array.isArray(rawDuties) ? rawDuties : [rawDuties]) : [];
            const duties = dutyArray
                .map((d) => (typeof d === 'string' ? d : d.Name || ''))
                .filter(Boolean);
            return { success: true, data: { name, label, description, sourcePath: filePath, duties } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async parseMenuItemFile(filePath, itemType) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const rootKey = itemType === 'display'
                ? 'AxMenuItemDisplay'
                : itemType === 'action'
                    ? 'AxMenuItemAction'
                    : 'AxMenuItemOutput';
            const root = parsed?.[rootKey];
            if (!root)
                return { success: false, error: `Not an ${rootKey} file` };
            return {
                success: true,
                data: {
                    name: root.Name || '',
                    label: root.Label || undefined,
                    targetObject: root.Object || undefined,
                    targetType: root.ObjectType || undefined,
                    securityPrivilege: root.SecurityPrivilege || undefined,
                    sourcePath: filePath,
                },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async parseExtensionFile(filePath, extensionType) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            // Determine XML root element by extensionType
            const rootKeyMap = {
                'table-extension': 'AxTableExtension',
                // Not AxClassExtension: a class extension is an AxClass file carrying
                // [ExtensionOf(...)], so its root element is AxClass like any other class (#693).
                'class-extension': 'AxClass',
                'form-extension': 'AxFormExtension',
                'enum-extension': 'AxEnumExtension',
                'edt-extension': 'AxEdtExtension',
                'data-entity-extension': 'AxDataEntityViewExtension',
                'view-extension': 'AxViewExtension',
                'query-extension': 'AxQuerySimpleExtension',
                'map-extension': 'AxMapExtension',
                'menu-extension': 'AxMenuExtension',
                'security-duty-extension': 'AxSecurityDutyExtension',
                'security-role-extension': 'AxSecurityRoleExtension',
                'menu-item-display-extension': 'AxMenuItemDisplayExtension',
                'menu-item-action-extension': 'AxMenuItemActionExtension',
                'menu-item-output-extension': 'AxMenuItemOutputExtension',
            };
            const rootKey = rootKeyMap[extensionType] || Object.keys(parsed || {})[0] || '';
            const root = parsed?.[rootKey];
            if (!root)
                return { success: false, error: `Cannot parse extension type: ${extensionType}` };
            const name = root.Name || '';
            // No Ax*Extension XML carries <Extends>/<BaseObject> — these reads are a
            // fallback for synthetic XML only. Real files identify the base object
            // either by the [ExtensionOf(<kind>Str(Base))] attribute on the
            // declaration (class extensions) or by the "Base.<Suffix>" name
            // convention (every other kind), so both are read here. Leaving this
            // empty silently kills every extension_metadata lookup keyed on
            // base_object_name — resolve_references' extension-method and
            // table-extension-field checks, and table_extension_info.
            let baseObjectName = root.Extends || root.BaseObject || '';
            if (!baseObjectName) {
                // Any intrinsic, any case, one or two arguments — see
                // parseExtensionOfAttribute for the shapes this has to survive.
                baseObjectName =
                    parseExtensionOfAttribute(this.cdataText(root.SourceCode?.Declaration))?.baseObjectName || '';
            }
            if (!baseObjectName && name.includes('.')) {
                // "SalesTable.FooExtension" → "SalesTable"; the suffix may itself
                // contain dots ("OMLegalEntity.Extension.Retail"), so split on the first.
                baseObjectName = name.slice(0, name.indexOf('.'));
            }
            // Extract added fields. Each kind stores them under its own typed tag.
            const rawFields = root.Fields?.AxTableField ??
                root.Fields?.AxEdtField ??
                root.Fields?.AxViewField ??
                root.Fields?.AxMapField ??
                root.Fields?.AxQueryExtensionQueryDataSourceField ??
                [];
            const fieldArr = Array.isArray(rawFields) ? rawFields : rawFields ? [rawFields] : [];
            // AxQuerySimpleExtension nests the name one level down, under
            // <QueryDataSourceField>; every other kind carries <Name> on the field itself.
            const addedFields = fieldArr
                .map((f) => f.Name || f.QueryDataSourceField?.Name || '')
                .filter(Boolean);
            // Extract added indexes
            const rawIndexes = root.Indexes?.AxTableIndex ?? [];
            const indexArr = Array.isArray(rawIndexes) ? rawIndexes : rawIndexes ? [rawIndexes] : [];
            const addedIndexes = indexArr.map((i) => i.Name || '').filter(Boolean);
            // Extract methods + detect CoC and event subscriptions
            const rawMethods = root.SourceCode?.Methods?.Method ?? root.Methods?.Method ?? [];
            const methodArr = Array.isArray(rawMethods) ? rawMethods : rawMethods ? [rawMethods] : [];
            const { addedMethods, cocMethods, eventSubscriptions } = extensionMembersFrom(methodArr.map((m) => ({
                name: m.Name || '',
                source: typeof m.Source === 'string' ? m.Source : (m._ || ''),
            })));
            return {
                success: true,
                data: {
                    name,
                    baseObjectName,
                    sourcePath: filePath,
                    addedFields,
                    addedMethods,
                    addedIndexes,
                    cocMethods,
                    eventSubscriptions,
                },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Parse an AxService file: backing class, external name, namespace, and the
     * exposed service operations (each maps to a public method on the class).
     */
    async parseServiceFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxService;
            if (!root)
                return { success: false, error: 'Not an AxService file' };
            const rawOps = root.ServiceOperations?.AxServiceOperation;
            const opArr = Array.isArray(rawOps) ? rawOps : rawOps ? [rawOps] : [];
            const operations = opArr
                .map((o) => ({
                name: o.Name || '',
                method: o.Method || o.Name || '',
                idempotent: String(o.EnableIdempotence || '').toLowerCase() === 'yes',
            }))
                .filter((o) => o.name);
            return {
                success: true,
                data: {
                    name: root.Name || '',
                    serviceClass: root.Class || undefined,
                    externalName: root.ExternalName || undefined,
                    namespace: root.Namespace || undefined,
                    sourcePath: filePath,
                    operations,
                },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Parse an AxMap file: the X++ map class (methods) and its table mappings
     * (each mapping binds the map to a table via field connections).
     */
    async parseMapFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxMap;
            if (!root)
                return { success: false, error: 'Not an AxMap file' };
            const decl = root.SourceCode?.Declaration || '';
            const extendsMatch = decl.match(/\bextends\s+(\w+)/i);
            const rawMethods = root.SourceCode?.Methods?.Method;
            const methodArr = Array.isArray(rawMethods) ? rawMethods : rawMethods ? [rawMethods] : [];
            const methods = methodArr.map((m) => m.Name || '').filter(Boolean);
            const rawMappings = root.Mappings?.AxTableMapping;
            const mapArr = Array.isArray(rawMappings) ? rawMappings : rawMappings ? [rawMappings] : [];
            const mappings = mapArr.map((m) => {
                const rawConn = m.Connections?.AxTableMappingConnection;
                const connArr = Array.isArray(rawConn) ? rawConn : rawConn ? [rawConn] : [];
                return { table: m.MappingTable || '', fieldConnections: connArr.length };
            }).filter((m) => m.table);
            return {
                success: true,
                data: { name: root.Name || '', extends: extendsMatch?.[1], sourcePath: filePath, methods, mappings },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /** Parse an AxConfigurationKey file: label + parent key (feature gating tree). */
    async parseConfigurationKeyFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxConfigurationKey;
            if (!root)
                return { success: false, error: 'Not an AxConfigurationKey file' };
            return {
                success: true,
                data: { name: root.Name || '', label: root.Label || undefined, parentKey: root.ParentKey || undefined, sourcePath: filePath },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /** Parse an AxLicenseCode file: group, package, type (license-based feature gating). */
    async parseLicenseCodeFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxLicenseCode;
            if (!root)
                return { success: false, error: 'Not an AxLicenseCode file' };
            return {
                success: true,
                data: {
                    name: root.Name || '',
                    label: root.Label || undefined,
                    group: root.Group || undefined,
                    licensePackage: root.Package || undefined,
                    type: root.Type || undefined,
                    sourcePath: filePath,
                },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /** Parse an AxSecurityPolicy file: row-level (OLS) policy on a primary table. */
    async parseSecurityPolicyFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxSecurityPolicy;
            if (!root)
                return { success: false, error: 'Not an AxSecurityPolicy file' };
            return {
                success: true,
                data: {
                    name: root.Name || '',
                    label: root.Label || undefined,
                    primaryTable: root.PrimaryTable || undefined,
                    query: root.Query || undefined,
                    operation: root.Operation || undefined,
                    constrainedTable: String(root.ConstrainedTable || '').toLowerCase() === 'yes',
                    sourcePath: filePath,
                },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /** Parse an AxMacroDictionary file: the #define entries of a shared macro library. */
    async parseMacroFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxMacroDictionary;
            if (!root)
                return { success: false, error: 'Not an AxMacroDictionary file' };
            const source = typeof root.Source === 'string' ? root.Source : (root.Source?._ || '');
            const defines = [];
            // #define.Name(value) and #define.Name  (no value)
            const re = /#define\.(\w+)\s*(?:\(([^)]*)\))?/g;
            let m;
            while ((m = re.exec(source)) !== null) {
                defines.push({ name: m[1], value: (m[2] ?? '').trim() });
            }
            return { success: true, data: { name: root.Name || '', sourcePath: filePath, defines } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Parse an AxServiceGroup file: member services and deployment flag.
     */
    async parseServiceGroupFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const root = parsed?.AxServiceGroup;
            if (!root)
                return { success: false, error: 'Not an AxServiceGroup file' };
            const rawSvc = root.Services?.AxServiceGroupService;
            const svcArr = Array.isArray(rawSvc) ? rawSvc : rawSvc ? [rawSvc] : [];
            const services = svcArr
                .map((s) => s.Service || s.Name || '')
                .filter(Boolean);
            return {
                success: true,
                data: {
                    name: root.Name || '',
                    autoDeploy: String(root.AutoDeploy || '').toLowerCase() === 'yes',
                    description: root.Description || undefined,
                    sourcePath: filePath,
                    services,
                },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}
//# sourceMappingURL=xmlParser.js.map