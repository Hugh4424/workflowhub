# 任务清单：m14b-fact-collection-g2

**前置**: 已接受 `spec.md` 与本计划
**规则**: 每项包含输入、输出、依赖、改动范围和验证；`[P]` 表示可并行且不写同一文件。

## Stage 1：确定性合同

- [ ] **T001 实现纯记录合同与归并算法**
  输入：接受规格 REQ-010/020/030/040、公共原因码、M14a 九域与 skills schema。
  输出：新增 `core/fact-indexes.mjs`，提供固定字段构造/校验、安全错误、JSONL parse、canonical hash、稳定排序、同 hash 合并和异 hash 冲突；skills 同键冲突返回文件级失败。
  依赖：无。
  改动范围：仅 `core/fact-indexes.mjs`；复用 `runtime/evidence/canonical-source.mjs` 的 `canonicalJson/contentHash`，不复制 hash 实现。
  需求：REQ-010~014、020、022、030、040、051；AC-003~007、015。
  验证：表驱动测试证明相反输入顺序语义/字节一致；坏行可见且合法行保留；unsupported version 失败；冲突不覆盖。

- [ ] **T002 建立纯函数测试与最小 M14b fixture**
  输入：规格 §13、现有 TaskHandle/Workspace/M14a 测试 helper。
  输出：新增 `tests/m14b-fact-collection.test.mjs`；先完成 T001 的表驱动断言，再建立临时 task、临时 git repo、accepted Workspace、catalog/bundle、注入时钟和 sentinel helpers。
  依赖：T001。
  改动范围：仅该测试文件；不新增全 CLI fixture 目录，不维护 fixture hash。
  需求：REQ-010~014、020、022、051 的纯算法部分；AC-003~007、015；其余 AC 只建立 helper，不在本任务宣称通过。
  验证：相反输入顺序字节一致、坏行/版本/冲突反例真实变红；fixture 可独立创建/销毁，不污染用户 task 或仓库。

## Stage 2：可信来源采集

- [ ] **T003 实现入口预检、可信 transcript registry 与 artifact 投影**
  输入：branded StageContext、accepted make-decision/build stages、TaskHandle canonical records、ArtifactDir 正式 refs、Workspace snapshot。
  输出：新增 `runtime/evidence/fact-collector.mjs` 的 preflight、严格 entry validator/WeakSet branded registry helper、空 registry missing、登记 JSONL reader 路径和 artifact 固定 ref extractor；新增空的 `config/transcript-sources.mjs`；在 TaskHandle 增加仅枚举 `results/<stage>/attempt-NNNN.json` 的受控 `listStageAttemptRefs(stage)`，覆盖正式但未 accepted 的 attempts；可选来源错误转安全 missing/unknown。
  依赖：T001、T002。
  改动范围：`runtime/evidence/fact-collector.mjs`、`config/transcript-sources.mjs`、`core/task-handle.mjs`、`core/__tests__/task-handle.test.mjs`；不得收裸 task/worktree/source path，不做任意目录递归扫描，不扫描 HOME/cwd/私有缓存；生产 registry 为空，只有 launcher-issued 完整登记 capability 可读。
  需求：REQ-001~003、010~014、020~022；AC-001~008、011。
  验证：错误 root/baseline 在任何来源读取与写入前失败；当前 dirty tree 可采集；registry 缺字段/额外字段/重复 ID/未品牌化 reader 在 I/O 前失败，空 registry 只产指定 missing，完整但 unsupported 的 entry 产 unknown；登记 JSONL 坏行端到端经过 collector；required missing 与不可认证 unknown 分离；TaskHandle 专项单测覆盖排序、非法名、symlink、目录身份变化，artifact 映射覆盖 accepted 与未 accepted canonical attempts 的固定字段。

- [ ] **T004 实现 health 与 skills 投影**
  输入：T003 transcript/artifact 结果、认证身份/snapshot、正式 review/verify/handoff facts、metrics 直接事实、`skills/catalog.yaml`、stage config、`workflows/*/skill-deps.yaml`、已验证 bundle/closure。
  输出：`runtime/evidence/fact-collector.mjs` 来源适配 + `core/fact-indexes.mjs` 九域 health 和 M14a-compatible skills inventory。
  依赖：T001、T003。
  改动范围：上述两个模块；复用 `checkSkillClosure`/local skill resolver，不复制 closure；运行时直接校验 M14a schema，不修改/复制 schema。
  需求：REQ-030~031、040~041；AC-007、009、010、014。
  验证：domain 仅九词；无 metrics 证据时 token_waste unknown；输出无 severity/root cause/fix；skills 通过原 schema且无 run_id/hash/entrypoint；同键冲突使 skills 文件失败。

## Stage 3：持久化与入口

- [ ] **T005 实现单任务锁内四文件原子写与结果汇总**
  输入：四类候选、TaskHandle 既有 `indexes/*`、T001 merge functions。
  输出：`collectTaskFacts` 在单一任务锁内完成四文件各自 read-merge-write，返回固定 `status/files/warnings`；任何 saved=false 令总体 failed，其余文件继续；health 基于前序实际保存/保留的最终 transcript/artifact 记录。
  依赖：T003、T004。
  改动范围：`runtime/evidence/fact-collector.mjs`；锁固定为 `locks/indexes/fact-collection.lock`，写固定为 `indexes/transcript-index.jsonl`、`artifact-index.jsonl`、`flow-health-facts.jsonl`、`skills-inventory.json`；只调用 TaskHandle lock/atomic API。
  需求：REQ-050~052；AC-012、013。
  验证：既有坏 JSONL 转可见事实；schema 超版本只失败对应文件；单文件失败不回滚成功文件且不得 success；失败目标保持完整旧字节。

