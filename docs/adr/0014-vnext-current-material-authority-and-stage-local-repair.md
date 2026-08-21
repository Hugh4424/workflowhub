# vNext 使用根目录四材料并在当前阶段修复质量问题

vNext 任务把认证 worktree 根目录的 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 作为唯一当前材料；宿主 transcript、旧 task、旧 hash 和 immutable quality facts 只提供来源或证据，不是并列材料。stage-end 检查发现缺口时，同一 task 继续在当前 stage 修材料、补事实并重跑受影响检查，不创建 blocked、reopen、recovery 或第二状态机；只有 current material revision 上的适用问题处理完毕，才能派生 stage completion。

这项决定取代 ADR 0009 中 `specs/<task>/decision-log.md` 是当前 locator、根目录文件永不消费的 vNext 适用结论；ADR 0009 仍原样保留为历史。选择这一边界是为了匹配当前 runtime、避免双读 compatibility bridge，并保持“质量事实不阻止工作，但缺失质量不能冒充完成”的宪法要求。
