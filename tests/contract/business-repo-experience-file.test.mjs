// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
// Authored by build-plan before implementation. Encodes ADR-0049, D-010 and D-012 of
// specs/n7-route-delivery-closeout-experience-20261018/decision-log.md, and AC-006 / AC-007 / AC-011 of the same task's
// spec.md Appendix A. Only in-repo facts are asserted here; the real PaperBuilder write and any cross-repo permission
// refusal stay outside this test and are covered by the real write evidence and its coverage limit.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const NEW_PATH = 'specs/Improvements.md';
const OLD_PATH = 'Improvements.md';
const read = path => (existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), 'utf8') : null);

// Historical and machine-generated mentions of the old location stay untouched: archives, research notes, the
// generated graph, the accepted ADR that decided the move, this task's own materials, and the move-map entry that
// records the move itself.
const MENTION_ALLOWLIST = [
  'specs/archive/',
  'docs/research/',
  'graphify-out/',
  'docs/adr/0049-',
  'specs/n7-route-delivery-closeout-experience-20261018/',
  'docs/architecture/move-map.json',
  'tests/contract/business-repo-experience-file.test.mjs',
];

const SCANNED = ['AGENTS.md', 'CLAUDE.md', 'GLOSSARY.md', 'skills/stage-reflection/SKILL.md', 'docs/standard-workflow.md'];

describe('ORACLE-P2-EXPERIENCE-FILE business repo experience file contract', () => {
  it('keeps the business repo experience file under specs and removes the root file', () => {
    expect(read(NEW_PATH), `${NEW_PATH} must exist`).not.toBeNull();
    expect(existsSync(resolve(ROOT, OLD_PATH)), `the root ${OLD_PATH} must be gone after the move`).toBe(false);
  });

  it('states the entry shape, the module sections and the dedupe key in one place', () => {
    const body = read(NEW_PATH) ?? '';
    expect(body, 'the file points its reader at the closeout method once').toContain('skills/stage-reflection/SKILL.md');
    expect(body, 'entries carry the action that changes next time').toContain('下次');
    expect(body, 'the file keeps one status column with a closed state').toContain('状态');
    expect(body, 'a closed entry only follows a real user confirmation').toMatch(/用户确认/u);
    expect(body, 'sections follow the business repo modules').toMatch(/模块/u);
    expect(body, 'the dedupe key is the next step plus the symptom').toContain('下次要改的那一步');
  });

  it('leaves no live reference to the old root location', () => {
    const offenders = SCANNED.filter(path => {
      const body = read(path);
      return body !== null && new RegExp(`(?<![\\w/.-])${OLD_PATH.replace('.', '\\.')}`, 'u').test(body);
    });
    expect(offenders, 'these current files still point at the removed root location').toEqual([]);
  });

  it('records the move in the repository move map with an owner and a deletion condition', () => {
    const moveMap = JSON.parse(read('docs/architecture/move-map.json') ?? '{}');
    const entry = (moveMap.entries ?? []).find(row => row.source === OLD_PATH || row.destination === NEW_PATH);
    expect(entry, 'the move map must carry the experience file move').toBeTruthy();
    expect(entry.destination).toBe(NEW_PATH);
    for (const field of ['responsibility', 'owner', 'consumer', 'delete_condition']) {
      expect(String(entry[field] ?? '').trim(), `the move map entry keeps a nonempty ${field}`).not.toBe('');
    }
  });

  it('keeps the mention allowlist honest by listing only paths that are not current authorities', () => {
    for (const path of MENTION_ALLOWLIST) {
      expect(SCANNED.includes(path), `${path} must not be both scanned and allowlisted`).toBe(false);
    }
  });
});
