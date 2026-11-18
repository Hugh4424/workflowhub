# 现有任务页怎样继续使用？

当前沿用已有任务页，内容适配后继续使用，不生成原创原型。
本判断记录来源和去向，不替用户批准完整计划或视觉效果。

## 旧页和真实来源是什么？

来源是仓库已有overview-template.html及其真实builder/renderer。
它属于“沿用现有页面”，不属于传统design/prototypes稿或测试sample稿。
历史九页只作内容故障样本，不当当前批准；原页面保持只读。
当前源相对同一HTML/模板的current由060另件给出；021本体freshness仍unknown，旧件不覆写。
源HTML重新生成或模板/结构变化需重提炼；不把冻结页当最新材料的正确页面。
当前模板hash为d4778c23838b8d408ffe543b2f30918085a8283bbb644bc9363f29dbd41c3458，读取于2026-11-18。
当前正式提炼原件为任务库quality/evidence/2026-11-17-021-design-source-extraction.json。
两视口真实截图为019 desktop与020 narrow，独立测试者和本作者均实际查看。
053正式采集与060当前校验exit0，仅证明冻结旧页指定状态可读，不证原内容错误已修。
模板hash保持不变，派生HTML绑定180d2eef7ba365b885fbf3ffcd6c074fa11f442b331ce23c3c0e96eb26bb6ef8。
声明值unknown及norm_state待议不冒设计意图；旧源角色工具错误和未获当前确认仍保留。

## 页面、数据、功能怎样接上？

页面链保留header、side-nav、main和来源区，目标是当前任务生成页。
数据链从当前材料、事实及真实报告进入builder，再由renderer显示。
功能链保原导航/展开/来源解释，生成成功和真实打开分开判断。
内容不一致回原producer修，不在renderer伪造阶段或环判断。

## 哪些内容适配，谁负责？

页面作者只修真实需求映射、阶段、测试、写集、缺源与过期提示。
已有视觉和导航关系继续复用；用户接受偏差须当前真实答复。
P10承接首次真实提问和四路选择，P11仅修现页内容并由独立执行者验UI；不改解析工具。
没有迁移到新业务页面、没有真实账号或用户数据写入。

## 当前工具能认证什么？

check-judgment当前只支持real_design_source与sample_design_source。
本件如实给existing_page，旧checker会ROLE_CONFLICT而不允许施工。
这是当时把现页内容修复误套进外稿移植工具的真实尝试；原错误不改绿，不能据此要求扩展工具。
当前适用性沿readiness的原位等价实质源与extraction的移植条件；本task/P11不作外稿移植，因此不调用该移植判断器。
一般外来稿移植前置保留；最终确认仍须绑定本task/P11实际模板/渲染和内容范围，源或范围变化重新判断，不建共享例外gate。
不复制模板到设计目录，不改当前工具求绿；原错误留任务capture。
完整计划和当前展示仍待用户真实答复，后续按现机制保存原话。

## 编号怎样对照？

本件只有一个判断对象，不新增需求或验收编号。
| 中文名 | 机器对象 | 来源 |
| --- | --- | --- |
| 现页复用判断 | existing_page / adapt | 原决定10/11 |

## 机器字段（校验器用，人可跳过）

```json
{
  "schema_version": "1.0.0",
  "design_source": {
    "role": "existing_page",
    "ref": "skills/answer-as-page/templates/overview-template.html",
    "availability": "present",
    "version": "d4778c23838b8d408ffe543b2f30918085a8283bbb644bc9363f29dbd41c3458",
    "scope": "当前任务驾驶舱既有结构；仅内容/来源/过期适配"
  },
  "chains": {
    "page": "overview-template.html header/side/main → 当前任务overview.html；保持原导航与信息层级",
    "data": "decision-log/spec/index/Phase/facts/report → buildPageData → renderer/HTML与.nodes.json；原文为独立真相",
    "function": "查看对象/来源/阶段/报告 → 只读导航和解释；生成与真实打开分别回执"
  },
  "checks": {
    "old_page_state": "模板和当前驾驶舱存在；九历史页只读故障样本，不冒当前设计批准",
    "disposition_basis": "沿用现有页面，适配内容/缺失/过期；不重写视觉，不生成原创原型",
    "design_source": "真实角色existing_page，当前传统checker只认real/sample，不能冒design/prototypes来源",
    "availability": "适配后复用；可读来源不证明渲染或设计批准；当前machine ROLE_CONFLICT预期保留",
    "adaptation": "原文解析、测试聚合、环六报告、来源缺口/过期提示；P10承接真实首问和四路答复，P11只修原模板现页内容；原移植工具不改",
    "handoff": "当前最终计划与展示待用户答复；P10作者修原首问/路线消费，P11按真实源选择与当前范围独立UI复核"
  },
  "old_pages": [
    {
      "page": "skills/answer-as-page/templates/overview-template.html",
      "disposition": "adapt",
      "reason": "既有页结构保留，用户要求修内容一致与过期",
      "basis": "decision-log决定10/11与本次007大纲答复；非设计最终批准"
    }
  ],
  "adaptation_items": [
    "正确映射真实需求/包/决定标题",
    "当前阶段和测试原件正确投影",
    "环六从真实报告取索引写集",
    "来源未取得与过期可见"
  ],
  "verdict": "adapt",
  "hard_conditions": [],
  "destinations": [
    {
      "option": "按原决定沿用现页内容适配",
      "owner": "P11唯一开发writer"
    }
  ],
  "next": "先完成当前完整计划与真实展示确认；P1-P10方法/CLI边界不得伪装整页已准入；P11再按真实源选择/当前范围和UI六项核；不作外稿移植、不扩解析工具",
  "owner": "用户",
  "pending_confirmation": {
    "status": "awaiting",
    "reason": "尚未取得当前完整计划及页面展示答复，不复用大纲答复冒批准"
  }
}
```
