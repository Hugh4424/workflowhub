// W5: assemble the walkthrough ledger from the raw outputs just produced.
// Every number below is read back from a raw original in this directory.
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const dir = "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-31-p6-walkthrough";
const repo = '/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028';
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const at = path => statSync(path).mtime.toISOString();
const exitCodes = JSON.parse(readFileSync(`${dir}/exit-codes.json`, 'utf8'));
const entry = JSON.parse(readFileSync(`${dir}/01-entry-route-replay.json`, 'utf8'));
const ledger = JSON.parse(readFileSync(`${dir}/02-steps-ledger.json`, 'utf8'));
const testText = readFileSync(`${dir}/03-contract-test.txt`, 'utf8');
const runlist = JSON.parse(readFileSync(`${dir}/04-runlist-15x15.json`, 'utf8'));
const steps = ledger.stages[0].steps;
const testSummary = testText.split('\n').find(line => /Tests\s+\d+ passed/.test(line))?.trim() ?? '未取得';
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();

const nine = [
  { n: 1, name: '入口四级选择', label: '观察到生效',
    evidence: '由 w1 重放真实入口函数，与原件 6 字段全等（route_matches_original，exit 0）；用户覆盖记为「2026-10-28 用户正式选『继续复杂路线』…级别为复杂」。附带：日志无可解析「- 推荐级别：」行，checker 报「未读到级别事实」，与方法规定的降级一致。',
    originals: ['01-entry-route-replay.json', '02-steps-ledger.json', 'specs/…/decision-log.md#级别与路线'] },
  { n: 2, name: '调研决策', label: '观察到生效',
    evidence: '真实答复 Talk-Q Q1「够了，按现有调研定大纲（推荐）」（答复 42 / U-C07-42）；选择与理由记为「调研取内部加外部加专项」，原 ref 为 research/2026-10-28-002-c07-internal-capability.md；未跳过，跳过缺口不适用。',
    originals: ['quality/evidence/decision-log-refs/talk/2026-10-28-c07-direction.md:177', 'specs/…/decision-log.md:236,292'] },
  { n: 3, name: '大纲确认', label: '观察到生效',
    evidence: '真实答复 Talk-C C3「按这个骨架继续」（U-C07-09；D-006）确认骨架，与第 13 步最终确认分列两件原件。附带缺口：talk 原件自述该轮骨架正文未保存，展示稿无原件。',
    originals: ['quality/evidence/decision-log-refs/talk/2026-10-28-c07-direction.md:22,264'] },
  { n: 4, name: '方向审查时点', label: '观察到生效',
    evidence: 'review 原件 review_track=direction、status=available-with-failures、10 条 finding，2026-10-28T09:00:59Z→09:12:59Z；位于大纲确认之后、细节审查（09:22）之前；细节审查 status=unavailable，真实不可用分支也留了痕。',
    originals: ['quality/reviews/2026-10-28-005-make-decision-direction.json', 'quality/reviews/2026-10-28-006-make-decision-detail.json'] },
  { n: 5, name: '逐模块台账', label: '观察到生效',
    evidence: '修好的 checker 认中文包标题后读回 11 个包（expected_modules 1～11），收敛清单 10 行逐包一行也读回，包集合差为「缺模块 WP11」一条真信号。覆盖上限：8 项证据指针列与三值这次读数仍是 0/8，因工具契约要 10 格、C07 清单是 5 格人类格式（D3），不并入本结论。',
    originals: ['02-steps-ledger.json', 'quality/evidence/decision-log-refs/convergence-checklist.md:5'] },
  { n: 6, name: '细节审查前检查', label: '部分可观察',
    evidence: '机读层面观察不到：complete=false 的 10 条包级 gap 恒真，人类状态全改「已收敛」也不减，恒真即无信号。人读层面观察得到：清单第 2 列 M10 是 partial（r3 设计层关闭、可核层 R1 仍开），按判据该停在细节审查前；「缺模块 WP11」是 11 个包标题对 10 行清单的真集合差，补一行即消失。两层分开记，不合并。',
    originals: ['02-steps-ledger.json', 'quality/evidence/decision-log-refs/convergence-checklist.md:5,15'] },
  { n: 7, name: '领域词表读回', label: '观察到生效',
    evidence: '收口手记记录 GLOSSARY.md 314 行、sha256 b9b04b64…，新增 15 词；现文件 320 行、sha256 bf5c87a3…，两节仍在，写入与身份可回读。附带缺口：314→320 那次改动无对应读回原件。',
    originals: ['quality/evidence/handoff/2026-10-28-001-make-decision-handoff.md:26', 'GLOSSARY.md'] },
  { n: 8, name: '可核运行清单', label: '观察到生效',
    evidence: '由 w4 独立比对：15 行、顺序相等、无重复、无缺无多、15 条判据逐字相等，exit 0；契约测试 runlist 组同一结论。',
    originals: ['04-runlist-15x15.json', '03-contract-test.txt'] },
  { n: 9, name: '最终确认＝阶段收口', label: '观察到生效',
    evidence: '确认原件 decision=approved、reply「确认，收口当前阶段并生成交接（推荐）」、head 84361c45；交接原件给绝对路径清单，并写明「不得自动进入 build-plan 或建议马上开始」，不催下一阶段。',
    originals: ['quality/evidence/human-confirmations/2026-10-28-001-make-decision-approved.json', 'quality/evidence/handoff/2026-10-28-001-make-decision-handoff.md'] },
];
const count = label => nine.filter(row => row.label === label).length;
const record = {
  walked_at: new Date().toISOString(),
  walker: 'P6 验收子代理（非 P6 实施者；context none 非 fork）',
  repo, repo_head: head,
  task_dir: '/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c07-real-page-verification-20261028',
  commands: [
    { id: 'W1', cmd: `node ${dir}/w1-entry-route-replay.mjs`, exit: exitCodes.w1, output: '01-entry-route-replay.json', sha256: hash(`${dir}/01-entry-route-replay.json`), captured_at: at(`${dir}/01-entry-route-replay.json`) },
    { id: 'W2', cmd: `node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=<task_dir> --material-root=<repo>/specs/<task-id> --repo-root=<repo>`, exit: exitCodes.w2, output: '02-steps-ledger.txt', sha256: hash(`${dir}/02-steps-ledger.txt`), captured_at: at(`${dir}/02-steps-ledger.txt`) },
    { id: 'W2j', cmd: '同一命令加 --json', exit: exitCodes.w2j, output: '02-steps-ledger.json', sha256: hash(`${dir}/02-steps-ledger.json`), captured_at: at(`${dir}/02-steps-ledger.json`) },
    { id: 'W3', cmd: 'node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs', exit: exitCodes.w3, output: '03-contract-test.txt', sha256: hash(`${dir}/03-contract-test.txt`), captured_at: at(`${dir}/03-contract-test.txt`) },
    { id: 'W4', cmd: `node ${dir}/w4-runlist-check.mjs`, exit: exitCodes.w4, output: '04-runlist-15x15.json', sha256: hash(`${dir}/04-runlist-15x15.json`), captured_at: at(`${dir}/04-runlist-15x15.json`) },
  ],
  facts: {
    entry_route: { verdict: entry.verdict, differing_fields: entry.differing_fields },
    ledger: { stage: ledger.stages[0].stage, mapping: ledger.stages[0].mapping, step_rows: steps.length,
      judgments: [...new Set(steps.map(row => row.judgment))], convergence: ledger.convergence,
      level: ledger.level, errors: ledger.errors.length },
    contract_test: { summary: testSummary, exit: exitCodes.w3 },
    runlist: { verdict: runlist.verdict, rows: runlist.runlist_rows, order_equal: runlist.order_equal, criterion_diffs: runlist.criterion_diffs },
  },
  nine_rows: nine,
  coverage: { observed_effective: count('观察到生效'), partial_observable: count('部分可观察'),
    observed_ineffective: count('观察到未生效'), unobservable: count('本次观察不到'), total: nine.length },
  defects: [
    { id: 'D1', kind: '工具链', status: 'fixed', symptom: 'checker 只认 WPn 标题，台账用「工作包 ①～⑩」（中文编号），读不回包表',
      impact: '修前第 5、6 条观察不到；修后 11 个包与 10 行清单都能读回',
      owner: 'checker 维护者', fix: '认中文包标题与 WPn 同一包集合', effort: '已修',
      rejudge: '2026-10-31 用同一条 W2 重跑：expected_modules 1～11、包行读回' },
    { id: 'D2', kind: '材料', status: 'open', symptom: 'decision-log.md 无可解析的「- 推荐级别：」行',
      impact: 'checker 恒报「未读到级别事实」，判级事实取不到',
      owner: '决策日志作者', fix: '补一行可解析字面', effort: '约 10 分钟',
      rejudge: '补后重跑一次检查器' },
    { id: 'D3', kind: '工具契约', status: 'open-not-now', symptom: 'checker 的模块行契约要 10 格（编号 + 8 项证据 + 状态），C07 收敛清单是 5 格人类格式（包／状态／五段表／证据／未决）',
      impact: '10 行各 8 项「未取得」共 errors=80；包级状态读不进来，10 条包级 gap 恒真、不作停点信号',
      owner: 'checker 契约 owner 与材料作者共同议',
      fix: '要么清单补 8 列，要么 checker 放宽到 5 格映射',
      effort: '清单补 8 列约半天且要逐包回填证据；checker 放宽要改契约与反例',
      rejudge: '不建议现在改：人读 5 格已够用，机读另有「缺模块 WP11」这类真信号；成本远大于收益，先记不改' },
  ],
  cap: '只证 make-decision 九条修复的效果；不证页面、不证采集器、不证审查编排、不证新一次真实用户答复。第 6 条只到「部分可观察」：机读停点信号恒真不可用，人读 partial 与集合差可用；8 项证据指针读数受 D3 限制。',
  tier: 'available',
};
writeFileSync(`${dir}/06-walkthrough-ledger.json`, JSON.stringify(record, null, 2));
console.log(JSON.stringify({ coverage: record.coverage, tier: record.tier, steps: record.facts.ledger.step_rows, test: testSummary, runlist: runlist.verdict, entry: entry.verdict }, null, 2));
