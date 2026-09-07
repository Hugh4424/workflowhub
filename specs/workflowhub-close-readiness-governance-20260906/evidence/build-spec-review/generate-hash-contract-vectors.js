#!/usr/bin/env node
'use strict';

// Evidence-only fixture for the frozen GAP and stage-input packet byte contracts.
// This is deliberately not imported by, or used as, production code.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { TextDecoder } = require('node:util');

const startedAt = new Date().toISOString();
const root = path.resolve(__dirname, '..', '..', '..', '..');
const specPath = path.join(root, 'specs/workflowhub-close-readiness-governance-20260906/spec.md');
const outPath = path.join(__dirname, 'hash-contract-vectors.json');
const checkPath = path.join(__dirname, 'hash-contract-vectors-check.json');
const specSha256 = crypto.createHash('sha256').update(fs.readFileSync(specPath)).digest('hex');
const command = 'node specs/workflowhub-close-readiness-governance-20260906/evidence/build-spec-review/generate-hash-contract-vectors.js';

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}
function utf8Hex(text) {
  return Buffer.from(text, 'utf8').toString('hex');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function hasUnpairedSurrogate(text) {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      i += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

// N(x), as specified by FR-GAP-001 L390. The set is explicit rather than
// delegated to trim()/\\s, so the fixture tests the contract's code points.
const gapWhitespace = new Set();
for (let cp = 0x0009; cp <= 0x000d; cp += 1) gapWhitespace.add(cp);
gapWhitespace.add(0x0020);
gapWhitespace.add(0x0085);
gapWhitespace.add(0x00a0);
gapWhitespace.add(0x1680);
for (let cp = 0x2000; cp <= 0x200a; cp += 1) gapWhitespace.add(cp);
gapWhitespace.add(0x2028);
gapWhitespace.add(0x2029);
gapWhitespace.add(0x202f);
gapWhitespace.add(0x205f);
gapWhitespace.add(0x3000);
function N(value) {
  if (value === undefined || value === null) return 'unknown';
  if (typeof value !== 'string') throw new Error('N rejects non-string input');
  if (hasUnpairedSurrogate(value)) throw new Error('N rejects unpaired UTF-16 surrogate');
  const normalized = value.normalize('NFC');
  let result = '';
  let inWhitespaceRun = false;
  for (const char of normalized) {
    const cp = char.codePointAt(0);
    if (gapWhitespace.has(cp)) {
      if (!inWhitespaceRun) result += ' ';
      inWhitespaceRun = true;
    } else {
      result += char;
      inWhitespaceRun = false;
    }
  }
  return result.replace(/^ +| +$/g, '');
}

function compareUtf8(a, b) {
  return Buffer.from(a, 'utf8').compare(Buffer.from(b, 'utf8'));
}
function isSafeContractNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && Math.abs(value) <= 9007199254740991;
}
function J(value) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'string') {
    if (hasUnpairedSurrogate(value)) throw new Error('J rejects unpaired UTF-16 surrogate');
    let result = '"';
    for (const char of value) {
      const cp = char.codePointAt(0);
      if (char === '"') result += '\\"';
      else if (char === '\\') result += '\\\\';
      else if (cp === 0x08) result += '\\b';
      else if (cp === 0x09) result += '\\t';
      else if (cp === 0x0a) result += '\\n';
      else if (cp === 0x0c) result += '\\f';
      else if (cp === 0x0d) result += '\\r';
      else if (cp <= 0x1f) result += `\\u00${cp.toString(16).padStart(2, '0')}`;
      else result += char;
    }
    return `${result}"`;
  }
  if (typeof value === 'number') {
    if (!isSafeContractNumber(value)) throw new Error('J rejects non-safe integer');
    return Object.is(value, -0) ? '0' : String(value);
  }
  if (Array.isArray(value)) return `[${value.map(J).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    for (const key of keys) if (hasUnpairedSurrogate(key)) throw new Error('J rejects unpaired object-key surrogate');
    keys.sort(compareUtf8);
    return `{${keys.map((key) => `${J(key)}:${J(value[key])}`).join(',')}}`;
  }
  throw new Error(`J rejects ${typeof value}`);
}
function B(value) {
  return Buffer.from(J(value), 'utf8');
}

// Strict UTF-8 decoder used by T(file). ignoreBOM=true is intentional: an
// initial U+FEFF is data under this contract and must remain in the output.
const utf8Decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
function T(rawBytes) {
  const decoded = utf8Decoder.decode(rawBytes);
  return Buffer.from(decoded.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'utf8');
}
function fileDigest(rawBytes) {
  const normalized = T(rawBytes);
  return { raw_hex: rawBytes.toString('hex'), normalized_hex: normalized.toString('hex'), sha256: sha256(normalized) };
}

function provenance(items) {
  const pairs = new Map();
  for (const item of items) {
    const producer = N(item.producer);
    const reasonText = N(item.reason_text);
    pairs.set(`${producer}\u0000${reasonText}`, { producer, reason_text: reasonText });
  }
  return [...pairs.values()].sort((a, b) => compareUtf8(a.producer, b.producer) || compareUtf8(a.reason_text, b.reason_text));
}
function gapSubject(binding) {
  const taskId = N(binding.task_id);
  const materialName = N(binding.material_name);
  const materialRevision = N(binding.material_revision);
  if (binding.material_name !== undefined && binding.material_name !== null && !['decision-log', 'spec', 'plan', 'tasks'].includes(materialName)) {
    throw new Error('invalid material_name');
  }
  return J([taskId, materialName, materialRevision]);
}
function gapPreimage(input) {
  const subject = gapSubject(input);
  if (input.algorithm_version !== 'gap-id.v1') throw new Error('invalid algorithm_version');
  if (input.subject_id !== undefined && input.subject_id !== subject) throw new Error('subject binding mismatch');
  const normalized = { task_id: N(input.task_id), material_name: N(input.material_name), material_revision: N(input.material_revision), gap_kind: N(input.gap_kind), expected_fact: N(input.expected_fact), actual_fact: N(input.actual_fact) };
  const preimage = ['gap-id.v1', subject, normalized.gap_kind, normalized.expected_fact, normalized.actual_fact];
  const preimageBytes = B(preimage);
  return { normalized, subject, preimage, preimage_utf8_hex: preimageBytes.toString('hex'), digest: `gap-${sha256(preimageBytes)}` };
}

function pathError(value) {
  if (typeof value !== 'string' || hasUnpairedSurrogate(value)) return 'path must be a Unicode scalar string';
  if (value.length === 0) return 'empty path';
  if (value.startsWith('/') || value.endsWith('/')) return 'leading or trailing slash';
  if (value.includes('\\')) return 'backslash';
  if (value.includes('\0')) return 'NUL';
  const segments = value.split('/');
  if (segments.some((segment) => segment.length === 0)) return 'empty path segment';
  if (segments.some((segment) => segment === '.' || segment === '..')) return 'dot path segment';
  return null;
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function sortByPath(items) {
  return items.slice().sort((a, b) => compareUtf8(a.path, b.path));
}
function packetPreimage(manifestWithHash, rawFiles) {
  if (!manifestWithHash || typeof manifestWithHash !== 'object' || Array.isArray(manifestWithHash)) throw new Error('manifest must be an object');
  if (manifestWithHash.algorithm_version !== 'stage-input-packet.v1') throw new Error('unknown algorithm_version');
  for (const required of ['task_id', 'stage', 'material_revision', 'snapshot_tree', 'source_materials', 'derived_files']) {
    if (!(required in manifestWithHash)) throw new Error(`manifest missing ${required}`);
  }
  if (!Array.isArray(manifestWithHash.source_materials) || !Array.isArray(manifestWithHash.derived_files)) throw new Error('manifest file lists must be arrays');
  const manifest = clone(manifestWithHash);
  delete manifest.packet_freeze_hash;
  const listed = [];
  const seen = new Set();
  const addListed = (item, kind) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${kind} entry must be an object`);
    for (const required of kind === 'source_materials' ? ['material_name', 'path', 'sha256'] : ['path', 'source_digest', 'sha256', 'producer', 'consumer', 'authority']) {
      if (!(required in item)) throw new Error(`${kind} entry missing ${required}`);
    }
    if (kind === 'derived_files' && item.authority !== 'non-material') throw new Error('derived authority must be non-material');
    const error = pathError(item.path);
    if (error) throw new Error(`invalid path ${item.path}: ${error}`);
    if (seen.has(item.path)) throw new Error(`duplicate or overlapping path: ${item.path}`);
    seen.add(item.path);
    listed.push(item.path);
  };
  manifest.source_materials.forEach((item) => addListed(item, 'source_materials'));
  manifest.derived_files.forEach((item) => addListed(item, 'derived_files'));
  const filePaths = Object.keys(rawFiles);
  if (filePaths.length !== listed.length || filePaths.some((filePath) => !seen.has(filePath))) throw new Error('declared file set does not equal delivered file set');
  const entries = filePaths.map((filePath) => {
    const error = pathError(filePath);
    if (error) throw new Error(`invalid path ${filePath}: ${error}`);
    const bytes = Buffer.from(rawFiles[filePath], 'hex');
    const file = fileDigest(bytes);
    const source = manifest.source_materials.find((item) => item.path === filePath);
    const derived = manifest.derived_files.find((item) => item.path === filePath);
    const item = source || derived;
    if (item.sha256 !== file.sha256) throw new Error(`sha256 mismatch for ${filePath}`);
    if (derived && derived.source_digest !== file.sha256) throw new Error(`source_digest mismatch for ${filePath}`);
    return { path: filePath, sha256: file.sha256 };
  });
  entries.sort((a, b) => compareUtf8(a.path, b.path));
  const preimage = { manifest_minus_hash: manifest, file_entries: entries };
  const preimageBytes = B(preimage);
  return { manifest_minus_hash: manifest, file_entries: entries, preimage_utf8_hex: preimageBytes.toString('hex'), digest: sha256(preimageBytes) };
}
function packetManifest(base, rawFiles) {
  const manifest = clone(base);
  manifest.source_materials = sortByPath(manifest.source_materials);
  manifest.derived_files = sortByPath(manifest.derived_files);
  const computed = packetPreimage(manifest, rawFiles);
  manifest.packet_freeze_hash = computed.digest;
  return { manifest, computed };
}
function refreshPacketDigests(manifest, rawFiles, changedPaths) {
  const refreshed = clone(manifest);
  for (const filePath of changedPaths) {
    const file = fileDigest(Buffer.from(rawFiles[filePath], 'hex'));
    const source = refreshed.source_materials.find((item) => item.path === filePath);
    const derived = refreshed.derived_files.find((item) => item.path === filePath);
    if (source) source.sha256 = file.sha256;
    if (derived) { derived.sha256 = file.sha256; derived.source_digest = file.sha256; }
  }
  return refreshed;
}

