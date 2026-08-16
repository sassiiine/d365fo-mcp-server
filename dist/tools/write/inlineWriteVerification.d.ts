/**
 * Inline post-write verification for the create/modify paths.
 *
 * The conventional loop is create → verify_d365fo_project → run_bp_check: two
 * extra round trips per object, both asking questions the writing call already
 * had the answers to. It knows the path it wrote and the project it registered
 * the file in; checking that the bytes are on disk and that the .rnrproj really
 * references them is two filesystem reads, not a round trip.
 *
 * Kept deliberately narrow. This is NOT verify_d365fo_project — that tool sweeps
 * a whole project and cross-checks every object, which is a different job and
 * still worth its own call. This answers only "did the thing I just claimed to
 * do actually land", which is precisely the question the follow-up call was
 * being spent on.
 */
import { type Membership } from '../../workspace/projectMembership.js';
/**
 * The membership question for an object, with the model's other projects filled
 * in. Call sites pass the model they just wrote into; everything else is looked
 * up here so a caller cannot forget the siblings and silently get the old
 * active-project-only answer back.
 */
export declare function membershipOf(objectType: string, objectName: string, modelName: string | null | undefined): {
    axFolder: string;
    objectName: string;
    siblingProjectPaths: string[];
};
export interface WriteVerification {
    /** The file exists on disk and is non-empty. */
    onDisk: boolean;
    /** Byte length written, when readable. */
    bytes?: number;
    /**
     * Where the object is registered across the projects of its model. Undefined
     * when no project could be read — see projectMembership.ts for why this is a
     * membership question and not a path comparison.
     */
    membership?: Membership;
    /** AOT folder and name the membership answer is about, for the message. */
    axFolder?: string;
    objectName?: string;
}
/**
 * Check that a just-written file is where it should be. Never throws.
 *
 * `siblingProjectPaths` are the other .rnrproj of the same model. Supply them
 * and an object referenced by one of those is reported as such rather than as
 * missing — the distinction matters, because only one of the two stops the
 * build, and they call for different fixes.
 */
export declare function verifyWrittenFile(filePath: string | undefined, projectPath?: string, membershipOf?: {
    axFolder: string;
    objectName: string;
    siblingProjectPaths?: readonly string[];
}): Promise<WriteVerification>;
/**
 * Opt-in best-practice check on the object just written.
 *
 * Off by default and deliberately so: xppbp needs the compiler and takes
 * seconds, which is the wrong trade for the common case. But when the caller
 * knows it wants one — the last object of a feature, say — running it here
 * saves the round trip that the separate run_bp_check call costs, and this call
 * already knows the object's type and name.
 *
 * `bpCheck` is not in the wire schema; it is accepted nested in `params` like
 * every other d365fo_file knob, and documented in the op-spec. It costs no
 * schema bytes and the budget has none to spare.
 */
export declare function runInlineBpCheck(bpCheck: unknown, objectType: string, objectName: string, context: unknown): Promise<string>;
/** One-line summary for a write response, or '' when there is nothing worth saying. */
export declare function renderWriteVerification(v: WriteVerification): string;
//# sourceMappingURL=inlineWriteVerification.d.ts.map