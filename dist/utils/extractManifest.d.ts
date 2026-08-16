/**
 * Extract manifest — the bridge between `extract-metadata` and `build-database`.
 *
 * `extract-metadata` knows which models are custom (including UDE auto-detection from the
 * ModelStoreFolder, where CUSTOM_MODELS is intentionally empty). `build-database` runs as a
 * separate process that only sees CUSTOM_MODELS and therefore cannot repeat that detection.
 *
 * To keep the two phases' notion of "custom" in agreement without a hand-maintained
 * CUSTOM_MODELS list, `extract-metadata` records the models it classified as custom in this
 * manifest, written into the metadata output directory, and `build-database` reads it when
 * scoping a `custom` rebuild.
 */
/** File written into the metadata output directory. Not a model dir — scanners skip files. */
export declare const EXTRACT_MANIFEST_FILENAME = ".extract-manifest.json";
export interface ExtractManifest {
    /** ISO timestamp of the extract run that produced this manifest. */
    generatedAt: string;
    /** EXTRACT_MODE of the run: 'all' | 'custom' | 'standard'. */
    extractMode: string;
    /** 'ude' when custom models were path-auto-detected, else 'traditional'. */
    environment: 'ude' | 'traditional';
    /**
     * Model names the extract run classified as custom (exact on-disk directory names).
     *
     * On UDE this means "non-Microsoft — lives under the custom root", which includes
     * third-party ISV models that ship X++ source. It does NOT mean "models you own" or
     * "models that are safe to write into": the runtime write guard keeps its own name-based
     * `isCustomModel()` classification and does not read this manifest. Consumers that need
     * "is this our code" must not treat this list as an answer to that question.
     *
     * Consumers today, both in `build-database`:
     *  - scoping of a `custom` rebuild;
     *  - `XppSymbolIndex.setNonMicrosoftModels()`, which excludes these models from the
     *    property-stats corpus ("what does the standard platform do"). "Non-Microsoft" is
     *    exactly the right granularity there — ISV conventions are no more platform
     *    convention than ours.
     */
    customModels: string[];
}
/** Write the manifest into `metadataDir`. Best-effort: extraction succeeds even if this fails. */
export declare function writeExtractManifest(metadataDir: string, manifest: ExtractManifest): void;
/**
 * Read the list of custom models recorded by the last extract run.
 * Returns `undefined` when no manifest exists (older extract, or none run yet), so callers
 * can distinguish "no manifest" from "manifest with an empty custom list".
 */
export declare function readExtractedCustomModels(metadataDir: string): string[] | undefined;
//# sourceMappingURL=extractManifest.d.ts.map