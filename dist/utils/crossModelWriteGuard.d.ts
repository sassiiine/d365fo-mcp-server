/**
 * Cross-model write guard.
 *
 * `modify` already refuses to touch objects in standard Microsoft models
 * (isStandardModel), but that check says nothing about the far more common
 * real-world layout: a customer solution split across several CUSTOM models,
 * e.g. a shared `ContosoFinanceCore` plus country models `ContosoFinanceSK` /
 * `ContosoFinanceCZ` that extend it. The workspace's .rnrproj names exactly ONE of
 * them as the target model; every other model is somebody else's code as far as
 * this workspace is concerned.
 *
 * Without this guard the failure is silent and expensive: asked to "add a field
 * to <table>", the agent resolves the table by name, lands in the shared model
 * that happens to own it, and edits it in place. The field is then invisible in
 * the active model's project and version control, and it lands in code every
 * other country model inherits — instead of the one thing that was wanted, a
 * table extension in the active model.
 *
 * ## Consent cannot be self-served
 *
 * The first version of this guard accepted `modelName="<owning model>"` on the
 * call as consent, mirroring the standard-model guard's "explicit modelName =
 * you know what you're doing". For a human that reasoning holds. For an agent it
 * does not: the refusal text told it which parameter to add, so it added the
 * parameter and wrote into the shared model anyway — with a well-argued
 * explanation afterwards. A bypass the caller can mint for itself is not a
 * bypass, it is a speed bump.
 *
 * So consent lives in server configuration, which the caller cannot reach
 * through any tool this server publishes:
 *   - `D365FO_CROSS_MODEL_WRITE_MODELS=ModelA,ModelB` — allow these models,
 *   - `D365FO_ALLOW_CROSS_MODEL_WRITE=true`           — allow any model.
 *
 * It used to take a restart as well, which quietly worked against the guard: the
 * only sanctioned answer cost the user their session, so the pressure was all
 * towards finding a cheaper one. The policy is now re-read from .env on the next
 * attempt (reloadWritePolicy) — the decision stays the user's, it just no longer
 * costs a restart to act on.
 *
 * And the refusal deliberately does NOT hand the caller a workaround: it names
 * the extension route, and says the alternative is the user's decision to make
 * in configuration.
 *
 * ## "The agent has no tool to write it" holds only for THIS server's tools
 *
 * The caller is a coding assistant with generic file editing, and the settings
 * are plain JSON. One refusal was enough for it to find the host's mcp.json and
 * add the allow-list key to the env block itself — writes into the other model
 * then succeeded with a clean ✅, and the only trace was a console.error in a log
 * truncated on every restart, including the one the settings edit triggers.
 *
 * The guard cannot tell which hand wrote its configuration. What it can do is
 * refuse to be quiet: every path that lets a cross-model write through returns a
 * note the caller prints on its result (standDownNotice), so it reaches the
 * transcript rather than a log nobody opens.
 */
/** An extension of the target object that already exists in the active model. */
export interface ExistingExtension {
    name: string;
    type: string;
}
export interface CrossModelWriteCheck {
    /** Object being written, as resolved (may already be an extension). */
    objectName: string;
    /** d365fo_file objectType, e.g. 'table', 'table-extension', 'class'. */
    objectType: string;
    /** Model that owns the write target (the `<Model>` path segment, or the model asked for). */
    owningModel: string | null | undefined;
    /**
     * `<Package>` segment of the same path. A match on EITHER segment counts as
     * "same model": most custom models sit in a package of the same name, but a
     * configured model name occasionally matches only the package (several models
     * in one package, or a model folder named after the package). Accepting both
     * keeps the guard from firing on the workspace's own objects.
     */
    owningPackage?: string | null;
    /**
     * Model the workspace targets (.rnrproj / D365FO_MODEL_NAME) — the WRITE ANCHOR,
     * `configManager.getWriteAnchorModel()`. Not simply "the current active model":
     * after a tool-initiated project switch those differ, and taking the switched
     * value here would let the caller move the target it is being measured against.
     */
    activeModel: string | null | undefined;
    /**
     * Model a `get_workspace_info(projectName=…)` switch made active during this
     * session, when that differs from the anchor. Wording only — it names the
     * bypass out loud instead of letting it read as an unrelated refusal.
     */
    toolSwitchedModel?: string | null;
    /** Extensions of the base object that already exist in the active model. */
    existingExtensions?: ExistingExtension[];
    /** Wording only — what the caller was about to do. */
    action?: 'modify' | 'create';
}
/**
 * A description of the cross-model allowance currently in force, or null.
 *
 * Surfaced by get_workspace_info so the state is visible without performing a
 * write to discover it. An allowance nobody remembers granting is the dangerous
 * kind — see the header.
 */
export declare function activeCrossModelAllowance(): string | null;
/**
 * The note to print on a write the guard let through into ANOTHER model.
 *
 * Two paths reach a foreign model without a refusal, and both were silent:
 *   • no anchor to compare against, so the guard stood down rather than block
 *     on a guess;
 *   • configuration allows this model — a decision someone made, and "someone"
 *     is not necessarily the user (see the header).
 * Either way the write lands in code this workspace only consumes, so it belongs
 * in the reply, not only in a log a restart truncates.
 *
 * Returns '' for a write that stayed inside the active model, which is almost
 * every write — callers can concatenate it unconditionally.
 */
export declare function standDownNotice(check: CrossModelWriteCheck): string;
/**
 * True when the OPERATOR has allowed writes into `owningModel` from another
 * workspace — a blanket opt-out, or an explicit per-model allow-list. Both live
 * in the environment: a caller cannot grant this to itself mid-conversation.
 */
export declare function crossModelWriteAllowedByConfig(owningModel: string): boolean;
/** The base object an extension extends: "CustTable.FooExtension" → "CustTable". */
export declare function baseObjectOf(objectName: string, objectType: string): string;
/**
 * The name the extension WOULD get in `activeModel`, following that model's own
 * naming (prefix inference + EXTENSION_NAMING_STYLE), or null when the type has
 * no extension form. Class extensions use the `{Base}{Infix}_Extension` shape;
 * everything else the dot-notation element form.
 */
export declare function suggestedExtensionName(baseObject: string, baseType: string, activeModel: string): string | null;
/**
 * Refusal message for a write into a model other than the active one, or null
 * when the write is allowed.
 */
export declare function crossModelWriteRefusal(check: CrossModelWriteCheck): string | null;
//# sourceMappingURL=crossModelWriteGuard.d.ts.map