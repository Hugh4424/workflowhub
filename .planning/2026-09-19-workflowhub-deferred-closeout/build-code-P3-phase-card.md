# Build-code Phase P3 Card — workflowhub 严格判定收敛

## Goal

完成 T015–T030：删除无消费者死常量；把未锚定 finding、未知材料键、未知 severity、stage-analyze skip 都变成显式事实；让确认读侧、health map、bounds 与既有宽松语义对称；保留真正禁止键、结构化路径和七条红线。

## Allowed files / symbols

- `skills/wh-review/scripts/review-materials.mjs`：死常量和 near-miss allowlist 分支。
- `skills/wh-review/scripts/simple-review-runner.mjs`：finding anchor 丢弃事实。
- `skills/wh-review/scripts/review-provider-client.mjs`：managed health present-member validation。
- `skills/wh-review/scripts/review-input-bounds.mjs`：skill-only guard。
- `runtime/stage/stage-content-contracts.mjs`：spec-analyze skip ledger。
- `runtime/review/review-output.mjs`：unknown severity drop facts。
- `runtime/stage/stage-runner.mjs` / `runtime/task/git-worktree-snapshot.mjs`：读侧仅核实现有谓词复用，不扩大边界。
- Corresponding targeted tests, `skills/wh-review/skill-bundle.json`, `skills/catalog.yaml` hash closure.

## AC / scope

- `AC-STRICT-003/005/006/010/011/012`, `AC-BOUNDARY-001/002`, `AC-CANDIDATE-003/004/006`。
- T021/T022 是 pre-existing-green：当前认证 worktree 已同时复用 `isExecutionRecordOnlyMaterialDelta` 与 `isStageMaterialOnlySnapshotDelta`，不 destructive rollback。
- 非目标：runtime bounds throw、`hasMarkdownHeadings` 判别、七条红线、provider retry/cancel、skill second dispatch path。

## Test route

- 实际 route：`feature`（WH parser/material/stage fact contracts）；具体 testing skill：`backend-testing`，因为无 UI、无服务、无数据库，行为由 Vitest contracts 直接观察。
- RED/GREEN gates：
  - `review-materials-contract.test.mjs` 46/46；
  - `simple-review-runner.test.mjs` 97/97；
  - `review-managed-lifecycle.test.mjs` 30/30；
  - `review-input-bounds-portability.test.mjs` 2/2；
  - focused skip test 1/1；
  - `review-layering.test.mjs` 15/15；
  - confirmation reuse contract 7/7。
- P3 review：只发起一次 public `review --action=record`; provider health incompatibility stays `unavailable` if unchanged.

## Stop conditions

- 需要改变 `hasMarkdownHeadings`、runtime bounds failure、七条红线、材料身份严格比较，或新增第二事实账/公共入口。
- Bundle hash closure 未同步时不把 portability gate 当作实现失败；先修闭包事实并重跑同一 gate。

## Expected handoff

回填 T015–T030、保存 bundle/catalog hash closure 事实、记录一次 phase review，再进入 P4 cancel 接线。
