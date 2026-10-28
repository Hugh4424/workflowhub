---
name: figma-make-prompt
description: 把当前业务需求与真实设计输入整理成可交给Figma Make的完整提示词；缺来源明确保留，不代代码原型或用户批准。
---

# Figma Make Prompt

## 输入与方法

由build-plan、frontend-prototype-render或plan-design-review给当前已确认需求、页面/路由、用户、真实数据形状、视觉/组件/token来源及允许范围。先读取skills/ui-copy-discipline/SKILL.md原文，随提示词交给下游；不在本方法复制规则。按knowledge-graph/references/knowledge-reuse.md核来源四判和采用位置；来源冲突不猜值；复制按来源权威与用户明确用途，unknown不冒已获grant，个人研究的明确决定不被默认许可门阻断。

提示词必须写实以下十项：任务（用户/目标/完整动作/成功失败）；页面（路由/入口/返回）；IA（区域优先级/增长）；状态（默认/加载/空/错/权限/取消/重复/部分/未知及恢复）；组件（现有wrapper/API与最小补缺）；布局（真实源值/滚动/浮层/焦点）；响应式（任务指定宽高与行为变化）；压力（长文/大数/缺值/缩放）；约束（栈/单CSS owner/mock/只读源/不可触后端）；验收（逐任务可观察动作、反例和证据）。缺项注明提供者/条件，不默填批准色值。

有稿保身份并提供源到目标映射与缺陷；无稿用已确认业务语义原创，同一完整任务确有结构歧义才给必要备选，逐稿只改一个变量并解释取舍；不强制多稿。下游作者实际消费提示词产出可编辑原型或方案并读回下一动作/结果/失败恢复；提示词文件存在不证明消费、运行或效果。

## 输出与失败

输出完整提示词、真实来源/未取得、十项落点与下游产物引用。Figma平台实际操作依宿主已授权能力，本方法不自动写Figma/安装/上传；浏览器沿isolated-browser-qa，设计审查沿plan-design-review，当前展示答复由用户给。不可运行、未答、来源不足分别保真；降级须沿frontend-prototype-render真实选择，prompt不冒Preview。

来源/固定版本及许可唯一回skills/catalog.yaml；写作沿skills/spec-specify/SKILL.md的WR001。
