# 丁队立场书：影响评估 + 搅局（方向卡 v4）

**① II-1 波及面（实测）**：模板 `**验证方法**：`（spec-template.md L164）vs 校验器 L2953/2958 只认 plain `验证：`——错位实核。消费者：build-spec SKILL/steps step4、spec-analyze、20 个 contract 测试；归档 6 份 spec.md 共 104 个 bold AC（WH 28 个=历史"脚本绕过"重灾）。存量只读不迁，但本任务 spec.md 是首个新消费者——改错即自卡。

**② II-2 reality**：convergence verify 0 provider；细节审查 6/10、grok/pi IDENTITY_INVALID（F-030）；make-decision 12/16=75%、build-plan 2/5、3/5。40-75% 成功率下"必须≥1 异源事实"≈半数 verify unavailable（且依赖 build-code 链）。守卫卡步骤→新 gate 嫌疑；放行 unavailable→空转，破自查目标落空。两难。

**③ II-3 实测**：read offset 可用（829 行，offset 800 ✓）。反直觉：行号读依赖宿主能力未验；行号漂移→索引静默失效；内嵌导航节永久增重（66 章节头≈+15-25 行/材料）；II-3b 子代理化令子代理上下文（Q2 认定成本项）反升，无 token 度量→"成本下降"不可证伪。

**④ 矩阵**：I 收口触流程/runtime/工具/测试 5 处；II-1 触模板+校验器+20 测试；II-1c 触 verify step1 明文；II-2 触 verify steps 2-3 文件；II-3 触 build-plan/spec 2-4 文件。I+II 叠加同批文件：模板一次承载"9 字段合同+四段式+负例"=组E"扩 2 倍"落地形态，fail 无法归因。

**⑤ 搅局**：II-2 把组C 未决争议（"必须"=gate?）延期为"守卫形态 build-spec 定、构建期验证"——执行者自审自定宪法边界；定为步骤条件=新 gate（违自认非目标），已成代码才暴露。成功标准"≥1 事实（不可用如实记录）"自相矛盾：unavailable 达标→空转；不达标→本任务自己判败。两向皆坏，无裁决触及。

**致命缺陷自述**：未跑校验器用例、未点清 I 测试全量，矩阵为下界。
