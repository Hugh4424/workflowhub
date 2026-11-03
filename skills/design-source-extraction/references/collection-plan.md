# 怎样准备采集计划？

由当前任务的设计执行者从真实页面、已核规范与本次范围写 plan；collector 是唯一形状校验者。
先复制 [形状样例](../templates/collection-plan.example.json)，替换所有尖括号占位、当前owner/consumer、URL、标题、locator、规范元数据与五项输入证据；样例不是已冻结输入，也不能当采集结果。

## 哪些字段来自哪里？

- execution：真实绝对 task_path、project_name、task_id；通过现 openTask 核身份，不填别的任务。
- source：本样例只覆盖 runnable_page；必须有真实非空 type/ref/version/owner/consumer 与 scope。source.scope写此来源真实适用范围，不能与采集scope混淆。版本未取得保字符串 unknown，不编版本。runnable_page必须显式 figma={status:"unavailable",unavailable:true,reason:"实际未提供Figma的原因"}。figma_export相反要求status=present且unavailable=false，并按原SKILL与readSourceAsset核真实asset/授权；不能只改type套用此页面样例。screenshot同样须实际asset与来源，不把截图当浏览器测量。
- scope：pages 的 id/url/state/state_check，实际 actions；states/viewports/elements/norm_categories 是当前范围。
- checklist：每项 id/page/state/viewport/element/category/property/selector/norm_anchor；locator 含 tree_ref 和非空 business_attributes。
- critical 只引用已有 checklist id；conflict_threshold 来自当前任务既定口径，不以样例0.1替代。
- norm_basis：必须有非空 id/version 和 entries数组；当前规范owner保在owner。每个scope.norm_categories都有对应category条目；适用条目必含 ref/version/scope/owner/consumer 以及 anchor 或 section；仅真实不适用时可用not_applicable_reason，不用它豁免缺规范。
- inputs：design_source、target_elements、properties、states、acceptance_points五项，每项必含合法status、blocks数组与真实source_ref。status仅允许 present/missing/conflict/pending_review；unknown不是合法输入状态。present必须有非空value（数组不得空）；其余状态须非空reason与非空blocks，collector会生成同input、同blocks的gaps。provider只说明提供者，不能替代source_ref。
- 样例五项missing及尖括号source_ref仅提醒替换义务，不是现成证据。未取得来源时停相关实际采集/实施并具名缺项，不能保留占位却宣称真实验证通过。

freezeChecklist只验证分母/定位，不能证明正式模板可用。正式产物必须经collectDesignSource调用validateExtraction，连同source/norm/五inputs、观测原文、时间、状态、视口、覆盖率、缺口与低保真范围一起核；合成观测合同测试只证字段兼容，不是浏览器采集。

## 怎样探测、冻结和正式采集？

先按 isolated-browser-qa 取得本任务自有页面；已有ego模式由同一 owned TaskSpace 的真实 BROWSER_QA_EGO_SPACE_ID 承接，不能假造ID或隐式开备用浏览器。
用认证 task.captureCommand 执行 `node skills/design-source-extraction/scripts/collect-design-source.mjs --plan <本任务plan绝对路径> --probe`，保存真实原始回执与输出。
原输出须逐项 observed_ids 与清单顺序一致、无 failures；失败保原错误与未覆盖，不冻结假通过。
探测通过后，在同一plan写 scope.frozen_at 与 probe_ref（真实探测回执路径），集合不变；正式调用删去 --probe，其它输入沿该冻结plan。
无 probe_ref、坏回执、缺 frozen_at、未观察ID均由原 readPlan 拒绝；不能用此文档的存在冒校验通过。

## 怎样验证已有产物和重提炼？

验证命令 `node skills/design-source-extraction/scripts/collect-design-source.mjs --plan <冻结plan> --validate <原产物绝对路径> --current <本次current.json>`。
current 自带真实非空 source_versions、norm_versions、structure_ref；来自本次已核来源版本、规范版本与结构，不造默认current。
stale 时回原冻结plan、核真实设计变更与受影响条目，再用同一采集器重提炼；旧产物不覆写。--workspace-scenario 是隔离网关内部续接，不作人工绕过入口。

## 退出怎样解释？

0 只表示原collector当前覆盖/校验结果，不能代设计批准、整体视觉或业务验收；1保具名失败与缺口。
探测、正式采集与validate分别保本次argv/cwd/exit/原件；没有执行就记未执行。
