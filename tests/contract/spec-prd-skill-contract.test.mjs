import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skillPath = resolve(repoRoot, 'skills/spec-prd/SKILL.md');
const bundlePath = resolve(repoRoot, 'skills/spec-prd/skill-bundle.json');
const templatePath = resolve(repoRoot, 'skills/spec-prd/templates/prd-template.md');
const constitutionPath = resolve(repoRoot, 'CONSTITUTION.md');
const checklistPath = resolve(repoRoot, 'constitution-checklist.md');
const buildPrdSkillPath = resolve(repoRoot, 'workflows/build-prd/SKILL.md');
const buildPrdStepsPath = resolve(repoRoot, 'workflows/build-prd/steps.json');

const artifact = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
const skill = () => artifact(skillPath);
const template = () => artifact(templatePath);
const constitution = () => artifact(constitutionPath);
const checklist = () => artifact(checklistPath);

function expectArtifact(path) {
  expect(existsSync(path), `required artifact is missing: ${path}`).toBe(true);
}

function expectEvery(text, terms, label) {
  for (const term of terms) {
    expect(text, `${label} must contain ${term}`).toContain(term);
  }
}

// No runtime writer exists in P2: keep the observable two-call/final-confirmation
// seam as a deterministic contract helper rather than pretending to call a host.
function readPlanningContract(text) {
  const contentCalls = [...text.matchAll(/^\s*\d+\.\s+\*\*[^*]*调用/gm)];
  return {
    contentCallCount: contentCalls.length,
    hasPostDetailFinalConfirmation: /(?:第二次内容调用|second content call)[\s\S]{0,400}(?:最终确认|final confirmation)/i.test(text),
    bindsDecisionSourceMapPrd: /(?:最终确认|final confirmation)[\s\S]{0,360}(?:decision_revision|source_revision|map_revision|prd_revision)/i.test(text),
    rejectsUnconfirmedOrWrongRevision: /拒绝、未答或[\s\S]{0,300}保持.*draft/.test(text),
    noThirdContentCall: /不是\s*第三次内容调用|not\s+a\s+third\s+content\s+call/i.test(text),
  };
}

function applyFinalDraftConfirmation(contract, input) {
  const revisions = {
    decision_revision: input.decisionRevision,
    source_revision: input.sourceRevision,
    map_revision: input.mapRevision,
    prd_revision: input.prdRevision,
  };
  const confirmationRevisions = input.confirmationRevisions ?? {};
  const revisionsMatch = Object.entries(revisions)
    .every(([field, revision]) => confirmationRevisions[field] === revision);
  const hashMatches = input.boundDraftHash === input.confirmedDraftHash;
  const confirmed = input.reply === 'confirmed'
    && input.displayBeforeReply === true
    && input.humanApproved === true
    && revisionsMatch
    && hashMatches;
  if (!contract.hasPostDetailFinalConfirmation || !contract.bindsDecisionSourceMapPrd || !confirmed) {
    return { status: 'draft', reason: 'final confirmation missing, refused, unanswered, wrong revision, flags, or draft hash' };
  }
  return { status: 'final', reason: 'displayed draft confirmed at the bound revision and hash' };
}

