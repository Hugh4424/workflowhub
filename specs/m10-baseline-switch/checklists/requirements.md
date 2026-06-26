# Design Checklist — M10 baseline-switch

- [x] A 档硬门五章齐全：ch3 用户场景、ch4 FR、ch9 不做、ch10 验收、ch11 影响范围
- [x] 用户场景 8 条：正常 3 + 失败 2 + 边界 3（含失败和边界）
- [x] FR 按功能域分组：FR-BASE / FR-MAP / FR-COLL / FR-FREEZE / FR-MIG / FR-CI
- [x] B 档条件章 ch5 模块划分含测试边界，ch2 背景、ch6 关键实体、ch8 兼容性已写；ch7 标"本期不涉及"
- [x] Spec-Purity 通过：无 TS 类型定义、无绝对路径、无 shell 命令
- [x] 每条 FR 含 Given/When/Then
- [x] 隐性必达写进 ch9
- [ ] design-review verdict = pass
