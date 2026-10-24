# ADR-0053：固定外部能力整包入库，按事实登记许可

## 背景

C01 需要离线可读的规范方法。只挂在线链接会受网络和遗漏读取影响；旧 PRD 的未知许可复制总禁令与用户选择冲突。两个 ModelScope 包未声明许可，design-tokens 原仓为 Apache-2.0，不能把公开可读当成已获许可。

## 决定

按本任务 decision-log WP0、U-008／U-009／U-010，把 SDD 15 文件、markdown 子技能 12 文件、design-tokens 1 文件的固定闭包原样复制到 `skills/external/`。保脚本字节但不执行；排除 SDD 两个基建文件、Figma 子技能与未选能力。三个固定 commit、具体上游路径、许可及维护策略在 catalog 同名 absorbed 条目登记，不新增字段；ModelScope URL 写在 local_changes，GitHub 源使用既有 github_url。README 是离线入口与闭包说明，不是第二登记权威。

许可如实为未声明／未声明／Apache-2.0；两份未声明许可内容的复制由用户明确选择并承担风险，不宣称取得权利人授权。design-tokens 保原文和 Apache LICENSE。PRD 只统一复制与许可口径，保 token/API 等唯一值源纪律、C10 插件业务逻辑禁止复制及 C06 完整 Vercel 源义务。

## 后果

当前规范读者能离线取得原方法，入口切换仍由 P2 完成。用户本人依 U-024 同时承担 registry 维护职责，采用前、上游变化或维护到期手工比对，绝不自动追 HEAD。当前树可比较不等于提交历史可得；查询失败保 unknown/unavailable。readiness 分数、登记、文件存在均不等于规范获批或脚本运行效果。副本替代在线字节作为本次三能力的读取源，上游仅供比对；全部 reader 由获批替代源承接后，由维护者统一退役副本和登记，不留永久双源。

## 备选

只在线引用不能满足离线读取；只复制入口会丢模板、参考和报告资源；复制整族会混入 Figma 与未选工具。选择最小完整闭包，不新增自动同步器、许可判定器或第二 registry。

## 依据

- `specs/workflowhub-ui-frontend-c01-norm-init-20261024/decision-log.md`：「WP0 — 外部能力入库与许可口径」、U-008～U-011、U-024、「与来源研究的一处真冲突（已由用户选择覆盖）」。
- 同任务 `phases/P1-外部能力入库与登记.md` T001～T004、冻结 `tests/contract/external-capability-intake.test.mjs`。
- 当前任务 `quality/evidence/build-plan/2026-10-24-105-external-and-standards.md` §1～§2；PRD 14 组扫描见 `2026-10-24-101-prd-requirements.md` §5。15 与14差额的一组仍 unknown；L654 是 C06 Vercel 未交付事实，不能转录成 P1 已交付。
- `specs/archive/workflowhub-review-efficiency-20261007/decision-log.md`「ADR-055 — 两个标准的落点 = 形状即标准」只读保留。本 ADR 不把模板形状、评分或历史决定升级为批准与推进门。
