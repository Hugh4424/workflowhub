// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
// Authored by build-plan before implementation. Encodes D-003, D-004, D-005, D-018 and ADR-002 of
// specs/n7-route-delivery-closeout-experience-20261018/decision-log.md, and AC-001 / AC-012 of the same task's
// spec.md Appendix A. The charter is judged as an index only; semantic usability stays an independent human readback.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const read = path => (existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), 'utf8') : null);
const has = (body, token) => body.includes(token);
const CHARTER = 'docs/delivery-closeout-charter.md';
const FIVE = ['领域词表', '工作区与任务', '人读交接', '阶段收口', '交付说明'];
const STAGE_NAMES = ['make-decision', 'build-plan', 'build-code', 'verify-code', 'build-prd'];
const RESIDENT = ['AGENTS.md', 'CLAUDE.md', 'GLOSSARY.md'];
const RESIDENT_BUDGET = 36861;

describe('ORACLE-P3-CHARTER delivery and closeout charter contract', () => {
  it('creates the charter as a pure index with one row per part and an applicability column', () => {
    const body = read(CHARTER);
    expect(body, `${CHARTER} must exist`).not.toBeNull();
    const text = body ?? '';
    expect(text.length, 'the charter must not be empty').toBeGreaterThan(0);
    expect(has(text, '适用阶段'), 'the charter states the applicability column').toBe(true);
    for (const part of FIVE) {
      expect(has(text, part), `the charter carries one row for ${part}`).toBe(true);
    }
  });

  it('keeps the physical close limited to the two stages that actually call it', () => {
    const text = read(CHARTER) ?? '';
    const closeRow = text
      .split('\n')
      .filter(line => line.startsWith('|') && has(line, '关闭') && has(line, '交付说明') === false);
    expect(closeRow.length, 'the charter carries a close row').toBeGreaterThan(0);
    const joined = closeRow.join('\n');
    expect(has(joined, 'build-prd'), 'the close row lists build-prd').toBe(true);
    expect(has(joined, 'verify-code'), 'the close row lists verify-code').toBe(true);
    for (const stage of STAGE_NAMES.filter(value => value !== 'build-prd' && value !== 'verify-code')) {
      expect(has(joined, stage), `the close row must not list ${stage}`).toBe(false);
    }
  });

  it('points both governance entry files at the charter without copying its content', () => {
    for (const path of ['AGENTS.md', 'CLAUDE.md']) {
      expect(has(read(path) ?? '', CHARTER), `${path} must point at the charter`).toBe(true);
    }
  });

  it('registers the charter in the move map with an owner, a consumer and a deletion condition', () => {
    const moveMap = JSON.parse(read('docs/architecture/move-map.json') ?? '{}');
    const entry = (moveMap.entries ?? []).find(row => row.destination === CHARTER);
    expect(entry, 'the charter needs a move map entry').toBeTruthy();
    if (!entry) return;
    expect(entry.source, 'the entry names the charter as its source').toBe(CHARTER);
    expect(['production', 'test_only', 'historical_readonly'].includes(entry.role), 'the role stays inside the allowlist').toBe(true);
    for (const field of ['responsibility', 'owner', 'consumer', 'delete_condition']) {
      expect(String(entry[field] ?? '').trim().length > 0, `the charter entry keeps a nonempty ${field}`).toBe(true);
    }
    expect(/retired/u.test(JSON.stringify(entry)), 'the entry must not describe the charter as retired').toBe(false);
  });

  it('adds the workspace-and-task section to the standard workflow', () => {
    const text = read('docs/standard-workflow.md') ?? '';
    expect(/工作区与任务/u.test(text), 'the standard workflow carries the workspace and task section').toBe(true);
    expect(has(text, 'task/'), 'the section names the task branch convention').toBe(true);
  });

  it('keeps the resident read set at or under its opening byte budget', () => {
    const total = RESIDENT.reduce((sum, path) => sum + Buffer.byteLength(read(path) ?? '', 'utf8'), 0);
    expect(total, `AGENTS.md + CLAUDE.md + GLOSSARY.md must not exceed ${RESIDENT_BUDGET} bytes`).toBeLessThanOrEqual(
      RESIDENT_BUDGET,
    );
  });
});
