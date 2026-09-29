# P7 当前正式定向测试回执

- 计划命令：见 request.json；正式 public CLI 调用：见 cli.result.json。
- 当前 Task：workflowhub-thin-core-card-04-20260919；branch：task/workflowhub/workflowhub-thin-core-card-04-20260919；HEAD：ef920f1fbd415fe87d50930359059b661e141acd。
- 材料版本：revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044；snapshot_tree：a8ba4bcc213c29f78aec61e4f64139444d3b0d1b。
- Task facts：前后 2/2 行，SHA 不变。16 份材料及相关源/测试 SHA 清单见 identity-before-second.json 和 identity-after.json；前后相同。
- CLI exit=0；正式回执内部测试 exit=0；Test Files  4 passed (4)；      Tests  62 passed (62)。
- Canonical receipt：quality/tests/card04-P7-L0-current-6814433c-cadc-4bce-8c26-8cbe61974e58.json，SHA-256 a6bbaca8d5e40e683a5666b569041f7c5d3640ca4f8118953220f0fbde98105d；output：quality/tests/output/card04-P7-L0-current-6814433c-cadc-4bce-8c26-8cbe61974e58.output，SHA-256 d1e7b125ad89df559c651b1a8844fb3794e203c2b441a9662898c94da5cf8eb2；两者与 CLI 宣称的 hash 相同。
- 原始 CLI stdout/stderr、canonical receipt/output 副本、前后身份与哈希、子进程清理均在此目录。CLI stdout 为扩展响应，含 change_scope 和 ref/hash，并非 canonical receipt 的逐字副本；copy_matches=false 不表示 ref/hash 失配。
- 子进程残留匹配数：0。
- 边界：仅本相位当前定向合同通过，不等于整个 CARD04 的业务验收或阶段质量通过；未运行 P5、P11 或全量测试。
