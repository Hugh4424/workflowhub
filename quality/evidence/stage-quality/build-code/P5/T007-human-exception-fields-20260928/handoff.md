# P5/T007 人工例外字段修复（2026-09-28）

## 范围与结果

- 工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`。本次产品改动仅 `runtime/stage/stage-end-report.mjs`、`runtime/stage/stage-end-report.test.mjs`；改前原字节分别见本目录 `before-stage-end-report.mjs`、`before-stage-end-report.test.mjs`。`before.sha256`、`after.sha256` 包含两文件和当时 P5/spec 材料哈希。
- 人工例外必须有 `declared_by`、`reason`、`scope`、`expires_at_phase`、`owner`、`source_path` 六个非空文本；可选 `verbatim` 出现时也须非空，原样进入 facts 并在 Markdown 字面化渲染。到期阶段仅接受 `P<n>`、安全整数且 `n>=5`；当前任务索引中是否确实有该阶段留给 T008 认证。机器状态不能写入人工例外。转换入口与直接渲染入口均验证这些条件。
- `declared.exceptions` 缺失/空数组的原有 `not_done=missing` 和渲染拒绝保持原样。没有编造任何真实人工声明。当前 T008 writer 仍只传 `reason/source_path`，因此真实 P5 报告生产尚不能使用此局部 GREEN 声称完成。

## 可复核检查

- 精确命令 `npx vitest run runtime/stage/stage-end-report.test.mjs`。新测试对旧代码 RED：`red.exit.txt=1`，32 failed/23 passed；缺六字段、坏到期、原话丢失和直接渲染绕过均是目标断言失败。原始输出 `red.raw.txt`。
- 同命令修复后 GREEN：`green.exit.txt=0`，55/55 passed，原始输出 `green.raw.txt`。
- 相邻来源合同 `npx vitest run tests/contract/p5-same-run-report-source.test.mjs`：`adjacent.exit.txt=0`，12 passed/6 skipped，原始输出 `adjacent.raw.txt`。跳过的正例仍未获真实来源，不能算 P5 完成。
- `node --check` 两文件及 `git diff --check --` 执行退出 0；两产品文件当前为未追踪，`git diff --check` 不覆盖其字节，所以独立 review 应直接比较本目录 `before-*` 与现文件。Node 版本见 `node-version.txt`。

## 宪法核对与限制

- F1/F2/F8/F11：复用既有纯转换器与渲染器，不新增公共命令、持久对象或依赖。F3/F6：不写正式阶段事实或任务记录。F4/Q3：局部结果须由异源审查裁决，不能自判完成。F5/F9/Q1/Q2：负控先 RED 后 GREEN，缺真实来源、正式审查和 T008 产物仍如实未完。F7：未增日常确认，也未执行不可逆操作。F10：只有受影响的定向检查。S1–S8：本次没有新技能或技能接口。
- 未改 `stage-runner.mjs`、`freshness.mjs`、决策日志、spec、P5 材料、规则文档和报告三文件。零例外合同仍待单独决定。P5/T008 来源映射、索引认证、当前版本正式审查/阶段事实不由这组测试证明。
