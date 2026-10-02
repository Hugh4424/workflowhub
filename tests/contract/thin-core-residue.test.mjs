// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
// AC-29：薄核心残留扫描（按批次分组）。解析迁移表取 DELETE 行（含批次），
// 当前批次 current = max N where git tag backup/card-06-b<N> 存在，无 tag → 0
//（仅 "B0/P1" 组激活）；批次 ≤ current 的组才产生断言。B0/P1 批在迁移表中无 DELETE
// 行，故 build-plan 阶段本测试 GREEN（空组留痕）；RED 由各删除批次逐批点燃。
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
const batchIndex = (label) => BATCH_LABELS.indexOf(label);

// ---- 迁移表解析（与台账测试同口径；10 列主表，兼容 9 列形态） ----
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
const DELETE_ROWS = ROWS.filter((r) => r.disposition === 'DELETE');

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

// ---- 扫描面与排除清单（常量；与台账测试同口径，理由随条目注释） ----
// 七类根目录：换名复活/调用点扫描只覆盖这些根。
const SEVEN_ROOTS = ['runtime', 'core', 'scripts', 'tools', 'skills', 'workflows', 'config'];
// 排除清单：被排除路径不参与任何残留扫描。
const SCAN_EXCLUDED = [
  // 只读保留/归档/调研区：残留是「现行存活面」的属性，归档面保留历史文本属预期。
  [/^specs\/archive\//, 'specs/archive 只读保留旧任务过程文件'],
  [/^docs\/research\//, 'docs/research 只读调研保留区'],
  [/^docs\/archive\//, 'docs/archive 只读归档区'],
  // 迁移表自身含全部 path 与模块名文本，必然命中。
  ['specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md', '台账数据源自身'],
  // 本测试与同源台账测试在源码文本中引用被删模块 basename/path（预写测试的天性）。
  ['tests/contract/card06-migration-ledger.test.mjs', 'card06 台账测试自身'],
  [/^tests\/contract\/thin-core-residue.*\.test\.mjs$/, 'card06 残留测试自身'],
  // 决策日志记录删除决定本身，必然引用被删模块名与其消费链。
  [/decision-log\.md$/, '决策日志记载删除决定，非存活代码引用'],
];
const isScanExcluded = (rel) => SCAN_EXCLUDED.some(([rule]) => (rule instanceof RegExp ? rule.test(rel) : rule === rel));

const MAX_FILE_BYTES = 1024 * 1024;
function walkFiles(rootDirs, keep) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(ROOT, abs);
      if (isScanExcluded(rel)) continue;
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(abs);
      } else if (entry.isFile() && keep(abs, rel)) {
        const stat = fs.statSync(abs);
        if (stat.size <= MAX_FILE_BYTES) out.push(rel);
      }
    }
  };
  for (const rootDir of rootDirs) {
    const abs = path.join(ROOT, rootDir);
    if (fs.existsSync(abs)) walk(abs);
  }
  return out;
}

// 换名复活扫描面：七类根全部存活文件（不限扩展名，同名新实现可能以任意扩展名出现）。
let allFilesCache = null;
const allSevenRootFiles = () => {
  if (!allFilesCache) allFilesCache = walkFiles(SEVEN_ROOTS, () => true);
  return allFilesCache;
};

