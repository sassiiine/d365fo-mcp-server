/**
 * Resolving the `projectName` argument of get_workspace_info to one project.
 *
 * The rule this module exists to enforce: a project identifies its model, never
 * the other way round. A .rnrproj states its model in its own PropertyGroup —
 *
 *   <Model>ContosoFin</Model>
 *
 * — so going project → model is a read of a declared fact. Going model →
 * project is a guess, because a model is built by as many projects as its
 * owner cares to split it into. In the solution this bug was found in, fifteen
 * .rnrproj files declare `ContosoFin`.
 *
 * The previous implementation took the first of those fifteen:
 *
 *   allProjects.find(p => p.modelName.toLowerCase() === needle)
 *     ?? allProjects.find(p => p.modelName.toLowerCase().includes(needle))
 *
 * An agent that switched away to read another model and then switched "back"
 * by model name did not come back — it landed on a same-model project it had
 * never asked for, and every subsequent write registered itself there. The
 * workspace's own project was never touched, and nothing in the run said so.
 *
 * So: match on project IDENTITY first (its file name, or its path), and fall
 * back to the model name only when exactly one project claims it. More than
 * one and this returns `ambiguous` — the caller lists them and picks nothing.
 * Refusing to choose is the entire point; a wrong project here is silent and
 * only shows up as a model that does not build.
 */
import type { D365ProjectInfo } from '../utils/workspaceDetector.js';
/** How a needle was matched, for the switch note the tool prints. */
export type ProjectMatchKind = 'project-path' | 'project-file' | 'model';
export type ProjectSelection = {
    kind: 'resolved';
    project: D365ProjectInfo;
    matchedOn: ProjectMatchKind;
} | {
    kind: 'ambiguous';
    needle: string;
    matchedOn: ProjectMatchKind;
    candidates: D365ProjectInfo[];
} | {
    kind: 'none';
    needle: string;
};
export declare function selectProject(projectName: string, allProjects: readonly D365ProjectInfo[]): ProjectSelection;
/** The list an ambiguous or failed selection prints. One line per project. */
export declare function renderProjectCandidates(candidates: readonly D365ProjectInfo[]): string;
/** The whole message for a `projectName` that could not be resolved to one project. */
export declare function renderSelectionFailure(selection: Extract<ProjectSelection, {
    kind: 'ambiguous' | 'none';
}>, allProjects: readonly D365ProjectInfo[]): string;
//# sourceMappingURL=projectSelector.d.ts.map