/**
 * Op-spec lookup — the on-demand replacement for the parameter contracts that
 * used to be inlined in the `d365fo_file` and `generate_object` wire schemas.
 *
 * Issue #825: those two schemas were 18,5 KB of the 63 KB ListTools payload,
 * re-sent on every request, because each inlined a discriminated union of every
 * operation and its parameters. The discriminators (`action`, `operation`,
 * `objectType`, `mode`, `pattern`) stay in the schema as closed enums — the
 * parameters behind the one the agent picks are fetched here, once.
 *
 * Reachable as get_knowledge(kind="op-spec", topic="<operation|objectType|mode>");
 * every validation error that reports a missing parameter names that call, so
 * the contract is never more than one lookup away.
 */
/** Every topic the lookup answers, grouped for the index listing. */
export declare function opSpecTopics(): {
    modifyOperations: string[];
    createObjectTypes: string[];
    generateModes: string[];
};
/** The catalogue returned when no topic (or an unrecognised one) is given. */
export declare function renderOpSpecIndex(unknownTopic?: string): string;
/**
 * The op-spec section `prepare` carries in its own output.
 *
 * Deferring the parameter contracts out of the wire schema (#825) traded schema
 * bytes for a DISCOVERY HOP: nearly every write flow then spent a round trip on
 * get_knowledge(kind="op-spec", …) — or, worse, a failed write that returned the
 * spec in its error. prepare already knows the objectType and, for a change, the
 * method, so it can hand the contract over in the call the agent was making
 * anyway. That is a few hundred bytes against a whole round trip.
 *
 * `operation` is used when the caller names one. Otherwise a change targeting a
 * method is going to write one, so add-method's contract is the right guess; a
 * change with no method has no confident guess and only gets the pointer.
 */
export declare function renderPrepareOpSpec(args: {
    mode: 'change' | 'create';
    objectType?: string;
    operation?: string;
    methodName?: string;
}): string[];
/**
 * Resolve one topic to its full parameter contract. Resolution order is
 * modify operation → generate_object mode → create objectType; the three key
 * spaces do not overlap, so the order only decides what an ambiguous future
 * key would hit.
 */
export declare function lookupOpSpec(topic?: string): string;
//# sourceMappingURL=opSpecs.d.ts.map