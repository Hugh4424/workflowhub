import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Stage assumed for a task that has no stage row recorded yet. Every task
 * starts its life here, so treating an unlabelled facts file as "build-code"
 * keeps callers from having to special-case brand-new tasks.
 */
export const DEFAULT_STAGE = 'build-code';

function toPath(file) {
  if (file instanceof URL) return fileURLToPath(file);
  if (typeof file === 'string') return file;
  throw new TypeError(
    `stageFor(file): expected a path string or file URL, received ${Object.prototype.toString.call(file)}`,
  );
}

/**
 * Return the stage recorded by a task facts file (JSONL).
 *
 * Rows are scanned in file order and the first row carrying a non-empty
 * `stage` decides the answer. Files with no stage row at all fall back to
 * DEFAULT_STAGE.
 *
 * @param {string | URL} file path or file URL of the JSONL facts file
 * @returns {Promise<string>} stage name
 */
export async function stageFor(file) {
  const text = await readFile(toPath(file), 'utf8');

  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const row = JSON.parse(line);
    if (typeof row.stage === 'string' && row.stage.trim() !== '') {
      return row.stage;
    }
  }

  return DEFAULT_STAGE;
}
