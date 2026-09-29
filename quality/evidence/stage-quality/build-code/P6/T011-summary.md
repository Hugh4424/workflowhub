# P6/T011 外置 oracle 只读镜像实施事实

- 唯一交付：仓库外 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/oracle/card-04/ORACLE.json` 和 `README.md`。JSON 恰含 P6/T011 指定八键和取值；README 记 owner、外置原因、`WH_CARD04_ORACLE_DIR` 默认/覆盖路径及残余限制。仓库内 `quality/oracle/` 不存在。
- 权限：目录 `0555`，两文件 `0444`。`ls -ld` 原始输出、模式与文件 SHA-256 见 `T011-green.txt`、`T011-scope.txt`。
- 冻结测试：`tests/contract/oracle-mirror.test.mjs` SHA-256 `b7f6fb9944ae17fdbe8192cae6f1af7e871bdf6d4bffc2783d6e8045845c1a70`；未修改。
- 同一精确命令 `npx vitest run tests/contract/oracle-mirror.test.mjs`：实施前 exit 1，9 collected/6 failed/3 passed，6 项均为缺目录或文件的目标存在断言；实施后 exit 0，9 passed。原始输出见 `T011-red.txt` 和 `T011-green.txt`。
- `test-routing-advisor` 重判为 `simple`，只新增外置静态 JSON/README 与权限；见 `T011-route.json`。`backend-testing` 仅适用于真实后端代码改动，本任务未改代码，按 P6 原定文件系统 contract 测试覆盖目录、文件、权限、env 优先和仓库零副本。
- AC-24 范围：本次证明声明级与权限级外置镜像合同；同一 OS 用户仍可 `chmod` 后改写，未建立独立用户/容器的宿主隔离，已在外置 README 与现行 spec §12.3 原文保留。此 GREEN 不证明 T012 CLI E2E、真实业务验收或整个 P6 完成。
- 本次未改 decision-log/spec/runtime/tools/冻结测试，未 `git add`、commit 或派发 Phase review。