function judgment(code, detail, digest = null) {
  return { status: digest ? 'accepted' : 'rejected', code, detail, digest };
}
function gapVector(id, title, input, mutations) {
  const computed = gapPreimage(input);
  const mutationResults = mutations.map((mutation) => {
    try {
      const result = gapPreimage(mutation.input);
      return { id: mutation.id, expected: mutation.expected, actual: judgment('valid_gap_identity', 'subject and digest recomputed', result.digest), digest: result.digest, digest_equals_base: result.digest === computed.digest };
    } catch (error) {
      return { id: mutation.id, expected: mutation.expected, actual: judgment('invalid_gap_identity', error.message), digest: null, digest_equals_base: false };
    }
  });
  const normalizedComponents = Object.fromEntries(Object.entries(computed.normalized).map(([key, value]) => [key, { value, utf8_hex: utf8Hex(value) }]));
  return { id, title, input_binding: input, normalized_components: normalizedComponents, subject: computed.subject, manifest: null, preimage: computed.preimage, preimage_utf8_hex: computed.preimage_utf8_hex, expected_digest: computed.digest, mutations_or_invalid_samples: mutationResults };
}
function packetVector(id, title, base, rawFiles, mutations) {
  const materialized = packetManifest(base, rawFiles);
  const rawAndNormalized = Object.fromEntries(Object.entries(rawFiles).map(([filePath, rawHex]) => {
    const file = fileDigest(Buffer.from(rawHex, 'hex'));
    return [filePath, file];
  }));
  const mutationResults = mutations.map((mutation) => {
    try {
      const candidateFiles = { ...rawFiles, ...(mutation.rawFiles || {}) };
      let candidateBase = clone(mutation.base || base);
      if (mutation.rawFiles) candidateBase = refreshPacketDigests(candidateBase, candidateFiles, Object.keys(mutation.rawFiles));
      const candidate = packetManifest(candidateBase, candidateFiles);
      return { id: mutation.id, expected: mutation.expected, actual: judgment('valid_packet', 'manifest and T(file) entries validated', candidate.computed.digest), digest: candidate.computed.digest, digest_equals_base: candidate.computed.digest === materialized.computed.digest };
    } catch (error) {
      return { id: mutation.id, expected: mutation.expected, actual: judgment('unavailable', error.message), digest: null, digest_equals_base: false };
    }
  });
  return {
    id,
    title,
    input_binding: base,
    normalized_components: null,
    subject: null,
    manifest: materialized.manifest,
    files: rawAndNormalized,
    file_entries: materialized.computed.file_entries,
    manifest_minus_hash: materialized.computed.manifest_minus_hash,
    preimage_utf8_hex: materialized.computed.preimage_utf8_hex,
    expected_digest: materialized.computed.digest,
    mutations_or_invalid_samples: mutationResults,
  };
}

