/**
 * Model Classifier Utility
 * Determines whether a D365 F&O model is custom or standard
 *
 * Logic:
 * - Custom models are defined in CUSTOM_MODELS environment variable
 * - Supports wildcards: Custom*, *Test, *Extension*
 * - Models with EXTENSION_PREFIX are considered custom
 * - Auto-detected models from workspace are automatically registered as custom
 * - All other models are considered Microsoft standard models
 */
/**
 * Register a model as custom (e.g., from auto-detection)
 * This allows dynamically detected models to be treated as custom
 */
export declare function registerCustomModel(modelName: string): void;
/**
 * Clear all auto-detected custom models (for test isolation)
 */
export declare function clearAutoDetectedModels(): void;
/**
 * Get list of custom models from environment
 */
export declare function getCustomModels(): string[];
/**
 * Get extension prefix from environment
 */
export declare function getExtensionPrefix(): string;
/**
 * Get configurable object suffix from environment.
 * Returns the raw EXTENSION_SUFFIX value (trailing underscores stripped).
 * Empty string when not configured.
 */
export declare function getObjectSuffix(): string;
/**
 * Resolve the extension-naming style from the environment.
 *
 *  - 'prefix' (default): extension elements and extension classes embed the
 *    EXTENSION_PREFIX as an infix, per Microsoft's prefix-based guideline
 *    (e.g. CustTable.CrExtension, CustTableCr_Extension).
 *
 *  - 'model-name': extension elements and extension classes embed the MODEL NAME,
 *    matching the Visual Studio developer-tools default
 *    (e.g. CustTable.ContosoRobotics, CustTable_ContosoRobotics_Extension).
 *    EXTENSION_PREFIX still applies to NEW objects and to fields/methods added
 *    inside extensions — only the extension element/class token changes.
 *
 * Configured via EXTENSION_NAMING_STYLE. Any value other than 'model-name'
 * (including unset) resolves to 'prefix' so existing setups are unchanged.
 */
export declare function getExtensionNamingStyle(): 'prefix' | 'model-name';
/**
 * Apply a configurable suffix to a NEW model element name.
 * The suffix is appended at the end of the object name.
 *
 * Suffix does NOT apply to:
 *  - Dot-notation extension elements (CustTable.XyExtension — suffix breaks MS naming)
 *  - Extension classes ending with _Extension (SalesFormLetterXy_Extension)
 *  - Names that already end with the suffix (case-insensitive)
 *
 * Examples with EXTENSION_SUFFIX="ZZ":
 *   MyTable        → MyTableZZ
 *   MyClass        → MyClassZZ
 *   MyTableZZ      → MyTableZZ  (no double-suffix)
 *   CustTable.XyExtension → CustTable.XyExtension (skip)
 *   CustTableXy_Extension → CustTableXy_Extension (skip)
 */
export declare function applyObjectSuffix(objectName: string, suffix: string): string;
/**
 * Resolve the clean prefix to use when naming newly created D365FO objects.
 *
 * Microsoft naming guidelines (https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/extensibility/naming-guidelines-extensions):
 *  - New model elements  → prefix concatenated directly: {Prefix}{ObjectName}  (e.g. WHSMyTable)
 *  - Extension elements  → {BaseElement}.{Prefix}Extension                     (e.g. HCMWorker.WHSExtension)
 *  - Extension classes   → {BaseElement}{Prefix}_Extension                     (e.g. SalesFormLetterContoso_Extension)
 *  - Fields in extensions→ {Prefix}{FieldName}                                 (e.g. WHSApprovingWorker)
 *
 * Returns the prefix with any trailing '_' stripped — the underscore is not part
 * of the prefix itself, only of the form used for regular objects. See
 * resolveRawPrefix() for the priority order, and resolveRegularObjectPrefixToken()
 * for the token actually prepended to a name.
 *
 * Returns empty string when nothing resolves.
 */
