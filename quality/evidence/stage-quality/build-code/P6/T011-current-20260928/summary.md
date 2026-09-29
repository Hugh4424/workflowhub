# P6/T011 当前核对（2026-09-28）

- 身份：`task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`；测试、P6 材料及镜像原字节 SHA-256、路径、权限见 `snapshot.json`。
- 原镜像在仓库外的当前 Task 事实目录。真实路径不是符号链接；目录 mode `0555`，`ORACLE.json` 和 `README.md` 均为 `0444`；仓库内 `quality/oracle/` 不存在，`git ls-files` 无 oracle 副本。镜像 JSON 的 `card` 等于当前 Task ID，README 记 owner、默认/环境变量覆盖方式及同一 OS 用户可改权限的限制。
- 精确门：`npx vitest run tests/contract/oracle-mirror.test.mjs` exit `0`，9/9 通过，原始 stdout/stderr 见 `gate.*.txt`。临时目录缺镜像时同命令 exit `1`（6 项失败）；临时镜像机器状态写错时 exit `1`（1 项失败）。负控只改临时副本，原镜像未动；原始输出分别见 `negative-absent.*.txt` 和 `negative-value.*.txt`。
- 取证脚本首次准备错值临时副本时沿用源文件 `0444`，写入临时副本被拒，尚未运行该负控；随后仅调整临时副本创建方法并重新采集上述三组完整结果。原镜像权限和内容均未改。
- 范围差异：现行 `P6.md` T011 写 JSON“恰含”8 个指定键，原镜像另有 `schema_version`，共 9 键。已有 `T011-after-schema-alignment.txt` 记录此字段为后续 T012 E2E 消费补入；现行 E2E 在 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 明确要求非空 `schema_version`。冻结 T011 测试只查指定键值，不查键数。此处需要 build-plan owner 澄清“恰含”是否允许版本键；未擅改受保护镜像或材料。
- 权限边界：外置位置与 `0444`/`0555` 证明声明写集和普通写入权限边界；同一 OS 用户仍能读取，也可通过 `chmod` 改权限，本检查不证明独立用户或容器隔离、实现者无法读、T012 全链通过、P6 完成或独立质量通过。
- 本轮未修改生产代码、冻结测试、外部 oracle、材料或旧证据。独立审查尚待主线程安排。
