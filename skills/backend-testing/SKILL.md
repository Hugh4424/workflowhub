---
name: backend-testing
description: 在 build-code 看到真实后端改动后执行风险导向测试；build-plan 只记录预判的 skill，不调用本技能。
---

# Backend Testing

build-code按真实changed files确认backend/feature后，覆盖业务/校验/错误/权限、持久化/迁移、并发/幂等，执行下两节。build-plan不调用、不依赖testing-system-blueprint。

## 行为测试与证伪

公开入口给具体输入，以独立业务事实断言字面结果/效果后实现。真实接口、序列化与数据边界优先；替身按真实 > Fake > Stub > Mock选，并说明更真实选项为何不可用。Fake守真实契约，Stub固定边界响应，Mock只观察声明交互，不代关键seam。

一行为测试→目标断言RED→最小实现→同命令GREEN，再加正常/失败/取消切片。命令来自当前Phase gate_cmd或该路径既有具名测试，保来源/测试名/oracle。收集、导入、服务或环境失败不算目标RED。无代码/实用测试路径时写failing-before不可得原因，执行最近既有检查并列漏掉的seam；邻近检查也不可跑则写缺输入、owner及unavailable。纯方法独立读者消费完整正反输入；结构只证兼容，offline CLI不证在线search。

三反模式逐case判，勿按matcher形状批改：
- **Implementation-coupled**：只验内部helper次数/顺序、等价重构就红；改验公开结果，等价重构应不变。次数本身是AC外部行为（如每provider单次派发）则保留。
- **Tautological**：被测函数算预期、同式重算（如`expect(add(a,b)).toBe(a+b)`）、手抄实现快照/常量自等；改用独立事实2和3应得5。返回undefined/错值须击中；合法缺省有契约理由，absence配证明入口到达的presence。
- **Horizontal slicing**：先铺多项未有行为的测试再批量实现；改为同一输入→公开调用→独立结果→实现闭环后下一切片。

读完整case，保具体输入/独立预期/替身/反事实；确认真弱后按当前Phase独立TCR改，合法缺省保理由，未判定记unknown。缺RED不免冻结断言保护，不按错误实现改预期。

## 执行事实

设计列changed files/FR/AC/场景/oracle/具名命令/expected exit、fixture/service状态、实际代码/材料来源、evidence路径与coverage limits；适用截图附路径。执行者在task facts补实际exit、stdout/stderr hash/原ref、结果/不适用及跳过原因；分列目标RED、恢复GREEN、邻近检查与未覆盖。失败/缺环境/服务不可用保原事实，独立方法或模拟不冒真实服务通过。

post据当前spec/物理Phase Task/预判/facts定位，只记本Phase声明改动与命令实际来源，不建跨Phase snapshot；pre/history tasks/snapshot只读，不重绑。仅跑受影响具名集合；无新改动、失败或疑点就引用已有原件，不重跑/复制无关全量回归。证据不是推进gate，缺失保unknown/incomplete。

## 写作规范

创建/编辑方法读`skills/spec-specify/SKILL.md`的WR001唯一规范，不复制。

来源权威[catalog](../catalog.yaml#skills.backend-testing)；正文/小卡非权威，缺登记找维护者。AgentHub路径/采用及许可适用性unknown见登记。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`；按条件读，搬运带可读原件。
