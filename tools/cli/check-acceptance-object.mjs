import { readFileSync, statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const template = new URL('../../skills/spec-specify/templates/spec-template.md', import.meta.url);
const marker = '<!-- c01-acceptance-object-check -->';

function argumentsFor(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i];
    if (!['--spec', '--context', '--root', '--check-sources'].includes(name)) {
      throw new Error(`unknown argument: ${name}`);
    }
    if (Object.hasOwn(options, name)) throw new Error(`duplicate argument: ${name}`);
    if (name === '--check-sources') options[name] = true;
    else {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`missing value: ${name}`);
      options[name] = value;
    }
  }
  if (!options['--spec']) throw new Error('验收对象 requires --spec');
  return options;
}

function acceptanceObject(markdown) {
  // Ignore headings inside fenced examples; only the named section supplies input.
  const lines = markdown.split(/\r?\n/u);
  let fence = null;
  let depth = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    if (fence) {
      if (new RegExp(`^ {0,3}${fence.char}{${fence.length},}\\s*$`, 'u').test(line)) fence = null;
      continue;
    }
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line);
    if (heading) {
      if (depth !== null && heading[1].length <= depth) break;
      if (depth === null && heading[2] === '验收对象') depth = heading[1].length;
    }
    if (!opening) continue;
    fence = { char: opening[1][0], length: opening[1].length };
    if (depth === null || opening[2].trim() !== 'json') continue;
    const end = new RegExp(`^ {0,3}${fence.char}{${fence.length},}\\s*$`, 'u');
    let j = i + 1;
    while (j < lines.length && !end.test(lines[j])) j += 1;
    if (j === lines.length) throw new Error('验收对象 JSON fence is not closed');
    try { return JSON.parse(lines.slice(i + 1, j).join('\n')); }
    catch (error) { throw new Error(`验收对象 JSON: ${error.message}`, { cause: error }); }
  }
  throw new Error('验收对象 section with a JSON block is required');
}

function templateProducer() {
  const text = readFileSync(template, 'utf8');
  const parts = text.split(marker);
  if (parts.length !== 2) throw new Error('source/producer: expected exactly one acceptance marker');
  const block = /^\s*```(?:javascript|js)\s*\n([\s\S]*?)\n```/u.exec(parts[1]);
  if (!block || !/^export\s+function\s+checkAcceptanceObject\(/u.test(block[1])) {
    throw new Error('source/producer: missing immediate named export block');
  }
  const code = block[1].replace(/^export\s+/u, '');
  try {
    return runInNewContext(`${code}\ncheckAcceptanceObject;`, Object.create(null), {
      timeout: 1000, filename: fileURLToPath(template),
    });
  } catch (error) { throw new Error(`source/producer: ${error.message}`, { cause: error }); }
}

function missingSources(context, root) {
  const missing = [];
  // Explicit local path syntax retains the original file-source contract.
  // Bare names such as LICENSE need call-local intent, never a word heuristic.
  const keys = context?.file_source_keys === undefined ? [] : context.file_source_keys;
  if (!Array.isArray(keys)) throw new TypeError('file_source_keys must be an array of source keys');
  const sources = context?.sources;
  const seen = new Set();
  for (const key of keys) {
    if (typeof key !== 'string' || !key || seen.has(key)) {
      throw new TypeError('file_source_keys must contain unique nonempty source keys');
    }
    seen.add(key);
    if (!sources || !Object.hasOwn(sources, key) || typeof sources[key] !== 'string' || !sources[key]) {
      throw new TypeError(`file source ${key}: expected an own source key with a nonempty literal file path`);
    }
  }
  for (const [key, path] of Object.entries(sources ?? {})) {
    if (typeof path === 'string' && (isAbsolute(path) || /^\.{1,2}\//u.test(path)
      || (path.includes('/') && !/[\s#:]/u.test(path)))) seen.add(key);
  }
  if (seen.size === 0) {
    process.stderr.write('check-acceptance-object: no local file sources selected; no local file existence checks performed\n');
  }
  for (const key of seen) {
    const path = sources[key];
    try {
      if (!statSync(resolve(root, path)).isFile()) missing.push({ key, path });
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
      missing.push({ key, path });
    }
  }
  return missing;
}

/** Thin adapter: the template alone decides required fields and UI applicability. */
export function main(argv) {
  try {
    const options = argumentsFor(argv);
    const input = acceptanceObject(readFileSync(options['--spec'], 'utf8'));
    const context = options['--context'] ? JSON.parse(readFileSync(options['--context'], 'utf8')) : {};
    const result = templateProducer()(input, context);
    const missing_source_files = options['--check-sources']
      ? missingSources(context, resolve(options['--root'] ?? process.cwd())) : [];
    const output = { ...result, ok: result.ok && missing_source_files.length === 0, missing_source_files };
    process.stdout.write(`${JSON.stringify(output)}\n`);
    return output.ok ? 0 : 1;
  } catch (error) {
    process.stderr.write(`check-acceptance-object: ${error.name}: ${error.message}\n`);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
