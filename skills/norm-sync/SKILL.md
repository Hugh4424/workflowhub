---
name: norm-sync
description: 每Phase收口、终末验证、写经验或任务收口前，将独立验证的变化写入唯一专业源并同步索引；拒写不足项，保幂等与partial恢复。
---

# Norm Sync

这是由当前agent执行的方法，不是后台同步器、runtime命令或质量许可证。caller提供真实task handle、物理项目规范权威根、已授权精确目标及原owner、条款ID、task、old/new、来源与版本/权利、适用范围/反例、独立验证原件、各文件预期before和索引/对应经验位置。没有缺省项目根、目录或账号。

## 触发与路由

交付后从首次可用起，在build-code每个Phase收口处理该Phase不同的已验证变化；verify-code终末、stage-reflection写经验前和stage-closeout任务收口前再核同一变化。不可推迟到整个build-code结束，也不为重复触发制造第二有效条款。

每次先读 [主题路由](references/routes.md) 选择原专业owner与真实consumer。P1/P2等方法尚未可用的早期建设，只在本方法可用后读其真实旧验证/未同步ref，按当前before处理，保真实晚于旧收口的时点；不能倒称早期已调用。没有适用新变化时写具名无变化与来源，不建候选或进度账本。

## 锁外准备与拒写

先核目标、权限、独立证据、原文、权利、范围与反例。来源不可回读、验证不足、未知复制/同步许可、未决冲突、无适用目标，分别说明该项不写及原因，保原件；安全的其它项继续。当前任务里的质量unknown不自动变成规范证据。所有AI起草、网络、读源、独立核证与consumer兼容研究在锁外完成，不持锁等child。

读当前目标与项目AGENTS实际用途，准备最小old→new及索引变化。已验证经验进入对应专业规则；未验证推断、尚需用户判断的待办仍在原载体，不清理、不复制第二经验正文。没有对应经验项明确不适用，不为演示清理造条目。

完成：每条拟同步内容有独立可回读事实、合法写权、精确原owner目标和before；缺一不写该目标，不靠模板或文件存在补齐。

## 共同锁内有序写入

1. caller实核同一物理规范权威根的realpath；同项目各task的规范、AGENTS及对应经验共用 `withLock(projectRoot,"norm-sync",callback)`（`runtime/interface/record-lock.mjs`）。同一项目必须同一root/name；task.withRecordLock只锁task库，不能替代项目锁。WH与其它项目分开顺序执行，不嵌套双锁。
2. 锁内重读每个目标before与准备字节逐字比较。漂移保双方差异、停止该项，不猜合并。重复task＋条款ID先核真实条款、内容及来源：完全同事实且目标/索引已符合时返回无变化；同ID异内容为冲突。旧delta存在不证明目标写成功，中断后仍读真实文件。
3. 目标尚未动前，调用认证 `task.appendRecord({dir:"quality/evidence/norm-deltas",slug,ext,bytes})` 保存本次唯一delta。delta记条款ID、task、原源/独立证据、目标/owner、old/new、适用范围/反例/版本/权利、每件before/after及回退consumer影响；本次随后要改的文件可保必要原字节，非目录快照。真实已验证的同字节原件只复用其ref，不能靠长度或命令相同去重。delta失败则目标仍未动，保原错误。
4. 用既有 `writeFileAtomic(projectRoot,relPath,bytes,options)` 逐精确文件写：**规范→AGENTS索引→对应已验证且已同步的经验条目**；每件立即读回与本次after比较。路径必须属于该projectRoot且是允许范围；权限/符号链接/路径错误沿原工具暴露，不绕过。index只给用途、读时、owner、consumer和最后更新，不复制规则。
5. 保每件实际已写、未写、失败与回读原ref。第二件失败时第一件可能已变，结果明确partial，不能写全组未写或完成。未到对应经验阶段/无该项时只记录未执行或不适用的真实原因；不提前清T005或其它writer条目。

完成据真实文件、索引与对应项的逐件读回；单文件rename原子不是多文件事务、CAS或全进程强制隔离。不合作编辑者仍可能在重读后改文件，此风险必须披露。

## 中断、补偿与回退

任何失败或取消先保原错误及已发生的写入；中断后按具名delta读实际文件，不猜全部未写。补偿先核已消费新版的直接/间接consumer与兼容影响，再在同项目同锁内逐件核当前字节**仍等本次after**才用原工具恢复对应before。有人改了after时停止该项补偿，保当前/本次双方及原owner，不覆盖他人，也不整目录回滚；规范原不存在的情形交原owner按现安全I/O和授权处理，不能猜删。

补偿也逐件留实际结果，未恢复保持partial；定向复验受影响consumer，不重写旧delta或失败原件。恢复不需要新恢复许可证，但缺真实授权/原件只停该路径。

## 交回与验证

输出本次真实触发点、条款ID、原件及目标、每文件状态、无变化/拒写/partial原因、锁root/name、错误与恢复及影响consumer。普通事实进入caller已有task记录；不新增状态对象、候选账本、历史trace或机器gate。实施者不自签独立质量。

独立执行者实际消费完整正反输入：合法A、同事实重复B、同ID异内容C、无目标/未知权利/冲突/缺证D、同物理根两writer E、规范成功索引失败F、恢复前他人修改G、delta失败H、中断读回I。使用原withLock/安全写或已批准窄I/O，保真实输入、调用、错误和最终字节；没有自动脚本就不宣存在运行入口。另核连续两个Phase各自收口、重复四触发及真实项目reader；隔离实验不证明所有外部writer或真实产品运行。

## 写作与来源

创建或修改方法先读 `skills/spec-specify/SKILL.md` 的WR001。来源、版本、维护和本地偏离唯一回catalog的norm-sync登记；本方法复用现规范分权、项目锁、认证记录和安全写，不导入第三方同步引擎。接口签名按实际源码，失配保unavailable交原owner，不扩公共面。
