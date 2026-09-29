# P9 当前消费与证据时点文字更正

- 只改 `specs/workflowhub-thin-core-card-04-20260919/phases/P9.md` 的当前状态文字。旧原字节另存 `P9-before-consumer-timing-correction-20260927.md`，SHA-256 `1def809b7751dac7e85e8ff4ba00b092f90ad0ff0e3b26cc975870e977d162af`；新 P9 SHA-256 `dcfd25eaab81f7e6adc8a01adbf37f81757010d14cb7b9299e7de39f396e488a`。旧 P9 原件、测试、registry、P8 catalog 和 P9 源码均未改。
- 当前调用点：`workflows/build-code/targeted-capture.mjs:9-10,81-87,132-136` 实际调用 T018 执行前来源及 T019 registry 读者；`workflows/build-code/capture.mjs:8-10,98-119,133-137` 的固定入口也调用两者。纠正旧文档「固定入口未实施/未消费」；调用存在不证明 CARD-04 当前正式 build-code 已运行或业务效果通过。
- 旧定向测试原件仍为 T018 12/12、T019 11/11；两模块与两测试当前 SHA 分别为 `da79f207228cf38abd92513c5bcc29b0bd14a54cfe3556a4d77f4ee7788adcf8`、`29d10bc7a49a3f71864781bc3f0f6b831357dcfc4c929ca29b2040ed82a2a1b2`、`e5ec0396366b1936784e2736265de74b9d4733cbe47dc6265920853d130d76af`、`9afc2b3bb98103f09b0e0f77053e130b6532b6c1d8131fb3dc502f0f27661d2e`，与旧绿色原件元数据相同。本次纯文字修订未重跑测试。
- `T019-real-three-targets-safe-run-20260927.exit.txt` 保留整脚本 exit 1；`T019-safe-three-content-reconciliation-20260927.json:3-17` 的 1,959 条路径相等只属于记录时点。当前 P1/P7 等材料已改，不能外推为当前全树相等；也没有运行 `npm test:safe`。
- 外置 Task `facts.jsonl` 当前只有 make-decision、build-plan 两行，没有 build-code 阶段行。P9 继续 `not_done`；旧失败脚本、隔离 Task 三目标 6/28/15 通过和后续内容对账分开记录，不相互覆盖。
- `git diff --check -- specs/workflowhub-thin-core-card-04-20260919/phases/P9.md` exit 0；P9.md 当前未跟踪，故该命令不能检查其新增字节。以旧备份对新文档执行 `git diff --no-index --check` 只因文件差异 exit 1，没有空白诊断；变更为 10 行替换，不包含代码或测试改动。
