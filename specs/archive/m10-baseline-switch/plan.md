# M10 Plan — 基线映射 + 自举切换

## Technical Context
- Runtime: Node.js 22 ESM (.mjs)
- Repo: workflowhub monorepo
- Key deps: metrics/baseline.mjs (import DERIVED_METRICS + DERIVATION_SOURCE constants only), metrics/collector.mjs (recordSkeleton + updateOwnResult), metrics/record-schema.mjs (CORE_FIELDS)
- No new npm dependencies

## Constitution Check
| Clause | Check | Notes |
|--------|:-----:|-------|
| F8 简单优先 | YES | 独立脚本，用完可删；固定表格，不做图表 |
| F10 CI 只做轻量冒烟 | YES | CI 只跑 script smoke + schema validate，不执行 skill |
| 不新增 blocking gate | YES | 对照结论人拍，不设自动阻断 |
| YAGNI | YES | 不建三层抽象，不修 host-adapter |
| 可证伪 | YES | 每 AC 可在声明为假时验证不通过 |

## 最简方案判断

Ladder: 需求真实→已有baseline.mjs不能直接用(硬编码M1-M3+无文件I/O)→新增独立脚本(最少代码)→停。

非显然取舍:
- 不扩展baseline.mjs: 桥用完拆，避免agenthub退役后死代码嵌入核心
- collector只修verify-code: M10需要verify-code产对照数据;build-code/make-decision的接线是它们自己的事
- 基线固定快照不滚动: 避免基线自己漂移导致对照失真

## 项目文件结构

新增文件（全部在workflowhub repo）:
```
workflowhub/
├── scripts/
│   └── agenthub-baseline.mjs          # 独立基线脚本(import baseline.mjs常量)
├── workflows/verify-code/
│   └── metrics-writer.mjs             # collector接线(~30行)
├── docs/
│   ├── freeze-and-retire.md           # 冻结/退役规则
│   └── migration-and-fallback.md      # 迁移/回滚流程
├── specs/m10-baseline-switch/
│   ├── field-mapping.md               # 5行×7列字段映射样例
│   └── baseline-report.md             # 首个端到端对照报告
├── .github/workflows/ci.yml           # 追加M10 smoke job
└── contracts/
    └── field-mapping.schema.json       # 字段映射CI校验schema
```

无删除/合并/重命名。baseline.mjs不受影响(hash不变)。

## 证据契约预声明

```evidence-contract
{"evidenceContract":{"red":{"command":"node scripts/agenthub-baseline.mjs --baseline-only 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":1,"timestamp":"2026-06-26T00:00:00.000Z","phase":1,"mode":"RED"},"green":{"command":"node scripts/agenthub-baseline.mjs --baseline-only 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":0,"timestamp":"2026-06-26T00:00:00.000Z","phase":1,"mode":"GREEN"},"evidenceSink":"apply/evidence/phase-1-GREEN.json","affectedTests":["tests/agenthub-baseline.test.mjs"]}}
{"evidenceContract":{"red":{"command":"cd workflows/verify-code && node -e 'require("./metrics-writer.mjs")' 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":1,"timestamp":"2026-06-26T00:00:00.000Z","phase":2,"mode":"RED"},"green":{"command":"cd workflows/verify-code && node -e 'require("./metrics-writer.mjs")' 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":0,"timestamp":"2026-06-26T00:00:00.000Z","phase":2,"mode":"GREEN"},"evidenceSink":"apply/evidence/phase-2-GREEN.json","affectedTests":["tests/metrics-smoke.test.mjs"]}}
{"evidenceContract":{"red":{"command":"node scripts/agenthub-baseline.mjs --report 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":1,"timestamp":"2026-06-26T00:00:00.000Z","phase":3,"mode":"RED"},"green":{"command":"node scripts/agenthub-baseline.mjs --report 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":0,"timestamp":"2026-06-26T00:00:00.000Z","phase":3,"mode":"GREEN"},"evidenceSink":"apply/evidence/phase-3-GREEN.json","affectedTests":["tests/agenthub-baseline.test.mjs"]}}
{"evidenceContract":{"red":{"command":"npx markdownlint docs/freeze-and-retire.md docs/migration-and-fallback.md 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":1,"timestamp":"2026-06-26T00:00:00.000Z","phase":4,"mode":"RED"},"green":{"command":"npx markdownlint docs/freeze-and-retire.md docs/migration-and-fallback.md 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":0,"timestamp":"2026-06-26T00:00:00.000Z","phase":4,"mode":"GREEN"},"evidenceSink":"apply/evidence/phase-4-GREEN.json","affectedTests":["tests/baseline.test.mjs"]}}
{"evidenceContract":{"red":{"command":"npm run check 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":1,"timestamp":"2026-06-26T00:00:00.000Z","phase":5,"mode":"RED"},"green":{"command":"npm run check 2>&1; echo EXIT=$?","cwd":"/Users/Hugh/Hugh/Project/workflowhub","git_sha":"PLACEHOLDER","exit_code":0,"timestamp":"2026-06-26T00:00:00.000Z","phase":5,"mode":"GREEN"},"evidenceSink":"apply/evidence/phase-5-GREEN.json","affectedTests":["tests/baseline.test.mjs","tests/metrics-collector.test.mjs","tests/execution-record.test.mjs"]}}
```

