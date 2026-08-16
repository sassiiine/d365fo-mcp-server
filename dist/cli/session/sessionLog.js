/**
 * Host-agnostic shape of an agent session, plus the reader that sniffs which
 * host wrote a log.
 *
 * The cost method in #824 needs only per-request token classes and the tool
 * calls between requests — nothing host-specific — so every host format is
 * reduced to this one shape and the arithmetic in analyze.ts never learns
 * which editor produced the log. Copilot Chat's `main.jsonl` is the only
 * format we have a worked example for; a second reader is a new module and a
 * new entry in `READERS`, not a change to the analysis.
 */
import * as fs from 'node:fs';
import { readCopilotChatLog, sniffCopilotChatLog } from './copilotChatLog.js';
const READERS = [
    { format: 'copilot-chat/main.jsonl', sniff: sniffCopilotChatLog, read: readCopilotChatLog },
];
/**
 * Read a session log, choosing the reader by content rather than by filename —
 * hosts all call the file something different, and `main.jsonl` is not a name
 * anyone would guess.
 *
 * Fails loudly on an unrecognised log. Guessing here would produce a confident
 * cost number from a file that is not a session at all, which is the one
 * outcome this command exists to prevent.
 */
export function readSessionLog(path, formatHint) {
    if (!fs.existsSync(path)) {
        throw new Error(`No such log: ${path}`);
    }
    const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0)
        throw new Error(`Log is empty: ${path}`);
    if (formatHint) {
        const chosen = READERS.find(r => r.format === formatHint);
        if (!chosen) {
            throw new Error(`Unknown --format '${formatHint}'. Known formats: ${READERS.map(r => r.format).join(', ')}`);
        }
        return chosen.read(lines);
    }
    const reader = READERS.find(r => r.sniff(lines));
    if (!reader) {
        throw new Error(`Unrecognised session log: ${path}\n` +
            `Known formats: ${READERS.map(r => r.format).join(', ')}.\n` +
            'For GitHub Copilot Chat the file is %APPDATA%/Code/User/workspaceStorage/*/GitHub.copilot-chat/debug-logs/<sessionId>/main.jsonl ' +
            '(newest directory = most recent session), and it only exists while chat debug logging is on.');
    }
    return reader.read(lines);
}
export const KNOWN_FORMATS = READERS.map(r => r.format);
//# sourceMappingURL=sessionLog.js.map