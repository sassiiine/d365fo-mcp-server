/**
 * Infer a model's object prefix from the objects that model already contains.
 *
 * Why this exists: `EXTENSION_PREFIX` is a single value chosen once, during
 * `setup`. Real development spans several models — a developer works in Demo
 * today and DemoCus tomorrow — and each of those carries its own prefix (DEMO_
 * and DMC_ respectively). A single configured value cannot be right for all of
 * them, and nobody is going to re-run setup on every context switch.
 * The information is already on disk: the model's existing objects state its
 * prefix far more reliably than any configuration does.
 *
 * So the active model's own naming wins, and the configured `EXTENSION_PREFIX`
 * becomes the fallback for models that have nothing to learn from (a brand-new,
 * empty model) — see resolveObjectPrefix() in modelClassifier.ts for the order.
 *
 * Two tokens are inferred, because D365FO uses two different forms and they are
 * NOT derivable from one another (DEMO_ / DEMO, but Con / Con):
 *   - `regular` — prepended to new objects and to members added inside an
 *     extension:  DEMO_MandatoryReasonCode, DEMO_ArchiveAccDocErrorLog
 *   - `infix`   — embedded in extension element/class names:
 *     AssetBookTable.DEMOExtension, AccountingSourceExplorerDEMO_Extension
 *
 * Inference is deliberately conservative: a model whose objects show no
 * consistent prefix yields null, and the configured value is used unchanged.
 */
/** The two prefix tokens a model's own objects reveal. */
export interface InferredModelPrefix {
    /** Token prepended to new objects and to members added inside extensions. */
    regular: string;
    /** Token embedded in extension element and extension class names. */
    infix: string;
    /** How many sampled names carried `regular` (diagnostics only). */
    coverage: number;
    /** How many names the inference looked at (diagnostics only). */
    sampleSize: number;
}
/**
 * The PascalCase form of an underscore-style prefix, applied PER SEGMENT:
 * "DEMO" → "Demo", "WHS" → "Whs", "ConFinSK" → "ConFinSk".
 *
 * The documented EXTENSION_PREFIX rule is "XY_" → "Xy" — first upper, rest
 * lower — which is right for the single all-caps acronym it was written for and
 * destroys every later boundary in a compound token: "ConFinSK" flattens to
 * "Confinsk". Lowering each segment on its own keeps the rule for acronyms and
 * keeps the boundaries for the rest.
 */
export declare function toExtensionInfixCase(bare: string): string;
/**
 * Infer a model's prefix from the names of the objects it contains.
 * Returns null when the names show no consistent prefix.
 *
 * `names` are object names as stored in the AOT — regular objects
 * ("DEMO_AssetIPFairValue"), dot-notation extensions ("AssetBookTable.DEMOExtension")
 * and extension classes ("AccountingSourceExplorerDEMO_Extension") mixed together.
 *
 * `modelName` is what a three-segment candidate is corroborated against — see
 * corroboratesToken(). Omit it and long candidates are accepted on coverage
 * alone, which is right for a caller that has names and nothing else.
 */
export declare function inferPrefixFromObjectNames(names: string[], modelName?: string): InferredModelPrefix | null;
/** Supplies the object names of one model. Returns [] when it cannot answer. */
export type ModelObjectNameSource = (modelName: string) => string[];
/**
 * Install the source of model object names (the symbol index, in the server).
 * Called once during startup; passing null disables inference.
 */
export declare function setModelObjectNameSource(source: ModelObjectNameSource | null): void;
/** Seed a model's inferred prefix directly, bypassing the source (tests, CLI). */
export declare function primeInferredModelPrefix(modelName: string, names: string[]): void;
/** Drop every cached inference (test isolation, workspace switch). */
export declare function clearInferredModelPrefixes(): void;
/**
 * The prefix this model's own objects use, or null when it has none to teach us
 * (empty model, no source installed, or inference switched off).
 */
export declare function getInferredModelPrefix(modelName: string): InferredModelPrefix | null;
//# sourceMappingURL=modelPrefixInference.d.ts.map