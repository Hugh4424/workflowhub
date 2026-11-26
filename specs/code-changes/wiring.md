# 代码改动域 · 接线

定位：本组只回答「新入口凭什么能建、登记在哪、什么时候删」。读者：加技能、改调用方、改发布闭包的人。
边界：八类规范职责归 skills/project-norm-init/SKILL.md；运行时命令归 runtime/interface owner；本文件不新增控制面。

## 规则

1. 新技能或新工作流先有具名 consumer 才能建；只写「以后可能用」的入口不建（强制：审查问句；锚：[当前治理边界](../../AGENTS.md#当前治理边界)）
2. 三处登记缺一不算接线：`workflows/<stage>/skill-deps.yaml`、`docs/architecture/move-map.json`、`skills/<技能>/skill-bundle.json` 的 `files`（强制：结构＋审查问句；锚：[同仓方法依赖](../../skills/project-norm-init/SKILL.md#同仓方法依赖)）
3. 每个新增入口同批写删除条件与替代关系；没有删除条件的登记不算登记（强制：审查问句；锚：[vNext 永久实施边界](../../AGENTS.md#vnext-永久实施边界)）
4. 顺序是先登记再改调用方；import 与治理文档同批改，不先跑起来再补登记（强制：审查问句；锚：[当前目录职责](../../AGENTS.md#当前目录职责)）
5. 不借迁移重写行为；搬路径与改行为分两批（强制：审查问句；锚：[当前目录职责](../../AGENTS.md#当前目录职责)）

## 边界与不承接

登记表本身的 schema 归 move-map 与各 skill-deps.yaml 的维护者；本文件不定义新字段。
