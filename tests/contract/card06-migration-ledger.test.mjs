// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
// AC-27/AC-52：迁移台账合同测试。数据源为迁移表（本卡逐文件处置唯一权威）。
// 解析主表行：`| MT-<面>-<号> | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |`（10 列）。
// 测试面（⑥）行把第 3 列表头写作「被测对象」，列数同为 10；解析器兼容 9 列形态
//（无第 3 列），以实际文件为准。§3 聚合裁定、§4 G-3、pre 清单等节的表行不以
// `| MT-数字-数字 |` 开头，天然被行首模式跳过。
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TABLE_REL = 'specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md';

// 仓库根解析：沿 __dirname 上溯到含迁移表的根（在认证 worktree 内稳定，不依赖 cwd）。
function findRepoRoot(start) {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, TABLE_REL))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`无法从 ${start} 上溯找到含 ${TABLE_REL} 的仓库根`);
    dir = parent;
  }
}
const ROOT = findRepoRoot(HERE);
const TABLE = path.join(ROOT, TABLE_REL);

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const BATCH_LABELS = ['B0/P1', 'B1/P2', 'B2/P3', 'B3/P4', 'B4/P5', 'B5/P6', 'B6/P7', 'B7/P8'];
// 批次号比较口径：B0/P1=0 .. B7/P8=7。
const batchIndex = (label) => BATCH_LABELS.indexOf(label);

