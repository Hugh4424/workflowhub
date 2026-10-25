# 按产物还原局部区块

实施者用派生对照表还原一处区块；独立检查者测量实施结果再回填。输入是 P3 的 `items[]` 与 P4 的规范关系。本文交付文档契约，不提供运行 validator。文件存在、文档样例通过都不能证明真实还原。

## 对照表与待议

输入 `items` 为空时明确报错并停止派发。逐项保留 item 身份、原始证据与 `rendered` 值，派生 `comparison[]` 的 `item_ref`、`design_value`、`evidence_ref`；目标取值使用哪一事实须明确，不能用未知声明猜值。规范关系另保 `norm_state` 与理由。`unknown`、`pending_review` 仍是未取得或待议，受控还原不把它们变成产品批准。

实现前 `implementation_value=null`、`state=missing`，未实现项持续保留。`pending_review` 与对照表的待议行一一对应，按 `item_ref` 及该行存在的 `requirement_ref` 匹配；不漏行、重复或混入无关项。每项保同一待议理由、当前责任角色 `owner` 与下一条件 `condition`，来源和受影响范围沿原行可回读；缺字段或理由错配不能报交接齐全。已有规范 owner 未批准的值只供本次实验。低保真 `ruling=pending|rejected|no_response` 时，`blocked_scope` 内实施不启动；其它无关范围可继续。未触发低保真的“不适用”说明不代表有人批准。

## 隔离实施

先固定所选区块的必要属性/状态、局部 checklist、critical 项、分母、冻结时间、比较方式和返工定义，再派新 `none` 上下文实施者。全局采集分母保持独立，局部覆盖不替代三页覆盖。初交为 round 0，明确拒绝后再交才计返工，最多两次；不能事后删项或缩范围凑比例。

实施者只拿到沙箱派生 packet；packet 可含结构与实测目标、未知和待议，但剥去原源码片段、结构源码、源文件路径与日志正文。来源映射留给独立验证者。实施者只写指定输出，不读设计源码或验证者映射，不浏览器、网络、安装或运行服务。任务 owner 与实施者串行交接各自唯一文件，保实际工具 I/O 与访问清单。若越界或不能建立此访问边界，按 P5 STOP 记 unavailable，不用自述代证明。同机白名单与访问审计不是 OS 硬隔离，无法排除不可观察读取。

## 独立测量与 backfill

独立检查者先核 HTML hash、冻结目标和来源映射，再只在任务自建静态服务测量真实 DOM、computed styles 与 border box。`observed` 只来自目标，不能复制 expected。每项回填 `implementation_value`、`observed`、`measurement_ref`、时间、URL、状态、实际 viewport、命令/输出引用；回填须与实际观测一致，且按冻结比较方式满足 `design_value`，双侧同错不能报 present。值矛盾、证据缺失仍失败或 missing。比较前先核字段存在、类型与非空，两个字段都缺失不能相等通过。

本次固定 H1 区块的八项全部 critical：tag/text 字面相等，字号/行高 numeric px 与字重严格相等，颜色按冻结合同的同色序列化规范化比较，box 宽高容差 0。实际 viewport 读回并报告，与来源 viewport 不同不新增第九项；不 resize 用户窗口。只对这八项给局部结论，不声明整页或响应布局等价。服务和 browser QA 沿 isolated-browser-qa，复用当前已授权 handle，错误或用户接管停下保 handle，不 finish。

`p5-coverage.json` 记录原冻结分母、逐项实测、critical 完整性、比例与返工次数；覆盖≥90%仍须 critical 全部满足。初始 missing、实施原件、回填与事后访问审计分别保留。独立受控负例应使目标检查失败，恢复后回核；不改原设计源码或用户页面。完成声明按验收 evidence/done 原规范，不把文档 oracle、局部结果或待议规范冒成整体通过。

## 可重放文档消费样例

下块只用来证伪以上文档契约；不是本任务八项真实测量或生产 validator。唯一块缺失、重复、解析失败均为失败。真实来源、初始对照、独立测量与访问审计另见本 Phase 任务证据。

<!-- C04-CONSUME-SEMANTIC-ORACLE -->
```json
{
  "items": [{"id":"heading","rendered":28,"evidence_ref":"literal-observation"}],
  "comparison": [{"item_ref":"heading","design_value":28,"evidence_ref":"literal-observation","norm_state":"pending_review","norm_approved":false,"reason":"Product mapping awaits original owner","implementation_value":null,"state":"missing"}],
  "pending_review": [{"item_ref":"heading","reason":"Product mapping awaits original owner","owner":"current maintainer","condition":"original norm owner supplies mapping"}],
  "scope": {"frozen_at":"2026-10-25T00:00:00Z","denominator":1,"checklist":[{"id":"heading","critical":true}]},
  "low_fidelity": {"ruling":"approved","blocked_scope":[]},
  "started": [],
  "reworks": 0,
  "completed": false
}
```


## 三来源消费分支

先真实读同一产物的comparison.design_basis与对应items证据。旧页面产物未写basis时只在evidence_kind=rendered且原观察可回读的路径沿rendered解释，不能把未知来源默认合法。rendered消费实测；declared仅在合法figma_export原节点/属性与授权主张绑定后消费设计声明目标，仍须把rendered未知、关键覆盖缺口/裁决与实测回填分开。unknown（截图辅助）没有数值目标：可读asset身份/尺寸作辅助，但不能用IHDR宽高生成元素样式；comparison保持missing并列依赖步骤，不能报completed。任何blocked_scope内步骤均不启动，读取结构/声明供规划不等实施已获批准。授权主张不是远端访问验证；非浏览器事实不计真实rendered覆盖。

下面唯一样例是方法契约，不是实测：

<!-- SOURCE-CONSUMPTION-CASE -->
```json
{"figma":{"source_type":"figma_export","design_basis":"declared","design_value":"28px","rendered_status":"unknown","implementation_value":"unknown","state":"missing","expected":{"target":"28px","basis":"declared","measured":false}},"screenshot":{"source_type":"screenshot","design_basis":"unknown","design_value":"unknown","rendered_status":"unknown","implementation_value":"unknown","state":"missing","expected":{"target":"unknown","basis":"unknown","measured":false}}}
```

截图有合法绑定的inference时，consumer必须真实读取value/observer/method/limits及原观察ref/hash，将组件形状/相对布局作为视觉提示；不得只保存asset元数据就声称提取设计。没有数值目标仍保持comparison missing，不能从视觉推断生成computed或实测回填。原图可回读不证明推断必然正确，独立核观察与来源边界；显式错误观察不静默忽略。