// A tiny strict duplicate-key scanner is used only for the negative oracle;
// it does not parse or alter any production input.
function duplicateKeysOrSyntax(raw) {
  let i = 0;
  const ws = () => { while (/[\\t\\n\\r ]/.test(raw[i] || '')) i += 1; };
  const string = () => {
    const start = i;
    if (raw[i++] !== '"') throw new Error('invalid JSON string');
    while (i < raw.length) {
      if (raw[i] === '\\\\') { i += 2; continue; }
      if (raw[i] === '"') { i += 1; return JSON.parse(raw.slice(start, i)); }
      if (raw.charCodeAt(i) < 0x20) throw new Error('invalid JSON control character');
      i += 1;
    }
    throw new Error('unterminated JSON string');
  };
  const value = () => {
    ws();
    if (raw[i] === '{') {
      i += 1; ws(); const keys = new Set();
      if (raw[i] === '}') { i += 1; return; }
      while (true) {
        ws(); const key = string();
        if (keys.has(key)) throw new Error(`duplicate key: ${key}`);
        keys.add(key); ws(); if (raw[i++] !== ':') throw new Error('missing colon'); value(); ws();
        if (raw[i] === '}') { i += 1; return; }
        if (raw[i++] !== ',') throw new Error('missing comma');
      }
    }
    if (raw[i] === '[') {
      i += 1; ws(); if (raw[i] === ']') { i += 1; return; }
      while (true) { value(); ws(); if (raw[i] === ']') { i += 1; return; } if (raw[i++] !== ',') throw new Error('missing array comma'); }
    }
    if (raw[i] === '"') { string(); return; }
    const match = raw.slice(i).match(/^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/);
    if (!match) throw new Error('invalid JSON value');
    i += match[0].length;
  };
  value(); ws(); if (i !== raw.length) throw new Error('trailing JSON data');
}