// 调用点扫描面：存活生产代码 = 七类根下 .mjs/.ts/.js，排除测试文件。
const PROD_EXTS = new Set(['.mjs', '.ts', '.js']);
const PROD_EXCLUDED = [
  [/__tests__\//, '共置测试目录'],
  [/\.test\.[^/]+$/, '共置测试文件'],
  [/\.red\.test\.[^/]+$/, 'RED 过程测试文件'],
];
let prodFilesCache = null;
const productionCodeFiles = () => {
  if (!prodFilesCache) {
    prodFilesCache = walkFiles(SEVEN_ROOTS, (abs, rel) => {
      if (!PROD_EXTS.has(path.extname(abs))) return false;
      return !PROD_EXCLUDED.some(([rule]) => rule.test(rel));
    });
  }
  return prodFilesCache;
};

// 认证残留扫描面：存活 skills/workflows 的 SKILL.md / steps.json / skill-deps.yaml。
const SKILL_FILES = new Set(['SKILL.md', 'steps.json', 'skill-deps.yaml']);
let skillFilesCache = null;
const skillTextFiles = () => {
  if (!skillFilesCache) {
    skillFilesCache = walkFiles(['skills', 'workflows'], (abs) => SKILL_FILES.has(path.basename(abs)));
  }
  return skillFilesCache;
};

// docs 治理文本扫描面（B7/P8 组用）：docs/ 下存活 .md，排除归档/调研与决策日志（见排除清单）。
let docsFilesCache = null;
const docsTextFiles = () => {
  if (!docsFilesCache) docsFilesCache = walkFiles(['docs'], (abs) => path.extname(abs) === '.md');
  return docsFilesCache;
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const moduleBaseName = (p) => {
  const last = p.replace(/\/+$/, '').split('/').pop();
  return last.replace(/\.(mjs|cjs|mts|js|ts|json|md|ya?ml|html)$/i, '');
};

// A basename collision is only a new implementation when it is not an
// independently declared, pre-existing peer. Use the existing frozen migration
// anchor for path existence, never current bytes or a new tree snapshot.
const frozenMatch = fs.readFileSync(TABLE, 'utf8').match(/\*\*冻结记录\*\*：`([a-f0-9]{40})`/);
if (!frozenMatch) throw new Error('迁移表冻结记录缺失，无法区分既存同名文件与新实现');
const FROZEN_COMMIT = frozenMatch[1];
const peerExistenceAtFreeze = new Map();
function isDeclaredPreexistingPeer(rel) {
  const peer = ROWS.find((row) => {
    if (row.path === rel && ['NARROW', 'SURVIVOR'].includes(row.disposition)) return true;
    if (!row.disposition.startsWith('MOVE→')) return false;
    return row.path === rel || row.disposition.slice('MOVE→'.length) === rel;
  });
  if (!peer) return false; // NEW, DELETE, unregistered, or merely asserted peers remain candidates.
  if (!peerExistenceAtFreeze.has(peer.path)) {
    const paths = git(['ls-tree', '-z', '--full-tree', '--name-only', FROZEN_COMMIT, '--', peer.path]).split('\0');
    peerExistenceAtFreeze.set(peer.path, paths.includes(peer.path));
  }
  return peerExistenceAtFreeze.get(peer.path);
}

// ---- 认证残留模式归属（按迁移表备注中最贴近的删除批次；用户指示「B3 组查 skills
// 文本；B5/P6 组查 catalog/bundle hash 字段」） ----
const RESIDUE_PATTERNS = {
  'B3/P4': [
    {
      pattern: 'receipts.',
      reason: '回执消费文本（receipts.review/receipts.research 等）在 B3/P4 skills 文本批清理（MT-3-005、MT-3-012 备注明列）',
    },
  ],
  'B4/P5': [
    {
      pattern: 'run --action=',
      reason: '公共入口 stage-runtime run --action=* 随 B4/P5 runtime 机制核心退役（MT-1-069 stage-reflect.mjs 备注明列 run --action=reflect；canonical-receipt-writer MT-1-020 为 verify --action=execute 现役入口）',
    },
    {
      pattern: '<sha256>.json',
      reason: '内容寻址事实命名 quality/facts/<sha256>.json 的 fact graph 本体在 B4/P5 删除（MT-1-032 quality-fact.mjs 备注明列）',
    },
    {
      pattern: 'snapshot_tree',
      reason: '材料快照树绑定字段在 B4/P5 剥离（MT-1-018、MT-5-001/MT-5-002 备注明列）',
    },
    {
      pattern: 'material_revision',
      reason: '材料 revision 绑定字段在 B4/P5 剥离（MT-1-013、MT-5-001、MT-3-079 备注明列）',
    },
  ],
};
// 注：catalog/bundle 双层 hash 字段（local_bundle_hash / snapshot_sha256）按用户指示属
// B5/P6 组，但其处置已登记在 MT-3-001（skills/catalog.yaml NARROW B5/P6）一行，不重复
// 纳入本测试模式清单（一个删除面只挂一处断言，防双登记）。

describe('thin-core residue（AC-29）', () => {
  // 断言 1/2：换名复活 + 调用点，按批次分组（批次 ≤ current 的 DELETE 行）。
  for (const [index, label] of BATCH_LABELS.entries()) {
    if (index > CURRENT) break;
    const rows = DELETE_ROWS.filter((r) => r.batch === label);
    const patterns = RESIDUE_PATTERNS[label] ?? [];
    describe(label, () => {
      for (const r of rows) {
        // 断言 1：换名复活——已删模块 basename 不得作为同名新文件出现在七类根
        //（原扫描面与排除清单不变）；允许主表声明且冻结时已存在的独立NARROW/SURVIVOR/MOVE peer，
        // NEW、未登记、冻结后新增或其它DELETE peer仍不得成为「同名不同路径的新实现」。
        it(`已删模块 ${r.path} 无同名新实现（换名复活）`, () => {
          const base = moduleBaseName(r.path);
          const reborn = allSevenRootFiles().filter((rel) => rel !== r.path
            && moduleBaseName(rel) === base && !isDeclaredPreexistingPeer(rel));
          expect(reborn, `已删模块 ${base} 以新路径复活：${reborn.join(', ')}`).toEqual([]);
        });
        // 断言 2：调用点——存活生产代码不得出现 from "...<被删模块路径>" 或
        // import("<被删模块路径>") 的静态文本。动态拼接的 import 静态扫不到，
        // 由 AC-29 自举（人工审查 + 关键词交叉扫描）补足。
        it(`存活生产代码无 ${r.path} 静态调用点`, () => {
          const esc = escapeRe(r.path);
          const re = new RegExp(`(?:from\\s+["'][^"']*${esc}["']|import\\s*\\(\\s*["'][^"']*${esc}["'])`);
          const hits = [];
          for (const rel of productionCodeFiles()) {
            const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
            if (re.test(text)) hits.push(rel);
          }
          expect(hits, `存活生产代码仍静态引用 ${r.path}：${hits.join(', ')}`).toEqual([]);
        });
      }
      // 断言 3：认证残留——存活 skills/workflows 的 SKILL.md/steps.json/skill-deps.yaml
      // 不得包含归属本批的认证残留字符串。
      for (const { pattern, reason } of patterns) {
        it(`skills/workflows 文本不含「${pattern}」（${reason}）`, () => {
          const hits = [];
          for (const rel of skillTextFiles()) {
            const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i += 1) {
              if (lines[i].includes(pattern)) hits.push(`${rel}:${i + 1}`);
            }
          }
          expect(hits, `存活技能文本仍含认证残留「${pattern}」：${hits.join(', ')}`).toEqual([]);
        });
      }
      // 断言 4（B7/P8 组）：开工横幅收口删除 + docs 治理文本不得含「run --action」类现行描述。
      if (label === 'B7/P8') {
        it('CARD-06-IN-PROGRESS.md 已收口删除（MT-7-114：P1 创建、P8 收口）', () => {
          expect(fs.existsSync(path.join(ROOT, 'CARD-06-IN-PROGRESS.md'))).toBe(false);
        });
        it('docs 治理文本不含「run --action」类现行描述', () => {
          const hits = [];
          for (const rel of docsTextFiles()) {
            const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i += 1) {
              if (lines[i].includes('run --action')) hits.push(`${rel}:${i + 1}`);
            }
          }
          expect(hits, `docs 治理文本仍含「run --action」现行描述：${hits.join(', ')}`).toEqual([]);
        });
      }
      if (rows.length === 0 && patterns.length === 0 && label !== 'B7/P8') {
        it('本批无 DELETE 行/残留模式（预留组，随批次推进获得断言对象）', () => {
          expect(rows.length + patterns.length).toBe(0);
        });
      }
    });
  }
});
