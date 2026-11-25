---
name: backend-testing
description: 在 build-code 看到真实后端改动后执行风险导向测试；build-plan 只记录预判的 skill，不调用本技能。
---

# Backend Testing

build-code按真实changed files确认backend/feature后，覆盖业务/校验/错误/权限、持久化/迁移、并发/幂等，执行下两节。build-plan不直接执行本技能；经testing-system-blueprint读取下两节用于设计，不提前执行测试或新增gate。

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

## 自动作业与对外传输

本次改动新增或改变了自动触发（没有人工逐步调用也会跑）或对外发送（字节离开本进程、本机或本仓：子进程出网、远端仓库、外部服务）的入口时，加写这一节。本节「对外发送」与「本进程/本机/本仓」只用一种定义：字节离开本进程、本机或本仓，指子进程出网、远端仓库或外部服务；本地不回网的子进程不算。

不适用要写三件，缺一件不算：① 判据——「会不会无人逐步调用就触发」「会不会让字节离开本进程/本机/本仓」两问各答一次，都为否才成立；② 改了什么——本次真实 diff 的路径范围；③ 谁读回——哪一方据哪份原件确认「不跨边界」。只写「不适用」「纯内部改动」不算。边界定义同本节首段。

四段按真实边界写，触发是前提不是段：**分诊**（谁判断这次输入该不该处理、归哪条路）、**实际处理**（约定的处理真的做完并留下持久副作用）、**发布**（结果真的交给外部系统）、**原使用方读回**（本该收到结果的那一方独立读回它收到的最终状态）。逐段写「证到／未证到」与原因，写明证到第几段。

段位写死，不留「只证触发」的缝：只写「函数被调用了」「路由选对了」「exit 0」不算任何一段。只证到第 1 段（分诊）仅在改动确实没有跨出本进程、本机、本仓，且没有持久副作用时才成立；跨了边界就必须有实际处理、发布、原使用方读回的段位证据，缺哪段就写 `unknown` 或 `incomplete`，不写「证到第 1 段」当通过。四段是上限不是下限，指不要求四段全证，不指可以只证触发。边界定义同本节首段。

每段写清谁写的、写在哪、谁读的。发送侧执行回执（argv/cwd/exit/signal/output_ref，`runtime/interface/run-command.mjs`）只证「请求交出去了」，属发布段的发送侧记录。判是不是同一份：同文件、同 producer、同一次 argv 三条都成立即同一份；同一份不能同时充当发布与读回，读回至少要换掉 producer（换到接收侧或已批准的隔离边界）。手边只有一份时，读回段写 `unknown`，不写「已读回」。

写完证据逐条答三问，答法本身就是验收对象：**一，证到第几段**——分诊、实际处理、发布、原使用方读回逐段写证到／未证到与原因；**二，拒了什么**——被拒输入的准确身份、拒绝发生在哪一段之前、由谁的哪份记录证明；**三，接收侧有没有收到**——由接收侧或已批准的隔离边界写，写清哪份原件、哪一行。答「函数被调用了」「最终修订没变所以没发」「发送侧拦住了所以没发」都不通过；「接收侧没记录」只能写 `unknown`，不能写「没发」。

拒绝也要在接收侧落地：无权或坏输入在对外传输前被拒绝时，由独立受控接收方或已批准的隔离边界记录「有没有收到请求」。发送侧自记（`blocked_before_dispatch`、`calls=0`、授权 consume 报错）只说明发送侧没继续，不能证明接收侧没收到；「最终修订没变」「末字节相同」是内容比较，不能推断「从未发请求」。

自动入口有正常启动方法与备用装配两条时，同一坏输入两条都实跑，比「新增修订的条数与身份」，不比内容：两条各自零新增才算拒绝成立，任一条新增一条即未成立，写出身份与条数。

两条真实边界分开判，不合成一条。

**OCR 派发**：接收侧是 provider 进程，出网与发出去的字节不可控，本仓现在只有发送侧记录（`blocked_before_dispatch`、calls=0），接收侧读到什么没有独立原件，读回写 `incomplete`；补齐要一个独立受控接收方或已批准隔离边界，不能由发送侧自记补。

**授权 push**：`git-authorize` 自己从不发送，只做 record/consume，`git push` 仍由调用方经 `run-command` 执行；读回用 `git ls-remote --heads` 读远端 OID（只需读远端状态，不需要推送授权）与 `gh pr view` 的 repo/head/base/OID 绑定。读回手段可用不等于已经推送：没有推送授权就写 `unavailable`，不写 `incomplete` 冒充已尝试。

读回复用仓内既有读法，不新造回执机制：远端分支用 `git ls-remote --heads`、PR 用 `gh pr view` 并核 repo/head/base/OID（`skills/stage-close/SKILL.md` 第 1、4、7 节）、派发后由执行体侧读到的字节（`tests/contract/ocr-delegation-route.test.mjs`，**仅方法示例**；隔离边界下没有接收侧，不得当作已读回）。

没有接收侧记录、或只跑到触发与发送时，用现有 `unknown`／`incomplete` 并写原因与恢复条件；不新增枚举、不加执行清单字段、不设门。本次真实发送、真实 push、真实后台作业没有演示时按事实记 `incomplete`，不冒充已交付。边界条款优先：没有授权时记 `unavailable`，有授权但未演示才记 `incomplete`。

## 写作规范

创建/编辑方法读`skills/spec-specify/SKILL.md`的WR001唯一规范，不复制。

来源权威[catalog](../catalog.yaml#skills.backend-testing)；正文/小卡非权威，缺登记找维护者。AgentHub路径/采用及许可适用性unknown见登记。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`；按条件读，搬运带可读原件。
