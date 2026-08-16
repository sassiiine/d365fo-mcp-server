/**
 * Prompt helpers — thin wrapper over @clack/prompts with uniform
 * cancel handling (Ctrl+C / Esc exits the CLI cleanly instead of
 * returning a cancel symbol every caller must check).
 */
import * as p from '@clack/prompts';
import type { Option } from '@clack/prompts';
export { p };
/** Unwrap a clack result; exit gracefully when the user cancelled. */
export declare function ensure<T>(value: T | symbol): T;
export declare function askText(opts: {
    message: string;
    placeholder?: string;
    initialValue?: string;
    required?: boolean;
}): Promise<string>;
export declare function askConfirm(message: string, initialValue?: boolean): Promise<boolean>;
export declare function askSelect<T extends string>(message: string, options: Option<T>[], initialValue?: T): Promise<T>;
/**
 * Guard for commands that need a full installation (setup, update, index) —
 * a git checkout, or an npm install carrying the dist/scripts bundles. Running
 * from the npx cache of an older release has neither, so point the user at the
 * installer instead of failing halfway through a rebuild.
 */
export declare function requireFullInstall(): boolean;
//# sourceMappingURL=ui.d.ts.map