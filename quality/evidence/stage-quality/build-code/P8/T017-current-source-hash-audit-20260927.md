# P8/T017 catalog `.3` 当前来源字节审计 — 2026-09-27

范围：认证 CARD-04 worktree 中 `docs/quality/business-case-catalog.json` 的三个 active seed。只读解析目录，按声明的相对路径读取当前真实文件字节并计算 SHA-256，同时核目标测试文件存在与登记 ID 数；未运行测试、runner、业务 oracle 或官方 capture。当前 HEAD `ef920f1fbd415fe87d50930359059b661e141acd` 不代表 dirty worktree 字节，本表以实际读取文件的 SHA 为准。

目录 `revision=2026-09-26.card04-seed.3`；当前目录字节 SHA-256：`d0d601a77cc2ed7d96a75f646aa8fbacebb922c97f8a3ba9c5130af670021dfa`，与此前 `T017-source-fix-evidence.md` 记录一致。

| Case | `source.path` 与声明 `source.revision` | 当前实算 source SHA-256 | `rule.revision` 与当前规则文件实算 SHA-256 | `execution.target` / 登记 ID | 结果 |
| --- | --- | --- | --- | --- | --- |
| `CARD04-DECISION-LOG-CENSUS` | `specs/workflowhub-thin-core-card-04-20260919/decision-log.md`；`sha256:e7ddb0f1398ee675b4a8c0411283fe24b39b43736d6916e1da32bb5984a45268` | `e7ddb0f1398ee675b4a8c0411283fe24b39b43736d6916e1da32bb5984a45268` | 声明 `sha256:d71f9fb11891e5c28c9a1951e886bd035d63e317940e50afc3b5da8b71b59b35`；当前 `specs/workflowhub-thin-core-card-04-20260919/phases/P6.md` 实算 `d71f9fb11891e5c28c9a1951e886bd035d63e317940e50afc3b5da8b71b59b35` | `tests/contract/decision-log-census.test.mjs` 存在；6 IDs | source 匹配；推定规则文件匹配；无缺文件 |
| `CARD04-ACCEPTANCE-MACHINE-CLASSES` | `specs/workflowhub-thin-core-card-04-20260919/phases/P7.md`；`sha256:f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa` | `f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa` | 声明 `sha256:f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa`；同一 P7 文件实算相同 | `tests/contract/acceptance-result-machine-classes.test.mjs` 存在；28 IDs | source/rule 匹配；无缺文件 |
| `CARD04-DEFERRED-ACCEPTANCE-REGRESSION` | `specs/workflowhub-thin-core-card-04-20260919/phases/P7.md`；`sha256:f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa` | `f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa` | 声明 `sha256:f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa`；同一 P7 文件实算相同 | `tests/deferred-acceptance-semantics.test.mjs` 存在；15 IDs | source/rule 匹配；无缺文件 |

**绑定边界：**第一条 catalog 的 `rule` 对象没有独立 `path` 字段；`P6.md` 是按 `rule.id=...FR-26`、`phase_ids=[P6]` 与 `change_triggers` 推定的规则文件。该 SHA 确与其当前字节相等，但目录本身不能仅靠 `rule.revision` 机器确定唯一规则路径。另两条规则 revision 与其显式 `source.path` 相同。三个 target 存在不等于 49 个登记 leaf 仍与当前 reporter 完整身份一致。

本审计未发现当前哈希漂移，因此不需要修改 P8 目录的 revision 值。冻结 P8 两项 contract 测试不自动从 `source.path` 读取当前字节并重算 source/rule revision；其 GREEN 不能替代此有限字节核对。本表也不认证目录 owner、独立业务效果 oracle、Task/P9 库存、P10 runner 实跑或 AC-29/30 完成。
