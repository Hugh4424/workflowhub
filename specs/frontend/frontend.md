# WorkflowHub 前端工程正文

定位：本文件只写前端工程侧的落地规则。读者：实现者与工程审查者。
边界：设计取值与语义归 specs/design/README.md；组件判据归 skills/frontend-component-quality/SKILL.md；页面数据合同归 skills/answer-as-page/SKILL.md#依赖与边界。

## 依据与职责

工程侧只承担模块边界、配置与构建、DTO→ViewModel、请求生命周期、错误与样式归属五件事；取值与外观不在此定。
（强制：审查问句；锚：[规范职责](../../skills/project-norm-init/SKILL.md#规范职责)）

## 工程规则与失败边界

1. 模块边界按页面区域切；DTO→ViewModel 转换只在边界做一次，页面不直接消费后端口径（强制：审查问句；锚：[触发与实现前就绪](../../skills/frontend-component-quality/SKILL.md#触发与实现前就绪)）
2. 配置与构建入口只留一处；组件内不读环境变量、不拼构建期常量（强制：审查问句；锚：[UI 交付合同](../../skills/frontend-testing/SKILL.md#ui-交付合同)）
3. 请求生命周期（取消、超时、重试）归一处实现；组件各自兜底算重复实现（强制：审查问句；锚：[依赖与边界](../../skills/answer-as-page/SKILL.md#依赖与边界)）
4. 错误态与空态必须显式出现；用默认值把失败渲染成正常态算未完成（强制：审查问句；锚：[回灌安全](../../skills/answer-as-page/SKILL.md#回灌安全)）
5. 样式归属跟组件文件走；不写全局覆盖去修单个页面（强制：审查问句；锚：[触发与实现前就绪](../../skills/frontend-component-quality/SKILL.md#触发与实现前就绪)）

## 与设计域的分工

设计域给取值与语义，本域给落地与失败；两边冲突时停该处回设计 owner，不在本域改设计值。
（强制：审查问句；锚：[规范职责](../../skills/project-norm-init/SKILL.md#规范职责)）

## 缺口与维护

缺源或存量与规范冲突时写缺口与 owner，不把当前代码反推为应然标准；本文件路径随 project-norm-init ⑥行同步。
（强制：审查问句；锚：[缺口与维护](../../skills/project-norm-init/SKILL.md#规范职责)）

## 边界与不承接

本文件不定义视觉值、不定义组件判据、不定义页面数据形状。