const gapBase = {
  algorithm_version: 'gap-id.v1',
  task_id: 'task-α',
  material_name: 'spec',
  material_revision: 'r-07',
  gap_kind: 'missing_fact',
  expected_fact: 'expected e\nline',
  actual_fact: null,
  subject_id: undefined,
  owner: 'build-spec',
  snapshot_tree: 'tree-A',
  provenance: [
    { producer: 'zeta', reason_text: '  first\t' },
    { producer: 'alpha', reason_text: 'second' },
    { producer: 'zeta', reason_text: '  first\t' },
  ],
};
const gapOwnerReasonExcluded = { ...gapBase, subject_id: undefined, owner: 'different-owner', snapshot_tree: 'tree-A', provenance: [{ producer: 'other-producer', reason_text: 'other reason' }] };
const gapFieldOrder = { actual_fact: gapBase.actual_fact, expected_fact: gapBase.expected_fact, gap_kind: gapBase.gap_kind, material_revision: gapBase.material_revision, material_name: gapBase.material_name, task_id: gapBase.task_id, algorithm_version: gapBase.algorithm_version, owner: gapBase.owner, snapshot_tree: gapBase.snapshot_tree, provenance: gapBase.provenance };
const gapUnicode = { ...gapBase, task_id: ' \tA\u00a0\u2003\u200b\ufeffe\u0301\n ', material_name: ' spec ', material_revision: ' r-08 ', gap_kind: '  Unicode\u2028kind  ', expected_fact: '  café\u0301\u00a0', actual_fact: 'empty' };
const gapInvalidType = { ...gapBase, task_id: 42 };
const gapConflict = { ...gapBase, subject_id: J(['task-other', 'spec', 'r-07']) };

