# 新项目执行侧车 `.gitignore` 模板

只在创建新项目或新任务时按实际目录结构选用；本模板不会修改任何存量仓库。执行产物先发布到 WorkflowHub 任务存储的 `quality/evidence/`，不要提交到交付分支。

```gitignore
# WorkflowHub execution sidecars — not delivery source
quality/
qa-artifacts/
evidence/
# Replace <task-id> with a task directory that is used only as execution state.
tasks/<task-id>/
```

不要把 `specs/<task>/`、产品源代码或测试源码加入此模板。`tasks/<task-id>/` 只适用于被项目明确用作该任务执行侧车骨架的目录；若项目的 `tasks/` 是产品源码或文档，省略该行。

登记：owner=项目维护者；consumer=close 的执行侧车结构检查；替代=把执行产物提交到交付分支；删除条件=项目移除该侧车目录且 close consumer 不再读取此约定。