describe('ORACLE-P2-SPEC-PRD', () => {
  it('ships one spec-prd writer with exactly two calls and map-before-detail ordering', () => {
    expectArtifact(skillPath);
    const text = skill();
    expectEvery(text, [
      '唯一',
      'prd.md',
      '第一次调用',
      '第二次调用',
      '大纲',
      '结果导向任务地图',
      '地图核对',
      'detail cards',
      'single writer'
    ], 'spec-prd skill');
    expect(text.indexOf('地图核对')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('第二次调用 — detail cards')).toBeGreaterThan(text.indexOf('地图核对'));
  });

  it('models exactly two content calls and a post-detail final confirmation seam', () => {
    expectArtifact(skillPath);
    const text = skill();
    const contract = readPlanningContract(text);
    expect(contract.contentCallCount).toBe(2);
    expect(contract.noThirdContentCall).toBe(true);
    expect(contract.hasPostDetailFinalConfirmation).toBe(true);
    expect(contract.bindsDecisionSourceMapPrd).toBe(true);

    const bound = {
      decisionRevision: 'decision-1', sourceRevision: 'source-1', mapRevision: 'map-1',
      prdRevision: 'prd-1', reply: 'confirmed',
      confirmationRevisions: {
        decision_revision: 'decision-1', source_revision: 'source-1',
        map_revision: 'map-1', prd_revision: 'prd-1',
      },
      displayBeforeReply: true, humanApproved: true,
      boundDraftHash: 'draft-hash-1', confirmedDraftHash: 'draft-hash-1',
    };
    const confirmed = applyFinalDraftConfirmation(contract, bound);
    expect(confirmed).toEqual({ status: 'final', reason: 'displayed draft confirmed at the bound revision and hash' });

    for (const reply of ['refused', 'unanswered']) {
      expect(applyFinalDraftConfirmation(contract, { ...bound, reply }).status).toBe('draft');
    }
    for (const invalid of [
      { displayBeforeReply: false },
      { humanApproved: false },
      { confirmedDraftHash: 'different-hash' },
      { confirmationRevisions: { decision_revision: 'wrong-revision', source_revision: 'source-1', map_revision: 'map-1', prd_revision: 'prd-1' } },
      { confirmationRevisions: { decision_revision: 'decision-1', source_revision: 'decision-1', map_revision: 'map-1', prd_revision: 'prd-1' } },
    ]) {
      expect(applyFinalDraftConfirmation(contract, { ...bound, ...invalid }).status).toBe('draft');
    }
  });

  it('binds both calls to the same decision/source revision and closes each card semantically', () => {
    expectArtifact(skillPath);
    const text = skill();
    expectEvery(text, [
      'same revision',
      'decision revision',
      'source revision',
      'consumer',
      'oracle',
      '准备依赖',
      '实现依赖',
      '验收依赖',
      '合并依赖',
      'owner',
      '最小读取集',
      '五阶段开工说明'
    ], 'spec-prd skill');
  });

  it('keeps UI conditional and non-UI paths truthful, including design and experience responsibility', () => {
    expectArtifact(skillPath);
    expectArtifact(buildPrdSkillPath);
    expectArtifact(buildPrdStepsPath);
    const text = `${skill()}\n${artifact(buildPrdSkillPath)}\n${artifact(buildPrdStepsPath)}`;
    expectEvery(text, [
      'ui_applicability',
      'non_ui',
      'UI',
      'Design.md',
      'Experience.md',
      '任务级设计基线',
      '规范责任卡',
      'real consumer',
      'oracle',
      '真实展示版本',
      'display_before_reply=true',
      'human_approved=true',
      'displayed_draft_hash',
      'draft hash',
      'confirm-final-displayed-draft',
      'final_displayed_draft_confirmation',
      'all in-scope UI pages',
      'states',
      'viewports',
      'no-omissions'
    ], 'spec-prd skill');
  });

  it('preserves draft status and concrete gaps for missing, rejected, cancelled, unanswered, conflicting, or stale inputs', () => {
    expectArtifact(skillPath);
    const text = skill();
    expectEvery(text, [
      '保持 draft',
      '缺口',
      '受影响范围',
      '拒绝',
      '取消',
      '未答',
      '错版',
      '冲突',
      '失效共享引用',
      '不得定稿'
    ], 'spec-prd skill');
  });

  it('supports standalone calls without inventing platform, write, confirmation, or delivery facts', () => {
    expectArtifact(skillPath);
    const text = skill();
    expectEvery(text, [
      '独立调用',
      '显式输入',
      '缺母决定',
      '具体缺口',
      '仅返回正文',
      '不伪造',
      '写盘',
      '发布',
      '归档',
      '物理授权'
    ], 'spec-prd skill');
  });

  it('defines maintenance classification and protects archived and in-flight facts', () => {
    expectArtifact(skillPath);
    const text = skill();
    expectEvery(text, [
      '归档',
      '小修',
      '依据',
      '影响',
      '实质变化',
      '真实确认',
      '变更说明',
      'before/after commitments',
      'in-flight',
      '不自动覆盖',
      '历史事实'
    ], 'spec-prd skill');
  });

  it('uses a navigable PRD template with shared definitions and complete task-card handoff fields', () => {
    expectArtifact(templatePath);
    const text = template();
    expectEvery(text, [
      '`{{prd_status}}`',
      '导航',
      '产品总览',
      '共享定义',
      '任务卡',
      '结果与 consumer',
      '流程/状态',
      'FR',
      'AC',
      '准备依赖',
      '实现依赖',
      '验收依赖',
      '合并依赖',
      '来源/设计',
      '局部风险',
      '可后置技术项',
      '最小读取集',
      '五阶段开工说明',
      '变更说明',
      '交付说明'
    ], 'prd template');
  });

  it('keeps the F7 planning design and final confirmation conditional without creating a new gate', () => {
    expectArtifact(constitutionPath);
    expectArtifact(checklistPath);
    const text = `${constitution()}\n${checklist()}`;
    expectEvery(text, [
      'F7',
      'build-prd',
      'spec-prd',
      '地图',
      '真实展示版本',
      '最终确认',
      'non_ui',
      '不新增日常确认',
      '不新增 gate'
    ], 'F7 governance');
  });

  it('declares the portable bundle closure and verifies hashes for both skill files', () => {
    expectArtifact(bundlePath);
    expectArtifact(skillPath);
    expectArtifact(templatePath);
    const bundle = JSON.parse(artifact(bundlePath));
    expect(bundle.schema_version).toBe(1);
    expect(bundle.skill).toBe('spec-prd');
    expect(bundle.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'SKILL.md' }),
      expect.objectContaining({ path: 'templates/prd-template.md' })
    ]));
    for (const entry of bundle.files) {
      const file = resolve(repoRoot, 'skills/spec-prd', entry.path);
      expect(existsSync(file), `bundle file is missing: ${entry.path}`).toBe(true);
      expect(entry.sha256, `bundle hash missing: ${entry.path}`).toMatch(/^[a-f0-9]{64}$/);
      const digest = createHash('sha256').update(readFileSync(file)).digest('hex');
      expect(digest, `bundle hash mismatch: ${entry.path}`).toBe(entry.sha256);
    }
  });
});
