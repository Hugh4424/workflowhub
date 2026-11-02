# C07 收敛清单机器可读：实测报告（2026-10-31）

## 0. 结论
两处结构改动已落：decision-log 指针 + 清单首列 M→数字。checker 现在能读回 10 个模块行（改前 0），
但 8 项证据全部 0/8、state 空、complete=false。原因是代码要 10 格台账（8 证据 + 状态），
清单是 5 格摘要；且 C07 decision-log 的 `#### 决定 N —` 标题与无 AC/OI 表行使 5/8 证据无锚可解。
已按纪律停手，未改清单内容。

## 1. 代码规则（主仓 tools/cli/check-stage-steps.mjs，工作树版 17304 B，sha256 ce8bba87526f3c26fd920b46111bab0b86127ceeaf4b3e660e7fa992001c29d0）
- L126 指针：
  const pointers = [...new Set([...decision.matchAll(/`(quality\/evidence\/[^`\n]*convergence-checklist[^`\n]*\.md)`/g)].map(match => match[1]))];
- L206-207：恰好 1 个指针；路径不得含 . / .. / \
- L210-213：realpath 必须位于 `<taskPath>/quality/evidence` 之内（相对 taskPath，不是 materialRoot）
- L215 行：filter(line => /^\|\s*\d+\s/.test(line))   // 首列数字+空白
- L216-217 列：cells = split('|').slice(1,-1).map(trim)；
  fields = ['目标','边界','方案与取舍','验收','风险','依赖','消费者','未决/无']
- L218-222：cells[index+1] 为 8 项证据；state = cells[9]  → 共 10 格
- L238：row.state !== '已收敛' || 任一 field !present → gap
- L243：complete = gaps.length===0 && expected.length>0
- L164-205 每格可解引用：D-xxx（需 `#### D-xxx —` 或 `#### 决定 N：` 正文）；AC-/OI-（需恰 1 张表行）；
  details§N（需 module-details 指针与节）；WPn（需包正文）；依赖/未决“无”；消费者须与包内“消费者是…”逐词一致。
- L144-153 decisionBody：直读 `^(#{1,6})\s+${id}\s*[—–-]`，否则经旧编号对照找 `^#{1,6}\s+决定\s*N\s*[:：]`（冒号）。

## 2. 两处改动（局部替换，逐行 diff 已核）
### decision-log.md（worktree specs/C07，第 274 行后 +2 行）
before:
`research/…` 指任务库的调研目录，`refs/…` 指决策日志原件目录。
after:
`research/…` 指任务库的调研目录，`refs/…` 指决策日志原件目录。

收敛清单唯一原件：`quality/evidence/decision-log-refs/convergence-checklist.md`。
（全篇 convergence-checklist 出现 1 次）

### quality/evidence/decision-log-refs/convergence-checklist.md（任务库）
before 首列：| M1 定位与形态 | …  … | M10 交付证据与防假绿 | …
after  首列：| 1 定位与形态 | …  … | 10 交付证据与防假绿 | …
其余单元格逐字节未动；diff 只有 10 行，删除 10 个“M”。

代码要的列：| 编号 | 目标 | 边界 | 方案与取舍 | 验收 | 风险 | 依赖 | 消费者 | 未决/无 | 状态 |
现有列：    | 包   | 状态 | 五段表位置 | 证据 | 未决/缺口 |

## 3. checker 读回前后
命令：
node tools/cli/check-stage-steps.mjs --stage=make-decision \
  --task-path=<任务库 C07> \
  --material-root=<worktree specs/C07>
（--task-path 必须是含 task.json/quality 的任务库；拿 material-root 当 task-path 实测 ENOENT）

before（/tmp/c07-before.json）:
modules=0; source=null; errors=1 ["收敛清单: 未取得唯一当前任务收敛清单指针"];
gaps = 缺模块 WP1..WP11 + 收敛清单指针未取得（12 项）

after（/tmp/c07-after.json）:
modules=10; source=quality/evidence/decision-log-refs/convergence-checklist.md;
errors=80（10 行 × 8 项“未取得可回读的当前证据”）;
state 全 ""；fields 0/8 × 10;
gaps = ["1 定位与形态",…,"10 交付证据与防假绿","缺模块 WP11"]（11 项）; complete=false。
text 行：收敛 complete=false；gaps=["1 定位与形态",…,"10 交付证据与防假绿","缺模块 WP11"]

## 4. 为什么“只改首列”到不了 8/8（实测）
- 5 格被当成 10 格读：状态→目标、五段表位置→边界、证据→方案与取舍、未决→验收；state 无第 10 格。
- 造 10 格行测：`| 1 定位与形态 | D-001 做什么 | D-001 不做什么 | D-001 方案 | AC-01 | D-001 风险 | 无 | <消费者原句> | 无 | 已收敛 |`
  → 目标/边界/方案与取舍/验收/风险 = false；依赖/消费者/未决 = true。
- 用 `决定 1` 填：报错 `决定 1 未取得旧编号映射或正文`（C07 标题是 `#### 决定 1 —`，L149 只认 `：`）。
- `| AC-… |`、`| OI-… |` 表行在 decision-log 中不存在（验收面是散文；未决表行是 `| 未决 1 |`）。
- 全填 `WP1` 的行 8/8 true —— 证明规则可被“假映射”满足，不能这么写。
- 清单 10 行 vs decision-log 11 包（缺 WP11）；M10 自述 partial，故 complete 真值应为 false。

## 5. 选项（需 parent 决定）
A. 保持现状：清单可定位、10 行可列出；80 条“未取得”如实暴露 5 格摘要不是 8 项台账。不再改内容。
B. 授权重做：清单重排 11 行×10 格（8 项真指针 + 状态），并让锚点可解（decision-log 加 `#### D-xxx —`
   或改 `决定 N：`；补 AC/OI 表行或 module-details§N）。属内容/结构改动，超出“只改首列”；M10 partial
   下 complete 仍应为 false。
建议：只要清单能被列出选 A；要 8 项可机核选 B。

## 6. 数字
decision-log: 166841 → 166934 B；sha256 c3a1eff9… → b1e7f8d4b0d6a192b1c63b570faee743eb5abd1f6356ba3f4172f0443efb4068
清单:         2528 → 2518 B；  sha256 1a154a56… → 7e69e16fd8577d8e062646239e037558d40f65cdb44848eff6081c08a4aa0e62
结构计数不变：^## =21；^### =29；^### 工作包 =11；^#### 决定 =44；^### 需求 =0（本日志不用）
清单：行 21；表格行 12；数字首列行 10。
run-checks: exit 0；ALL CHECKS PASSED；[run-checks][material] PASS … phase_count=12 task_count=36 errors=0
  （另有别任务 decision-log 的 D-015 advisory 警告；material level basis 仍“未读到级别事实”，改前即如此）
check-stage-steps: exit 0（report-only）。
