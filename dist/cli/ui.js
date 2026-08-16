/**
 * Prompt helpers — thin wrapper over @clack/prompts with uniform
 * cancel handling (Ctrl+C / Esc exits the CLI cleanly instead of
 * returning a cancel symbol every caller must check).
 */
import * as p from '@clack/prompts';
import { installOneLiner, isFullInstall } from './context.js';
export { p };
/** Unwrap a clack result; exit gracefully when the user cancelled. */
export function ensure(value) {
    if (p.isCancel(value)) {
        p.cancel('Cancelled.');
        process.exit(0);
    }
    return value;
}
export async function askText(opts) {
    const v = ensure(await p.text({
        message: opts.message,
        placeholder: opts.placeholder,
        initialValue: opts.initialValue,
        validate: opts.required ? (s) => (s?.trim() ? undefined : 'Required') : undefined,
    }));
    return (v ?? '').trim();
}
export async function askConfirm(message, initialValue = true) {
    return ensure(await p.confirm({ message, initialValue }));
}
export async function askSelect(message, options, initialValue) {
    return ensure(await p.select({ message, options, initialValue }));
}
/**
 * Guard for commands that need a full installation (setup, update, index) —
 * a git checkout, or an npm install carrying the dist/scripts bundles. Running
 * from the npx cache of an older release has neither, so point the user at the
 * installer instead of failing halfway through a rebuild.
 */
export function requireFullInstall() {
    if (isFullInstall)
        return true;
    p.log.error('This copy of d365fo-mcp is not a full installation — it can only run `connect`.');
    p.log.info('Install the server with PowerShell:\n' +
        `  ${installOneLiner}\n` +
        'or update this copy in place:\n' +
        '  npm install -g d365fo-mcp@latest');
    process.exitCode = 1;
    return false;
}
//# sourceMappingURL=ui.js.map