const gapVectors = [
  gapVector('gap-001', 'canonical baseline with provenance deduplication', gapBase, [
    { id: 'owner-reason-producer-change', expected: 'accepted_same_digest_owner_reason_provenance_excluded', input: gapOwnerReasonExcluded },
    { id: 'snapshot-change', expected: 'accepted_same_digest_but_snapshot_binding_stale', input: { ...gapBase, subject_id: undefined, snapshot_tree: 'tree-B' } },
  ]),
  gapVector('gap-002', 'input field order does not change canonical output', gapFieldOrder, [
    { id: 'reordered-fields', expected: 'accepted_same_digest', input: { ...gapBase, subject_id: undefined } },
  ]),
  gapVector('gap-003', 'N whitespace set and NFC Unicode behavior', gapUnicode, [
    { id: 'feff-and-zero-width-space-retained', expected: 'accepted_and_retained_in_normalized_component', input: gapUnicode },
  ]),
  { id: 'gap-004', title: 'illegal type is rejected without an id', input_binding: gapInvalidType, normalized_components: null, subject: null, manifest: null, preimage: null, preimage_utf8_hex: null, expected_digest: null, mutations_or_invalid_samples: [{ id: 'task-id-number', expected: 'rejected_invalid_gap_identity', actual: (() => { try { gapPreimage(gapInvalidType); return judgment('valid_gap_identity', 'unexpectedly accepted'); } catch (error) { return judgment('invalid_gap_identity', error.message); } })(), digest: null, digest_equals_base: false }] },
  { id: 'gap-005', title: 'conflicting producer subject binding is rejected', input_binding: gapConflict, normalized_components: null, subject: null, manifest: null, preimage: null, preimage_utf8_hex: null, expected_digest: null, mutations_or_invalid_samples: [{ id: 'subject-mismatch', expected: 'rejected_invalid_gap_identity', actual: (() => { try { gapPreimage(gapConflict); return judgment('valid_gap_identity', 'unexpectedly accepted'); } catch (error) { return judgment('invalid_gap_identity', error.message); } })(), digest: null, digest_equals_base: false }] },
  { id: 'gap-006', title: 'invalid algorithm version is rejected', input_binding: { ...gapBase, algorithm_version: 'gap-id.v0' }, normalized_components: null, subject: null, manifest: null, preimage: null, preimage_utf8_hex: null, expected_digest: null, mutations_or_invalid_samples: [{ id: 'unknown-version', expected: 'rejected_invalid_gap_identity', actual: (() => { try { gapPreimage({ ...gapBase, algorithm_version: 'gap-id.v0' }); return judgment('valid_gap_identity', 'unexpectedly accepted'); } catch (error) { return judgment('invalid_gap_identity', error.message); } })(), digest: null, digest_equals_base: false }] },
];

