# P6/T011 当前镜像独立复核（2026-09-28）

## 核对范围与身份

- 只读复核当前 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，branch `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。未改 oracle、冻结测试、计划材料、Task facts；本文件仅保存独立结论。
- 对照 `quality/evidence/stage-quality/build-code/P6/T011-current-20260928/summary.md`、`snapshot.json` 与六份原始 stdout/stderr；逐份重算 SHA-256，均等于 `snapshot.json` 记录。当前原镜像、README、冻结测试和 P6 材料的 SHA-256 也均与该快照相同。

## 成立的窄事实

- 原镜像位于当前 Task 事实目录的仓库外绝对路径，`realpath` 与声明路径一致；目录 mode `0555`，`ORACLE.json` 与 `README.md` 均为 `0444`。本仓库 `quality/oracle/` 目录不存在，`git ls-files` 无 `ORACLE.json` 或 `quality/oracle/` 路径。镜像 `card` 与当前 Task ID 相符；README 标出 owner、默认路径、`WH_CARD04_ORACLE_DIR` 覆盖及同一 OS 用户可改权限的残余限制。
- 精确测试命令 `npx vitest run tests/contract/oracle-mirror.test.mjs` 的保存原始结果为 exit `0`、9/9 通过；缺镜像目录的临时 env 覆盖结果为 exit `1`、6 项失败；仅在临时镜像把 `machine_not_done_states` 改成 `['missing']` 的结果为 exit `1`、1 项失败。负控失败点是目标断言，不是测试收集/导入错误；没有证据显示原镜像被负控修改。原始输出与快照相互对应。
- 冻结 T011 测试检查所列 8 个字段的部分值、权限及仓库副本；它**不检查顶层键数**，也不检查 `schema_version`。当前 E2E 的 P0-b 用例在 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs:277` 明确要求非空 `schema_version`。旧镜像原字节在 `T011-oracle-before-e2e-alignment.json`，`T011-after-schema-alignment.txt` 记录只新增 `schema_version: "1.0.0"`，其他字段不变；当前镜像确有 9 个顶层键。

## 阻塞与最小修订

**材料冲突是真实的。**当前 `phases/P6.md` T011 Action 写 `ORACLE.json` “必须恰含这些键与取值”，随后只列 8 键；实际镜像还含 `schema_version` 第 9 键，且 T012 E2E 需要它。不能用 9/9 的 T011 测试绿声称满足“恰含 8 键”，也不应删第 9 键来满足旧文字，否则 E2E 立即红。

建议 build-plan owner 只把 T011 Action 的相关句子修成：`ORACLE.json 必须恰含以下九个顶层键：schema_version = "1.0.0"，以及 schema、card、stages、missing_material_error_pattern、report_facts_required_sections、machine_not_done_states、spec_analyze_subject、forbidden_states（后八键的取值要求保持原文）。` 同处或紧邻证据栏说明：T011 冻结测试只检查其中八键及文件边界；第九键由 T012 E2E P0-b 的非空断言消费，当前实值 `1.0.0` 另由本次原字节核对。将原材料中“未来 GREEN、当前不报告 GREEN”更新为本次**局部测试已绿**的时点事实，仍不得写成正式 P6 完成。此为计划文字与时点事实的窄修；无需改受保护 oracle 或冻结测试。若 owner 不接受九键合同，则必须先解决 T012 消费要求和镜像形态，T011 不能判 Done。

## 边界

`0444`/`0555` 是文件系统权限位与声明写集边界，不阻止同一 OS 用户读取、`chmod` 后改写，也不证明不同用户/容器隔离。9/9 与两个负控仅支撑 T011 当前镜像的窄文件合同；不证明 T012 全链、真实业务效果、正式阶段质量事实或 P6 完成。T011 的正式完成判断须待材料矛盾澄清，并按当前快照重新核对。
