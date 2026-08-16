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
import * as fs from 'fs/promises';
import { resolveMembership, renderMembership, axFolderForObjectType, } from '../../workspace/projectMembership.js';
import { getConfigManager } from '../../utils/configManager.js';
/**
 * The model's other .rnrproj, or none — never a throw.
 *
 * Everything in this module is advisory: the write has already happened and
 * succeeded by the time any of it runs, so a diagnostic that raises turns a good
 * write into a reported failure. That is not hypothetical — this call is
 * evaluated as an ARGUMENT to verifyWrittenFile, outside its try, so an
 * exception here skips the verification entirely and surfaces as the write
 * failing. Degrading to "no siblings known" costs a less specific message and
 * nothing else.
 */
function projectsForModelSafe(modelName) {
    try {
        return getConfigManager().getProjectsForModel?.(modelName) ?? [];
    }
    catch {
        return [];
    }
}
/**
 * The membership question for an object, with the model's other projects filled
 * in. Call sites pass the model they just wrote into; everything else is looked
 * up here so a caller cannot forget the siblings and silently get the old
 * active-project-only answer back.
 */
export function membershipOf(objectType, objectName, modelName) {
    return {
        axFolder: axFolderForObjectType(objectType),
        objectName,
        siblingProjectPaths: projectsForModelSafe(modelName),
    };
}
/**
 * Check that a just-written file is where it should be. Never throws.
 *
 * `siblingProjectPaths` are the other .rnrproj of the same model. Supply them
 * and an object referenced by one of those is reported as such rather than as
 * missing — the distinction matters, because only one of the two stops the
 * build, and they call for different fixes.
 */
export async function verifyWrittenFile(filePath, projectPath, membershipOf) {
    if (!filePath)
        return { onDisk: false };
    try {
        const stat = await fs.stat(filePath);
        const result = { onDisk: stat.isFile() && stat.size > 0, bytes: stat.size };
        if (membershipOf && (projectPath || membershipOf.siblingProjectPaths?.length)) {
            result.membership = await resolveMembership(membershipOf.axFolder, membershipOf.objectName, projectPath, membershipOf.siblingProjectPaths ?? []);
            result.axFolder = membershipOf.axFolder;
            result.objectName = membershipOf.objectName;
        }
        return result;
    }
    catch {
        return { onDisk: false };
    }
}
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
export async function runInlineBpCheck(bpCheck, objectType, objectName, context) {
    if (bpCheck !== true && bpCheck !== 'true')
        return '';
    try {
        const { runBpCheckTool } = await import('../sdlc/runBpCheck.js');
        const result = await runBpCheckTool({ objects: [{ objectType, objectName }] }, context);
        const text = (result?.content ?? [])
            .filter((c) => c?.type === 'text' && typeof c.text === 'string')
            .map((c) => c.text)
            .join('\n')
            .trim();
        return text ? `\n\n### Best-practice check (bpCheck=true)\n${text}` : '';
    }
    catch (e) {
        // Never turn a successful write into a failure over an advisory check.
        return `\n⚠️ bpCheck requested but could not run: ${e?.message ?? e}`;
    }
}
/** One-line summary for a write response, or '' when there is nothing worth saying. */
export function renderWriteVerification(v) {
    if (!v.onDisk) {
        return `\n❌ Verification: the file is NOT on disk after a reported success — treat this write as failed.`;
    }
    const parts = [`on disk (${v.bytes} bytes)`];
    if (v.membership?.status === 'active')
        parts.push('referenced by the .rnrproj');
    const verified = `\n✅ Verified: ${parts.join(', ')}`;
    // Only 'other' and 'missing' have something to add; 'active' and 'unknown'
    // are the quiet cases, and quiet is what makes the loud ones mean anything.
    const note = v.membership
        ? renderMembership(v.membership, v.axFolder ?? '', v.objectName ?? '')
        : '';
    return note ? verified + note : `${verified}.`;
}
//# sourceMappingURL=inlineWriteVerification.js.map