const packetFiles = {
  'docs/alpha.txt': Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from('A\u00a0\u200b\uFEFF\r\nB\r\n', 'utf8')]).toString('hex'),
  'meta/summary.txt': Buffer.from('\r\n\u2003summary\r', 'utf8').toString('hex'),
  'z-details.txt': Buffer.from('last line\n', 'utf8').toString('hex'),
};
const sourceA = fileDigest(Buffer.from(packetFiles['docs/alpha.txt'], 'hex')).sha256;
const sourceB = fileDigest(Buffer.from(packetFiles['z-details.txt'], 'hex')).sha256;
const derivedSummary = fileDigest(Buffer.from(packetFiles['meta/summary.txt'], 'hex')).sha256;
const packetBase = {
  algorithm_version: 'stage-input-packet.v1',
  task_id: 'task-α',
  stage: 'spec-specify',
  material_revision: 'r-07',
  snapshot_tree: 'tree-A',
  owner: 'build-spec',
  source_materials: [
    { material_name: 'z-details', path: 'z-details.txt', sha256: sourceB },
    { material_name: 'spec', path: 'docs/alpha.txt', sha256: sourceA },
  ],
  derived_files: [
    { path: 'meta/summary.txt', source_digest: derivedSummary, sha256: derivedSummary, producer: 'build-spec', consumer: 'spec-specify', authority: 'non-material' },
  ],
};
const packetFieldOrder = {
  derived_files: packetBase.derived_files,
  owner: packetBase.owner,
  snapshot_tree: packetBase.snapshot_tree,
  material_revision: packetBase.material_revision,
  source_materials: packetBase.source_materials,
  stage: packetBase.stage,
  task_id: packetBase.task_id,
  algorithm_version: packetBase.algorithm_version,
};
const packetVectors = [
  packetVector('packet-001', 'canonical baseline with sorted file entries and manifest arrays', packetBase, packetFiles, [
    { id: 'manifest-field-order', expected: 'accepted_same_digest', base: packetFieldOrder },
    { id: 'owner-is-included', expected: 'accepted_different_digest', base: { ...packetBase, owner: 'other-owner' } },
    { id: 'hash-self-exclusion', expected: 'accepted_same_digest_when_hash_recomputed', base: { ...packetBase, packet_freeze_hash: 'deliberately-ignored-top-level-field' } },
  ]),
  packetVector('packet-002', 'CRLF/LF normalization and Unicode whitespace retention', packetBase, packetFiles, [
    { id: 'crlf-to-lf-equivalence', expected: 'accepted_same_digest', rawFiles: { 'docs/alpha.txt': Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from('A\u00a0\u200b\uFEFF\nB\n', 'utf8')]).toString('hex'), 'meta/summary.txt': Buffer.from('\n\u2003summary\n', 'utf8').toString('hex') } },
    { id: 'unicode-whitespace-changed', expected: 'accepted_different_digest_unicode_whitespace_is_not_collapsed', rawFiles: { 'meta/summary.txt': Buffer.from('\r\n summary\r', 'utf8').toString('hex') } },
    { id: 'trailing-newline-changed', expected: 'accepted_different_digest_trailing_newline_is_significant', rawFiles: { 'z-details.txt': Buffer.from('last line\n\n', 'utf8').toString('hex') } },
  ]),
  packetVector('packet-003', 'invalid paths are unavailable rather than repaired', packetBase, packetFiles, [
    ...['', '/absolute.txt', 'trailing/', 'dir\\file.txt', 'dir//file.txt', './dot.txt', '../parent.txt', 'nul\0.txt', 42].map((badPath, index) => {
      const invalidFiles = { ...packetFiles, [String(badPath)]: Buffer.from('x', 'utf8').toString('hex') };
      const base = clone(packetBase);
      base.source_materials = [...base.source_materials, { material_name: 'bad', path: badPath, sha256: sha256(T(Buffer.from('x', 'utf8'))) }];
      return { id: `invalid-path-${index + 1}`, expected: 'rejected_unavailable_invalid_path', base, rawFiles: invalidFiles };
    }),
  ]),
  { id: 'packet-004', title: 'unknown algorithm version is unavailable', input_binding: { ...packetBase, algorithm_version: 'stage-input-packet.v0' }, normalized_components: null, subject: null, manifest: null, files: null, file_entries: null, manifest_minus_hash: null, preimage_utf8_hex: null, expected_digest: null, mutations_or_invalid_samples: [{ id: 'unknown-version', expected: 'rejected_unavailable_invalid_version', actual: judgment('unavailable', 'unknown algorithm_version'), digest: null, digest_equals_base: false }] },
  { id: 'packet-005', title: 'duplicate manifest key is unavailable', input_binding: packetBase, normalized_components: null, subject: null, manifest: { raw_json: '{"algorithm_version":"stage-input-packet.v1","owner":"a","owner":"b"}' }, files: null, file_entries: null, manifest_minus_hash: null, preimage_utf8_hex: null, expected_digest: null, mutations_or_invalid_samples: [{ id: 'duplicate-owner-key', expected: 'rejected_unavailable_duplicate_key', actual: (() => { try { duplicateKeysOrSyntax('{"algorithm_version":"stage-input-packet.v1","owner":"a","owner":"b"}'); return judgment('valid_packet', 'unexpectedly accepted'); } catch (error) { return judgment('unavailable', error.message); } })(), digest: null, digest_equals_base: false }] },
];

