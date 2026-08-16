/**
 * Refuse a data-entity create that cannot produce a working entity.
 *
 * `primaryTable` + at least one field are what generate the <Fields>, <Keys> and
 * the ViewMetadata query. Without them the builder emits a well-formed skeleton
 * that the tool reported as "✅ created" — an entity with no data source, no key
 * and no fields, which compiles, syncs, and returns nothing. Neither a build nor
 * BP flags it, so nothing downstream ever caught it.
 */
export declare function assertDataEntityIsFunctional(entityName: string, properties?: Record<string, any>): void;
/** NoYes-ish inputs: true / "Yes" / "true" / 1 all mean Yes. */
export declare function isYes(value: unknown): boolean;
export declare function buildAxDataEntityXml(entityName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=dataEntityXml.d.ts.map