# P11 相邻合同两处窄修（2026-09-27）

- 身份：CARD-04 工作树分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`、HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。`before.json`、`after.json` 逐文件记源和受影响测试 SHA-256；四份测试字节不变。旧两份源文件完整备份为 `*.before`，补丁为 `*.patch`；旧 Node 20/22、exit 1 的原始输出/退出码从先前 P11 证据逐字复制为 `old-node-test.*`，副本哈希对账成功。
- 技能只在现有 UI 执行边界段补两行真实规则：同一 build-code 阶段，不新增 stage；UI 质量事实不阻止同任务继续修复。无新流程节点或控制面。解析器只将 AC 标题后紧邻的结构化 `status/状态/...` 前缀识别为延期；普通正文 `preserves status: deferred...` 不再使该 AC 消失。改动范围见两份补丁。
- 同一 `node --test tests/contract/ui-stage-integration.test.mjs`：**22/22 通过、exit 0**（旧原件 20/22、exit 1）；原始结果见 `green-node.*`。该文件原有七条显式元数据正控及表格正控均在此次 22 项中，未改测试。生产 JS `node --check` exit 0，两个文件 `git diff --check` exit 0。
- 相邻 `npx vitest run tests/contract/post-phase-contract.test.mjs tests/deferred-acceptance-semantics.test.mjs`：**30/31 通过、exit 1**。延期语义文件 15/15 通过；唯一失败是另一文件的 CARD-05 D-044 用例读取本 CARD-04 工作树中不存在的 `specs/workflowhub-thin-core-card-05-20260919/phases/P5.md`，原始 ENOENT 保存在 `adjacent.*`，未冒称全绿，也未修改跨卡文件。受本次解析器影响的独立用例 `npx vitest run tests/contract/post-phase-contract.test.mjs -t "keeps an explicitly deferred AC visible in history but outside current formal coverage"` 为 1 通过、15 跳过、exit 0，见 `adjacent-deferred.*`。
- 本轮没有改 `decision-log.md`、P8/P9/P10、Task facts 或任何测试。上述通过是本地定向合同，不是 P11 真实页面、正式 Phase 回执或全卡完成；两处修复及相邻缺文件边界待独立复核。