// ---- 迁移表解析 ----
// 10 列：id | path | 现有消费者|被测对象 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注
//  9 列（兼容，当前文件未出现）：id | path | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注
function parseRows() {
  const lines = fs.readFileSync(TABLE, 'utf8').split('\n');
  const rows = [];
  for (const line of lines) {
    if (!/^\|\s*MT-\d+-\d+\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((s) => s.trim());
    if (cells.length === 10) {
      const [id, filePath, source, target, disposition, batch, rollback] = cells;
      rows.push({ id, path: filePath, source, target, disposition, batch, rollback });
    } else if (cells.length === 9) {
      const [id, filePath, target, disposition, batch, rollback] = cells;
      rows.push({ id, path: filePath, source: '(无现有消费者列)', target, disposition, batch, rollback });
    } else {
      throw new Error(`迁移表主表行列数异常（${cells.length} 列，预期 9 或 10）：${line.slice(0, 80)}`);
    }
  }
  return rows;
}
const ROWS = parseRows();

const dispositionOf = (raw) => (raw.startsWith('MOVE') ? 'MOVE' : raw.startsWith('ARCHIVE') ? 'ARCHIVE' : raw);
const DELETE_ROWS = ROWS.filter((r) => dispositionOf(r.disposition) === 'DELETE');
const NEW_ROWS = ROWS.filter((r) => dispositionOf(r.disposition) === 'NEW');

// ---- 当前批次：current = max N where git tag backup/card-06-b<N> 存在，无 tag → 0 ----
function currentBatchIndex() {
  let current = 0;
  for (let n = 0; n <= 7; n += 1) {
    try {
      git(['rev-parse', '--verify', `backup/card-06-b${n}`]);
      current = n;
    } catch {
      // 该批次 tag 不存在，跳过。
    }
  }
  return current;
}
const CURRENT = currentBatchIndex();

// ---- 扫描面与排除清单（常量；理由随条目注释） ----
// 七类根目录：台账「无存活引用」扫描只覆盖这些根的存活文本文件。
const SEVEN_ROOTS = ['runtime', 'core', 'scripts', 'tools', 'skills', 'workflows', 'config'];
const TEXT_EXTS = new Set(['.mjs', '.js', '.ts', '.cjs', '.mts', '.json', '.md', '.yaml', '.yml', '.html']);
// 排除清单：被排除路径不得参与「存活引用」扫描。
const SCAN_EXCLUDED = [
  // 以下三类不在七类根扫描范围内，列出以固定排除语义；若未来扩大扫描面，排除仍然生效。
  [/^specs\/archive\//, 'specs/archive 只读保留旧任务过程文件，不作当前进度/存活面'],
  [/^docs\/research\//, 'docs/research 只读调研保留区'],
  [/^docs\/archive\//, 'docs/archive 只读归档区'],
  // 迁移表自身含全部 path 与模块名文本，必然命中。
  ['specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md', '台账数据源自身'],
  // 本测试与同源残留测试在源码文本中引用被删模块 basename/path（预写测试的天性）。
  [/^tests\/contract\/card06-.*\.test\.mjs$/, 'card06 台账测试自身'],
  ['tests/contract/thin-core-residue.test.mjs', 'card06 残留测试自身'],
  // 决策日志记录删除决定本身，必然引用被删模块名。
  [/decision-log\.md$/, '决策日志记载删除决定，非存活代码引用'],
];
const isScanExcluded = (rel) => SCAN_EXCLUDED.some(([rule]) => (rule instanceof RegExp ? rule.test(rel) : rule === rel));

const MAX_FILE_BYTES = 1024 * 1024;
let survivingTextFilesCache = null;
function survivingTextFiles() {
  if (survivingTextFilesCache) return survivingTextFilesCache;
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(ROOT, abs);
      if (isScanExcluded(rel)) continue;
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(abs);
      } else if (entry.isFile() && TEXT_EXTS.has(path.extname(entry.name))) {
        const stat = fs.statSync(abs);
        if (stat.size <= MAX_FILE_BYTES) out.push(rel);
      }
    }
  };
  for (const rootDir of SEVEN_ROOTS) walk(path.join(ROOT, rootDir));
  survivingTextFilesCache = out;
  return out;
}

// Resolve only literal references against the importing file. A shared basename
// (for example another workflow's steps.json) is not this retired path. Aliases,
// computed imports and template expressions need the declared AC-29 readback.
function literalReferenceTargets(text, reader) {
  const targets = [];
  const refs = /\b(?:from\s+|import\s*(?:\(\s*)?|require\s*\(\s*)['"]([^'"\r\n]+)['"]/g;
  for (const [, value] of text.matchAll(refs)) {
    const specifier = value.split(/[?#]/, 1)[0];
    let absolute;
    if (specifier.startsWith('file:')) absolute = fileURLToPath(specifier);
    else if (path.isAbsolute(specifier)) absolute = specifier;
    else if (specifier.startsWith('./') || specifier.startsWith('../')) {
      absolute = path.resolve(ROOT, path.dirname(reader), specifier);
    } else if (SEVEN_ROOTS.some((root) => specifier.startsWith(`${root}/`))) {
      absolute = path.resolve(ROOT, specifier);
    } else continue; // Bare/aliased module identities cannot be resolved here.
    const relative = path.relative(ROOT, absolute).replaceAll('\\', '/');
    if (relative && !relative.startsWith('../') && !path.isAbsolute(relative)) targets.push(relative);
  }
  return targets;
}
const referenceTargetsDeleted = (reference, retired) => retired.endsWith('/')
  ? reference === retired.slice(0, -1) || reference.startsWith(retired)
  : reference === retired || (!path.extname(reference)
    && reference === retired.replace(/\.(mjs|cjs|mts|js|ts|json|md|ya?ml|html)$/i, ''));

describe('card06 migration ledger（AC-27/AC-52）', () => {
  describe('台账结构（不分批，任何时候成立）', () => {
    // 断言 1：七类面都有行。按 path 前缀分组（id 前缀不稳：面④ workflows 归在
    // 片段 3 用 MT-3 编号，表内无 MT-4 前缀）。组 ②/⑦ 额外列入根目录治理与仓库
    // 配置文件（迁移表实际登记的顶层路径）。
    const FACE_GROUPS = [
      { face: '① runtime/core/scripts 生产代码', prefixes: ['runtime/', 'core/', 'scripts/'] },
      { face: '② CLI 与仓库配置', prefixes: ['tools/'], files: ['package.json', 'vitest.config.mjs', '.markdownlint-cli2.jsonc'] },
      { face: '③ skills', prefixes: ['skills/'] },
      { face: '④ workflows/config', prefixes: ['workflows/', 'config/'] },
      { face: '⑤ manifest/schema', prefixes: ['schemas/', 'contracts/', 'runtime/schemas/', 'runtime/review/schemas/'] },
      { face: '⑥ 测试与夹具', prefixes: ['tests/'] },
      { face: '⑦ 治理文档', prefixes: ['docs/'], files: ['AGENTS.md', 'CLAUDE.md', 'CONTEXT.md', 'CONSTITUTION.md', 'constitution-checklist.md', 'README.md', 'CARD-06-IN-PROGRESS.md'] },
    ];
    const matchesFace = (group, p) => group.prefixes.some((pre) => p.startsWith(pre)) || (group.files ?? []).includes(p);
    it('七类面都有行（各前缀组非空，且全部行至少落入一组）', () => {
      const uncovered = ROWS.filter((r) => !FACE_GROUPS.some((g) => matchesFace(g, r.path))).map((r) => `${r.id} ${r.path}`);
      expect(uncovered, '存在不属于任何面分组的迁移表行').toEqual([]);
      const emptyGroups = FACE_GROUPS.filter((g) => !ROWS.some((r) => matchesFace(g, r.path))).map((g) => g.face);
      expect(emptyGroups, '存在为空的面膜分组').toEqual([]);
    });

    // 断言 2：每行四要素非空（现有消费者/被测对象、目标消费者、处置、回滚方式）。
    it('每行四要素非空：现有消费者(或被测对象)/目标消费者/处置/回滚方式', () => {
      const bad = ROWS.filter((r) => !r.source || !r.target || !r.disposition || !r.rollback).map((r) => `${r.id} ${r.path}`);
      expect(bad).toEqual([]);
    });

    // 断言 3：path 全局唯一。迁移表头与聚合裁定 A-15 均要求「一个路径只出现一行/
    // 一个 Phase owner」；当前表内存在跨节重复登记（如 docs/architecture/deletion-plan.json
    // 同时登记于 MT-5-042 与 MT-7-063），build-plan 合并须消解——本断言 RED 即暴露该台账缺陷。
    it('path 全局唯一', () => {
      const byPath = new Map();
      for (const r of ROWS) {
        if (!byPath.has(r.path)) byPath.set(r.path, []);
        byPath.get(r.path).push(r.id);
      }
      const dupes = [...byPath.entries()].filter(([, ids]) => ids.length > 1).map(([p, ids]) => `${p} ← ${ids.join(', ')}`);
      expect(dupes).toEqual([]);
    });

    // 断言 4：批次合法。任务说明原文为「SURVIVOR/PENDING 批次为 "—"」，但实测表内存在
    // 携带批次标签的 SURVIVOR/PENDING 行（如 MT-3-003 skills/.gitkeep B3/P4、MT-2-004
    // tools/cli/check-anti-host.mjs B6/P7、MT-6-317 tests/build-code-diff-only.test.mjs B0/P1），
    // 其语义为该批次的登记/确认（回滚方式均为「无需回滚（无改动）」），§0 批次计数亦把
    // 62 行无批次 SURVIVOR/PENDING 单列。故按表语义放宽为 "—" 或合法批次标签。
    it('批次合法：DELETE/NARROW/MOVE/NEW/ARCHIVE ∈ B0/P1..B7/P8；SURVIVOR/PENDING ∈ {"—"} ∪ 批次标签', () => {
      const bad = [];
      for (const r of ROWS) {
        const d = dispositionOf(r.disposition);
        if (['DELETE', 'NARROW', 'MOVE', 'NEW', 'ARCHIVE'].includes(d)) {
          if (batchIndex(r.batch) < 0) bad.push(`${r.id} ${r.path}：处置 ${r.disposition} 批次非法「${r.batch}」`);
        } else if (['SURVIVOR', 'PENDING'].includes(d)) {
          if (r.batch !== '—' && batchIndex(r.batch) < 0) bad.push(`${r.id} ${r.path}：SURVIVOR/PENDING 批次非法「${r.batch}」`);
        } else {
          bad.push(`${r.id} ${r.path}：未知处置「${r.disposition}」`);
        }
      }
      expect(bad).toEqual([]);
    });

    // 断言 5：冻结记录。解析 `## 0.` 节「**冻结记录**：」行。
    // build-plan 阶段该行为「待冻结」→ 本断言 RED（设计意图）；冻结后填入 40 位 hex，
    // 断言该提交是 HEAD 祖先（用户指令中的 `git merge-base --is-commit-ancestor` 按真实
    // git 子命令 `git merge-base --is-ancestor` 执行；与 backup tag 祖先链的关系按任务
    // 约定从简：sha 是 HEAD 祖先即可）。
    it('冻结记录：待冻结 → RED（设计意图）；40 位 hex 且为 HEAD 祖先 → GREEN', () => {
      const lines = fs.readFileSync(TABLE, 'utf8').split('\n');
      const line = lines.find((l) => l.startsWith('**冻结记录**'));
      expect(line, '迁移表 ## 0. 节缺少 **冻结记录** 行').toBeTruthy();
      const value = line.replace(/^\*\*冻结记录\*\*[：:]\s*/, '').trim();
      if (value.includes('待冻结')) {
        expect.unreachable(`冻结记录仍为「待冻结」：build-plan 用户确认并提交后须填入冻结提交号（${value}）`);
      }
      const sha = (value.match(/[0-9a-f]{40}/) ?? [])[0];
      expect(sha, `冻结记录格式错误（须为 40 位 hex 提交号）：${value}`).toBeTruthy();
      expect(() => git(['merge-base', '--is-ancestor', sha, 'HEAD']), `冻结提交 ${sha} 不是 HEAD 祖先`).not.toThrow();
    });
  });

  // 断言 6/7：分批断言。对每个批次 b ≤ current 一个 describe 组（组名 "B0/P1".."B7/P8"）。
  for (const [index, label] of BATCH_LABELS.entries()) {
    if (index > CURRENT) break;
    const batchDeletes = DELETE_ROWS.filter((r) => r.batch === label);
    const batchNews = NEW_ROWS.filter((r) => r.batch === label);
    describe(label, () => {
      for (const r of batchDeletes) {
        it(`DELETE ${r.path} 不在仓库文件树`, () => {
          const abs = path.join(ROOT, r.path);
          const onDisk = fs.existsSync(abs);
          const tracked = git(['ls-files', '--', r.path]).trim() !== '';
          expect({ onDisk, tracked, path: r.path }, '被删路径仍存在于仓库文件树').toEqual({ onDisk: false, tracked: false, path: r.path });
        });
        it(`DELETE ${r.path} 无存活引用`, () => {
          const hits = [];
          for (const rel of survivingTextFiles()) {
            const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
            if (literalReferenceTargets(text, rel).some((reference) => referenceTargetsDeleted(reference, r.path))) hits.push(rel);
          }
          expect(hits, `存活文件仍引用具体已删路径 ${r.path}`).toEqual([]);
        });
      }
      for (const r of batchNews) {
        // B0/P1 的 NEW 行 = 五窄工具 + 配套合同测试 + 开工横幅（MT-1-001..006、MT-6-001..007、
        // MT-7-114）。build-plan 阶段这些文件尚不存在 → 本组实跑必 RED，这是设计意图：
        // 预写测试先冻结合同，build-code 各批次实现后转 GREEN。
        it(`NEW ${r.path} 存在`, () => {
          expect(fs.existsSync(path.join(ROOT, r.path)), `${r.path} 尚未创建（${r.id}）`).toBe(true);
        });
      }
      if (batchDeletes.length === 0 && batchNews.length === 0) {
        it('本批无 DELETE/NEW 登记（预留组，随批次推进获得断言对象）', () => {
          expect(batchDeletes.length + batchNews.length).toBe(0);
        });
      }
    });
  }
});