## 验证策略

### 交付验证
- [ ] Phase 1: `node scripts/agenthub-baseline.mjs --baseline-only` exit=0 且输出含5项指标
- [ ] Phase 2: verify-code 目录下 metrics-writer.mjs 存在且 `node -e 'require("./metrics-writer.mjs")'` 不报错
- [ ] Phase 3: 对照报告含5行数据 + source_type列 + 三行结论
- [ ] Phase 4: 两个md文件 markdownlint 通过 + 含N=3/5 + 四分支判定
- [ ] Phase 5: `npm run check` exit=0

### 异常验证
- [ ] journal格式异常 → agenthub-baseline.mjs 报明确错误行号和缺失字段，不静默吞
- [ ] collector接线后E2E跑不通 → verify-code 报错不静默吞
- [ ] 分母为0 → test_execution_rate/review_execution_rate 输出 null + unable_to_derive
- [ ] baseline=null或workflowhub=null → 不参与2倍倒退判断

### 测试验证
| Phase | gate_cmd | display_cmd |
|-------|---------|-------------|
| 1 | `node --test tests/agenthub-baseline.test.mjs` | `pnpm test` |
| 2 | `node --test tests/metrics-smoke.test.mjs` | `pnpm test` |
| 3 | `node --test tests/agenthub-baseline.test.mjs` | `pnpm test` |
| 4 | `npx markdownlint docs/*.md` | `npx markdownlint docs/*.md` |
| 5 | `npm run check` | `npm run check` |

### 代码验证
- Lint: markdownlint (docs), ESLint (JS), per CLAUDE.md
- CI: .github/workflows/ci.yml 追加 M10 smoke job

## 数据流向

```
agenthub tasks/                     workflowhub
  review-cost-deep-reduction/ ─┐
  ns1b-attribution-freeze-fix/ ─┤
  gate-debloat-and-admission/ ──┼──→ scripts/agenthub-baseline.mjs
  test-quality-executor-system/ ┘    │ import DERIVED_METRICS (baseline.mjs)
                                     │ read journal.jsonl ×4
                                     │ compute 5 metrics
                                     ▼
                               specs/m10-baseline-switch/
                                 baseline-report.md  ← 基线对照报告
                                 field-mapping.md    ← 字段映射样例

workflows/verify-code/
  metrics-writer.mjs ──→ import collector.mjs
                         recordSkeleton → run → updateOwnResult
                         ▼
                       task-metrics.jsonl  ← 对照数据源
```

## 复用优先矩阵

| 能力 | 来源 | 复用方式 |
|------|------|---------|
| DERIVED_METRICS | metrics/baseline.mjs | import 常量，不修改 |
| DERIVATION_SOURCE | metrics/baseline.mjs | import 常量，不修改 |
| recordSkeleton | metrics/collector.mjs | import 函数，直接调用 |
| updateOwnResult | metrics/collector.mjs | import 函数，直接调用 |
| CORE_FIELDS | metrics/record-schema.mjs | import 验证绑定 |
| stage-result contract | contracts/ | 引用，不修改 |

## 实现风险点

| 风险 | 阶段 | 缓解 |
|------|:--:|------|
| journal格式跨task不一致 | 1 | 4个task覆盖不同复杂度;缺字段输出null不崩溃 |
| proxy推导误差(phase_pre_review≠测试真跑了) | 1,3 | 标注weak_proxy;报告中诚实说明推导局限 |
| collector接线后verify-code E2E跑不通 | 2 | Phase 2先跑smoke test,不通过即停 |
```