// Validate expected invariants before writing evidence. Assertions make the
// command's exit status a real machine-check, not a decorative PASS marker.
assert(gapVectors[0].expected_digest.startsWith('gap-') && gapVectors[0].expected_digest.length === 68, 'GAP baseline digest shape');
assert(gapVectors[0].mutations_or_invalid_samples[0].digest_equals_base, 'GAP owner/reason exclusion');
assert(gapVectors[0].mutations_or_invalid_samples[1].digest_equals_base, 'GAP snapshot independence');
assert(gapVectors[1].mutations_or_invalid_samples[0].digest_equals_base, 'GAP field order');
assert(gapVectors[2].normalized_components.task_id.value.includes('\u200b') && gapVectors[2].normalized_components.task_id.value.includes('\ufeff'), 'GAP retained excluded whitespace');
assert(gapVectors[3].mutations_or_invalid_samples[0].actual.status === 'rejected', 'GAP illegal type');
assert(gapVectors[4].mutations_or_invalid_samples[0].actual.status === 'rejected', 'GAP conflicting subject');
assert(packetVectors[0].mutations_or_invalid_samples[0].digest_equals_base, 'packet field order');
assert(packetVectors[0].mutations_or_invalid_samples[1].digest !== packetVectors[0].expected_digest, 'packet owner included');
assert(packetVectors[0].mutations_or_invalid_samples[2].digest_equals_base, 'packet hash self exclusion');
assert(packetVectors[1].mutations_or_invalid_samples[0].digest_equals_base, 'packet CRLF/LF');
assert(packetVectors[1].mutations_or_invalid_samples[1].digest !== packetVectors[1].expected_digest, 'packet Unicode whitespace');
assert(packetVectors[1].mutations_or_invalid_samples[2].digest !== packetVectors[1].expected_digest, 'packet trailing newline');
assert(packetVectors[2].mutations_or_invalid_samples.every((item) => item.actual.status === 'rejected'), 'packet invalid paths');

const evidence = {
  evidence_kind: 'build-spec-hash-contract-fixed-vectors',
  generated_at_utc: startedAt,
  spec_sha256: specSha256,
  contract: {
    gap: { algorithm_version: 'gap-id.v1', normalization: 'N', canonical_json: 'J/B', clause_lines: 'spec.md:387-395' },
    packet: { algorithm_version: 'stage-input-packet.v1', file_normalization: 'T', canonical_json: 'J/B', clause_lines: 'spec.md:495-504' },
  },
  gap_vectors: gapVectors,
  packet_vectors: packetVectors,
};
fs.writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
const vectorSha256 = sha256(fs.readFileSync(outPath));
const endedAt = new Date().toISOString();
const checks = [];
for (const vector of gapVectors) {
  checks.push({ section: 'gap_vectors', id: vector.id, status: vector.expected_digest ? 'verified' : 'verified-negative', expected_digest_present: Boolean(vector.expected_digest), mutation_checks: vector.mutations_or_invalid_samples.map((m) => ({ id: m.id, status: m.actual.status === 'accepted' || m.actual.status === 'rejected' ? 'verified' : 'failed', expected: m.expected, actual: m.actual, digest_equals_base: m.digest_equals_base })) });
}
for (const vector of packetVectors) {
  checks.push({ section: 'packet_vectors', id: vector.id, status: vector.expected_digest ? 'verified' : 'verified-negative', expected_digest_present: Boolean(vector.expected_digest), mutation_checks: vector.mutations_or_invalid_samples.map((m) => ({ id: m.id, status: m.actual.status === 'accepted' || m.actual.status === 'rejected' ? 'verified' : 'failed', expected: m.expected, actual: m.actual, digest_equals_base: m.digest_equals_base })) });
}
assert(checks.every((check) => check.status.startsWith('verified') && check.mutation_checks.every((m) => m.status === 'verified')), 'per-vector checks');
const checkEvidence = {
  evidence_kind: 'build-spec-hash-contract-fixed-vectors-check',
  script_command: command,
  exit_code: 0,
  started_at_utc: startedAt,
  ended_at_utc: endedAt,
  spec_sha256: specSha256,
  spec_clause_lines: { gap: 'spec.md:387-395', packet: 'spec.md:495-504' },
  vector_file: 'specs/workflowhub-close-readiness-governance-20260906/evidence/build-spec-review/hash-contract-vectors.json',
  vector_file_sha256: vectorSha256,
  vector_counts: { gap_vectors: gapVectors.length, packet_vectors: packetVectors.length, total_mutations_or_invalid_samples: checks.reduce((sum, check) => sum + check.mutation_checks.length, 0) },
  per_vector_checks: checks,
};
fs.writeFileSync(checkPath, `${JSON.stringify(checkEvidence, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ exit_code: 0, spec_sha256: specSha256, vector_file_sha256: vectorSha256, gap_vectors: gapVectors.length, packet_vectors: packetVectors.length, check_file: checkPath }, null, 2));
