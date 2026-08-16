/**
 * Closed value sets for the enum-typed metadata properties the XML builders
 * write as raw text.
 *
 * Why this exists: the D365FO deserializer DROPS an element whose value is not a
 * member of the target enum — it does not fail. So `entityCategory:"Masters"`,
 * `cardinality:"OneToMany"` or `contextType:"Role"` were written verbatim, the
 * build stayed green, and the property silently took its default. Nothing
 * anywhere reported it. Validating here turns that into a refusal before a byte
 * is written.
 *
 * Every set below is the metamodel's own, read by reflection over
 * Microsoft.Dynamics.AX.Metadata[.Core].dll in PackagesLocalDirectory\bin — not
 * transcribed from documentation. Two of them contradicted what this repo had
 * been documenting: EntityCategory's member is `Parameters` (not `Parameter`)
 * and it also has `Configuration`.
 */
/** Microsoft.Dynamics.AX.Metadata.Core.MetaModel.EntityCategory */
export declare const ENTITY_CATEGORIES: readonly ['Master', 'Configuration', 'Transaction', 'Reference', 'Document', 'Parameters'];
/** Microsoft.Dynamics.AX.Metadata.Core.MetaModel.Cardinality (relation, local side) */
export declare const RELATION_CARDINALITIES: readonly ['NotSpecified', 'ZeroOne', 'ExactlyOne', 'ZeroMore', 'OneMore'];
/** Microsoft.Dynamics.AX.Metadata.Core.MetaModel.RelatedTableCardinality — a
 *  SMALLER set than Cardinality: the related side cannot be ZeroMore/OneMore. */
export declare const RELATED_TABLE_CARDINALITIES: readonly ['NotSpecified', 'ZeroOne', 'ExactlyOne'];
/** Microsoft.Dynamics.AX.Metadata.Core.MetaModel.RelationshipType */
export declare const RELATIONSHIP_TYPES: readonly ['NotSpecified', 'Association', 'Composition', 'Link', 'Specialization', 'Aggregation'];
/** Microsoft.Dynamics.AX.Metadata.Core.MetaModel.SecurityPolicyContextType */
export declare const SECURITY_POLICY_CONTEXT_TYPES: readonly ['ContextString', 'RoleName', 'RoleProperty'];
/** Microsoft.Dynamics.AX.Metadata.Core.MetaModel.EntryPointType — the
 *  <ObjectType> of an AxSecurityEntryPointReference. */
export declare const SECURITY_ENTRY_POINT_TYPES: readonly ['None', 'MenuItemDisplay', 'MenuItemOutput', 'MenuItemAction', 'ServiceOperation'];
/**
 * Decide `<UseEnumValue>` and whether explicit `<Value>` elements may be emitted.
 *
 * The rule that used to be here read `properties.useEnumValue` alone, so an
 * enumValues[] carrying explicit `value:` numbers with no `useEnumValue` flag
 * produced UseEnumValue=No and every <Value> suppressed — the numbering the
 * caller asked for was gone, the file built clean, and X++ comparing the enum
 * against a stored int was quietly wrong.
 *
 * An explicit value is now honoured (useEnumValue is auto-set to Yes) rather
 * than dropped: it is an unambiguous statement of intent, and the alternative —
 * refusing — costs a round trip to say something the payload already said.
 *
 * Two cases are genuine contradictions and DO throw, because both readings write
 * something the caller did not ask for:
 *   • isExtensible + explicit values — xppc hard-rejects this
 *     ("UseEnumValue property must be set to 'No' when IsExtensible is True");
 *     an extensible enum is positional by construction.
 *   • useEnumValue:false + explicit values — the caller asked for both halves of
 *     a contradiction in one payload.
 *
 * "Explicit" here means a value that DIFFERS from the position the entry would
 * get anyway. Numbering an in-order list 0,1,2 states nothing the ordering does
 * not already state, so it is not treated as a conflict — otherwise a redundant
 * but harmless payload would start failing, extensible enums included.
 */
export declare function resolveEnumValueMode(enumName: string, properties: Record<string, any> | undefined, values: Array<{
    name?: string;
    value?: number;
}>): {
    useEnumValue: 'Yes' | 'No';
    suppressExplicitValues: boolean;
};
/**
 * Canonicalize `value` against `allowed` (case-insensitively, the way
 * Enum.TryParse(…, ignoreCase: true) does on the C# side) and throw naming the
 * whole set when it is not a member. Returns `fallback` for an absent value, so
 * a property that is optional stays optional.
 */
export declare function assertKnownEnumValue(propertyName: string, value: unknown, allowed: readonly string[], fallback: string): string;
//# sourceMappingURL=axEnumProperties.d.ts.map