- [ ] **T006 [P] 复用并补足 TaskHandle 原子故障测试 seam**
  输入：现有 `afterParentPrecheck` / `afterOpenBeforeRename` hooks 与 AC-012。
  输出：复用 `afterParentPrecheck` 注入祖先变化、`afterOpenBeforeRename` 注入 rename 前失败；只新增 `beforeFileFsync`、`beforeDirectoryFsync` 两个现有 hook 无法覆盖的注入点，默认未提供时生产路径完全不变；补既有 TaskHandle 单测。
  依赖：T003。
  改动范围：`core/task-handle.mjs`、`core/__tests__/task-handle.test.mjs`；不重写 lock/rename/fsync，不向 collector 暴露底层 writer。
  需求：REQ-050、052；AC-012、013。
  验证：file-fsync/rename 前失败时旧字节不变；rename 后 directory-fsync 失败时文件仍是完整旧/新版本且 saved=false；临时文件清理，后续正常写仍可用。

- [ ] **T007 建立唯一 launcher 与 metrics 接线**
  输入：`--stage/--project/--task`、`loadConfig()`、`bootstrapStage()`、launcher metrics capability。
  输出：新增 `tools/cli/collect-task-facts.mjs`；从显式静态登记创建 branded transcript registry（当前为空）；入口 `recordSkeleton`，退出 `finally` 中 `updateOwnResult`，打印结构化采集结果并以 failed 对应非零退出。
  依赖：T005。
  改动范围：该 launcher 与 `runtime/evidence/fact-collector.mjs` 的窄入口；禁止 task-path/worktree override、raw config 与 storage search。
  需求：REQ-001、002、052、053；AC-001、011、013。
  验证：错误参数/错误 Workspace fail-loud；metrics 写失败只产生 warning；索引成功/失败与进程退出真实一致。

## Stage 4：验收

- [ ] **T008 完成来源、归并、health/skills 验收测试**
  输入：T001~T005、T002 fixture。
  输出：`tests/m14b-fact-collection.test.mjs` A-D 组覆盖正常、无 transcript、missing/unknown、坏行、不支持版本、幂等、冲突、artifact refs、九域、skills schema、错误 Workspace、非阻断质量事实、版本分离。
  依赖：T005。
  改动范围：仅 M14b 测试文件。
  需求：REQ-001~041、051；AC-001~011、014、015。
  验证：`npx vitest run tests/m14b-fact-collection.test.mjs`，并故意制造每种反例确认测试真实变红。

- [ ] **T009 完成并发与写失败验收测试**
  输入：T005、T006、T007。
  输出：M14b 测试 E 组：两个 Node 子进程同时更新同一索引；验证最终 health 使用最终 transcript/artifact 合并记录；fsync/rename/ancestor/单目标失败矩阵。
  依赖：T005、T006、T007。
  改动范围：M14b 测试文件，必要时测试进程用 `node --input-type=module -e` 导入正式 launcher/module；不新增生产锁。
  需求：REQ-050~053；AC-012、013。
  验证：最终文件完整可 parse、无交错/截断/丢失；失败文件 saved=false、总体 failed、其他文件仍写；pre-rename 旧字节不变，post-rename 文件完整且不假成功。

- [ ] **T010 运行回归、结构检查与逐项验收**
  输入：T001~T009 的最终工作树。
  输出：命令退出码和 AC-001~015 映射结论，供 build-code receipt/独立审查使用。
  依赖：T008、T009。
  改动范围：不新增功能文件。
  需求：全部。
  验证：
  `npx vitest run tests/m14b-fact-collection.test.mjs`；
  `npx vitest run core/__tests__/task-handle.test.mjs core/__tests__/workspace-manager.test.mjs tests/metrics-taskhandle-v2.test.mjs core/__tests__/check-skill-closure.test.mjs tests/m14a-audit-contract-layer.test.mjs`；
  `npm test`；`npm run check`。

## 依赖与并行

```text
T001 ──> T002 ──> T003 ──> T004 ──> T005 ──> T007 ──> T009 ──> T010
                   │        │        └────────> T008 ──────────┘
T003 ──> T006 ─────────────────────────────────> T009
```

- 可并行：T006 在 T003 后可与 T004 并行；T008 可在 T005 后与 T007 收尾并行。
- 关键路径：T001 → T002 → T003 → T004 → T005 → T007 → T009 → T010。
- build-code 分阶段建议：Stage 1、Stage 2、Stage 3、Stage 4；每阶段完成后跑对应目标测试，不增加人工 gate。

## 交付边界

本清单不授权修改接受规格、M14a schema、TaskHandle 身份模型、Workspace、canonical hash、metrics 存储，不授权新增生产真实 transcript source、目录扫描、全局索引、LLM 推断或完整 CLI fixture 库，也不授权 commit/push/merge/archive/cleanup。计划经人工确认后才可进入 build-code。