export declare function resolveObjectPrefix(modelName: string): string;
/**
 * Derive the extension infix form from an already-resolved prefix.
 *
 * Extension elements (dot-notation and _Extension classes) embed the prefix
 * as a PascalCase infix WITHOUT any underscore separator:
 *   - Underscore-style EXTENSION_PREFIX "XY_"  → resolved prefix "XY"  → infix "Xy"
 *   - Normal prefix "Contoso"                  → resolved prefix "Contoso" → infix "Contoso"
 *   - All-caps prefix "WHS" with "WHS_" in env → infix "Whs"
 *   - All-caps prefix "WHS" with "WHS" in env  → infix "WHS" (unchanged)
 *   - Compound "ConFinSK_"                     → infix "ConFinSk" (per segment)
 *
 * Detection: if the winning raw prefix ends with '_', lower each PascalCase
 * segment on its own (see toExtensionInfixCase) — flattening the whole token
 * would turn "ConFinSK" into "Confinsk".
 *
 * When `modelName` is given and that model's own extensions already state their
 * infix, it is used verbatim instead of being derived. The two are genuinely
 * independent: model Demo names regular objects "DEMO_Foo" but its extensions
 * "AssetBookTable.DEMOExtension" — deriving would produce "DemoExtension" and
 * every name would silently diverge from the model's existing convention.
 */
export declare function deriveExtensionInfix(resolvedPrefix: string, modelName?: string): string;
/**
 * Resolve the literal prefix TOKEN that `applyObjectPrefix` prepends to a
 * REGULAR (non-extension) new object name for the CURRENT session — i.e. the
 * exact substring that will appear at the start of e.g. an EDT/table/class
 * Name in generated metadata (`{token}{ObjectName}`).
 *
 * Factored out of `applyObjectPrefix`'s "regular objects" branch (same
 * underscore-style-vs-PascalCase derivation) so other callers that need to
 * recognise/strip this token from ALREADY-GENERATED names — notably the eval
 * golden oracle's prefix-agnostic comparison (src/eval/oracle/normalize.ts,
 * see docs/AGENT_EVAL_LOOP.md §6.2) — don't have to duplicate the branching
 * logic. Returns '' when no prefix is configured.
 */
export declare function resolveRegularObjectPrefixToken(modelName?: string): string;
/**
 * Apply prefix to a NEW model element name.
 * Per MS guidelines, the prefix is concatenated directly (no separator):
 *   WHSMyTable, MyPrefixMyClass, ContosoMyForm
 *
 * Underscore-style prefixes (EXTENSION_PREFIX="XY_") are handled specially:
 *   - Regular objects (classes, tables, forms, …): prefix kept with underscore
 *       XY_CustTable, XY_MyClass  (NOT XyCustTable)
 *   - Extension elements (dot-notation or _Extension class infix): PascalCase, no underscore
 *       CustTable.XyExtension, CustTableXy_Extension  (NOT CustTable.XY_Extension)
 *
 * CRITICAL for extension classes: If EXTENSION_PREFIX is set in .env,
 * it should be used EXCLUSIVELY - never combined with modelName prefix.
 * The function receives the ALREADY RESOLVED prefix (from resolveObjectPrefix),
 * so it strips any existing suffix-prefix and replaces it with the current one.
 *
 * Case-insensitive check prevents double-prefixing.
 *
 * ALWAYS pass `modelName` when you know it. Omitting it does not merely lose the
 * model-name naming style — it changes the regular-object result, because the raw
 * prefix then falls back to EXTENSION_PREFIX and the model's own separator is
 * invisible: a model whose objects are "ConSK_*" yields "ConSK_QualityTier"
 * with the argument and "ConSKQualityTier" without it. prepare(mode="create")
 * predicted names through the 2-arg form while d365fo_file(action="create") wrote
 * them through the 3-arg form, so the two disagreed on every underscore-style model.
 * Prefer normalizeObjectName() (utils/objectNaming.ts), which is the one path
 * create/modify already share.
 */
export declare function applyObjectPrefix(objectName: string, prefix: string, modelName?: string): string;
/**
 * Check if a model is custom (case-insensitive)
 * @param modelName - Name of the model to check
 * @returns true if model is custom, false if standard
 */
export declare function isCustomModel(modelName: string): boolean;
/**
 * Check if a model is standard (opposite of custom)
 * @param modelName - Name of the model to check
 * @returns true if model is standard Microsoft model
 */
export declare function isStandardModel(modelName: string): boolean;
//# sourceMappingURL=modelClassifier.d.ts.map