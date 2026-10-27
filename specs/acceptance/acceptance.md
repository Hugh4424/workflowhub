# WorkflowHub 验收

版本/最后更新：2026-10-25。作用域：本项目当前任务。owner：当前task验收与专业质量owner；consumer：独立测试、OCR和build-code 终末执行者。

## 依据与职责

[标准工作方法](../../docs/standard-workflow.md#build-code-测试与质量)、[build-code 终末](../../workflows/build-code/SKILL.md#最后-phase终末承接)、当前task spec Appendix A为原判据。

本件是专业规则读法与最小适用边界，不替代原字段、业务需求、判据或执行记录。

## 专业规则与失败边界

每Phase按承接AC与真实输入首判，末Phase聚合沿途结论及必要未闭环case；只跑受影响定向测试，禁止无范围全量vitest/npm test/test:safe。原输出/回执/审查保唯一真实原件，经认证task.captureCommand/appendRecord保存。fixture/静态结构/真实服务分别说明，exit0不代语义或业务完成；unknown/unavailable/incomplete限制完成陈述，不阻安全修复。独立质量裁决不由实施者自签。

## 真实consumer与接缝

build-code各Phase作者交原件；独立测试及build-code 终末从当前spec/Phase、真实实现和原始质量记录逐面核对。

## 反例与核对

反例：复制接口/质量字段表并以本文存在宣称真实任务通过，或失败改成默认成功。独立reader从项目AGENTS到本入口、正文和具名原源，选一正常及无效输入核唯一owner/错误方向；执行结果只写任务原件，不写本文为pass。

## 缺口与维护

未读具体任务的权限、环境、并发和服务效果保持unknown，由对应任务/专业owner补真实原件；仅暂停依赖缺规则的判断，安全工作继续。修改本件先核适用原源/consumer，不从当前偶然实现推应然标准；原源变化同步必要导航，不清洗历史。
