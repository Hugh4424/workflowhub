# P11/T022 第一步：post 页面场景表示（2026-09-27）

- 范围：只改 `tests/contract/post-business-browser-reconciliation.test.mjs` 与 `runtime/stage/stage-content-contracts.mjs#projectPostPhaseAcceptanceExecutionData`。未改实际浏览器执行或适用性判断；P11 仍 not_done，真实页面/服务未证。
- 修订前测试 SHA-256：`5d77ba7f2d969a045a7e8667e54201603c02e93f183d88962226630f1ba82110`（保留先前修订目标的字节身份；历史旧夹具和两个旧 RED 文件均未改）。新测试在生产修复前 SHA-256：`e80dddce1095838c7d9f698d1c53c67e49415b023518fa10cf4940e08910a194`；原生产源 SHA-256：`365dbf165c4a04c6b72e28d4605839c6f0d552c0b9077d8a6e55d77ce81f7682`。
- 新 RED：`npx vitest run tests/contract/post-business-browser-reconciliation.test.mjs`，exit `1`，5 collected、1 pass、4 fail；四个目标分别为显式 UI browser、遗漏/矛盾 UI 标记、非法 browser execution，都是目标断言失败。原始 stdout/stderr 及 SHA 在 `red.*`。
- 源修复：只在 post 投影允许 browser；browser 必须有显式 `ui_scope=ui`，否则不可 eligible；保留非法 browser `execution` 的原有校验，合法 browser 投影不输出 execution。service 旧行为保留。
- 同一目标 GREEN：`npx vitest run tests/contract/post-business-browser-reconciliation.test.mjs`，exit `0`，5/5 passed；最终测试 SHA-256 `e80dddce1095838c7d9f698d1c53c67e49415b023518fa10cf4940e08910a194`，源 SHA-256 `8e74dcaa19343545c762264ef34124ef8b424d6202628f7d0f2d7778217029cf`。原始 stdout/stderr 及 SHA 在 `green-target.*`。
- 相邻合同完整运行：`npx vitest run tests/contract/post-phase-contract.test.mjs`，exit `1`，15 passed、1 failed；唯一失败为当前 worktree 缺 `specs/workflowhub-thin-core-card-05-20260919/phases/P5.md`，与本次源修改无关，原始输出在 `adjacent-post-phase.*`。只排除该确切用例后的命令 `npx vitest run tests/contract/post-phase-contract.test.mjs -t ^(?!.*keeps CARD-05 D-044 acceptance incomplete)`，exit `0`，15 passed、1 skipped；这是受影响子集通过，不能称完整文件通过。
- `node --check` 目标测试与源文件均 exit 0，原始输出和哈希见 `syntax-test.*`、`syntax-source.*`。未运行全量测试、服务或浏览器；第二步后台→真实页面消费者仍未实现。
