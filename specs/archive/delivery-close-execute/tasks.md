# Delivery Close Execute 任务清单

- [ ] T001 把 delivery close fixture 改成多文件 spec 目录。
- [ ] T002 写 prepare preflight、plan baseline、既存 archive 拒绝和同事实 plan-hash 确定性红测。
- [ ] T003 写 core 与 CLI 两层 rejected/timeout 零写入、confirmed 六步红测；CLI 断言到 T011 才转 GREEN。
- [ ] T004 写目录篡改、遗漏、夹带文件红测。
- [ ] T005 写六步 reconcile 与两种微中断红测。
- [ ] T006 写 conflict、remote 前进、push 失败、dirty target 红测；每种失败后 `status` 必须显示已完成与剩余事实。
- [ ] T007 实现 delivery plan baseline 与固定策略校验。
- [ ] T008 实现完整目录 archive 物理校验。
- [ ] T009 实现六个固定 delivery executors，复用现有执行锁和记录。
- [ ] T010 在 generic completion 前执行 delivery ready 核验。
- [ ] T011 给 CLI 增加唯一 `execute` 命令。
- [ ] T012 更新 verify-code Skill，删除手工 Git 六步。
- [ ] T013 跑 close、generic executor 与完整测试。
- [ ] T014 检查生产代码净增不超过 350 行、新依赖为 0、allowed files 无越界。
