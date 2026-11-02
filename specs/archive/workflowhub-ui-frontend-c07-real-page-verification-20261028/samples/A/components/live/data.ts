import type { Tone } from "./shared"

/* 实盘模块唯一账户源：驾驶舱 / 配置 / 台账 三处同用尾 4 位作主标识，完整 ID 只在 hover / 详情 */

export type AcctKind =
  | "copying" // 复制中
  | "riskOff" // 风控停用
  | "reconOff" // 对账停用
  | "healing" // 自愈中
  | "paused" // 手动暂停
  | "unlinked" // 未接入
  | "unverified" // 未核对
  | "removedResidual" // 已移除（有残留持仓）
  | "platformUnknown" // 平台侧未知

export const KIND_META: Record<AcctKind, { label: string; tone: Tone }> = {
  copying: { label: "复制中", tone: "ok" },
  riskOff: { label: "风控停用", tone: "bad" },
  reconOff: { label: "对账停用", tone: "bad" },
  healing: { label: "自愈中", tone: "warn" },
  paused: { label: "手动暂停", tone: "muted" },
  unlinked: { label: "未接入", tone: "muted" },
  unverified: { label: "未核对", tone: "warn" },
  removedResidual: { label: "已移除 · 有残留持仓", tone: "bad" },
  platformUnknown: { label: "平台侧未知", tone: "muted" },
}

export interface Acct {
  tail: string
  fullId: string
  role: "leader" | "follower"
  kind: AcctKind
  reason: string
  copyOn: boolean // 是否开了复制交易（决定生效范围文案）
  dd: [number, number] | null // null = 未配置
  daily: [number, number] | null | "noData" // noData = 今日无数据
  pos: [number, number] | null | "notProvided" // notProvided = 平台未提供
  recon?: { rel: string; abs: string; stale?: boolean }
  frozenAt?: string
  residual?: string // 残留持仓，只由人确认平掉清除
  removal?: "unconfirmed" | "waiting" // 未生效：只由平台确认清除
  readdAt?: number // 次日该品种交易时段开始（epoch ms）
  readdState?: "running" | "fail"
  cause?: string // 停用原因短语（异常块 / 台账同读）
  since?: string // 停用事件时刻 HH:MM:SS（取自事件时间线）
}

// mock 时钟：页面加载时刻视为 15:14:52 CT，之后跟真实时间走
export const T0 = Date.now()
const BASE = (15 * 3600 + 14 * 60 + 52) * 1000
export const ctNow = () => {
  const ms = BASE + (Date.now() - T0)
  const s = Math.floor(ms / 1000) % 86400
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}
const hmsToMs = (hms: string) => { const [h, m, x] = hms.split(":").map(Number); return ((h * 60 + m) * 60 + x) * 1000 }
/** 今日 CT 时刻 → epoch ms（mock 时钟同源） */
export const ctEpoch = (hms: string) => T0 + hmsToMs(hms) - BASE
/** epoch ms → HH:MM:SS CT */
export const ctFmt = (ms: number) => {
  const s = Math.floor((BASE + ms - T0) / 1000) % 86400
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}
/** 芝加哥交易日（mock 时钟同源）· 自然月 / 日历一律按它，不用本机时区 */
export const CT_DATE = { y: 2026, m: 9, d: 30 }
export const ctYm = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`
/** 台账快照标注：顶栏与台账页同读 */
export const snapLabel = (at: string) => `只读快照 · 最后刷新 ${at} CT`
/** 次日该品种交易时段开始（钟点只在交易时段定义里写） */
export const SESSION_SPEC = "17:00–16:00 CT"
export const NEXT_SESSION = ctEpoch(SESSION_SPEC.slice(0, 5) + ":00")

/** 读回新鲜度：读回扩展每 ~12 秒成功一轮（全模块唯一来源） */
export const readbackAge = (now = Date.now()) => 2 + (Math.floor((now - T0) / 1000) % 12)
/** 心跳：间隔 10 秒，滞后 3× = 30 秒转黄 */
export const HB_INTERVAL = 10
export const HB_LAG = 30

export const ACCTS: Acct[] = [
  { tail: "4821", fullId: "tt_acc_7f21c0a9e4b34821", role: "leader", kind: "copying", reason: "已标注信号账户", copyOn: false, dd: [420, 1100], daily: [180, 550], pos: [186, 400], recon: { rel: "2 分钟前", abs: "15:12:04" } },
  { tail: "7730", fullId: "tt_acc_19bd55e70c2a7730", role: "follower", kind: "riskOff", reason: "最大回撤 $1,120 ≥ $1,100 · 自动移出复制组", cause: "最大回撤触达", since: "14:22:07", copyOn: true, dd: [1120, 1100], daily: [310, 550], pos: [0, 400], recon: { rel: "2 分钟前", abs: "15:12:04" }, residual: "多 2 手 NQ（MNQZ6 ×20）· 移除时未平", removal: "unconfirmed", readdAt: NEXT_SESSION },
  { tail: "1195", fullId: "tt_acc_c8e04d1197f21195", role: "follower", kind: "healing", reason: "读回重连第 2 次 · 风控判定暂停中", copyOn: true, dd: [610, 1100], daily: [470, 550], pos: [92, 400], recon: { rel: "6 分钟前", abs: "15:08:11", stale: true }, frozenAt: "15:09:52" },
  { tail: "3306", fullId: "tt_acc_e3d18a0cc5b43306", role: "follower", kind: "reconOff", reason: "缺失成交超 30 分钟未解释 · 台账升级", cause: "差异超 30 分钟未解释", since: "14:41:30", copyOn: true, dd: [240, 320], daily: [90, 550], pos: [0, 400], recon: { rel: "2 分钟前", abs: "15:12:04" }, readdAt: NEXT_SESSION },
  { tail: "5512", fullId: "tt_acc_55c2ab80d19e5512", role: "follower", kind: "paused", reason: "你于 14:02 手动关闭 · 不是事故", copyOn: true, dd: [0, 1100], daily: "noData", pos: [0, 400], recon: { rel: "2 分钟前", abs: "15:12:04" } },
  { tail: "6604", fullId: "tt_acc_a4f1b7703de96604", role: "follower", kind: "unverified", reason: "检测到一笔无来源信号的成交 · 无法自动判定是否手动单", copyOn: true, dd: [150, 1100], daily: [60, 550], pos: [46, 400], recon: { rel: "3 分钟前", abs: "15:11:40" } },
  { tail: "2290", fullId: "tt_acc_6d0e2c4b9a182290", role: "follower", kind: "unlinked", reason: "已登记 · 读回扩展未绑定该账户", copyOn: false, dd: null, daily: null, pos: null },
  { tail: "8817", fullId: "tt_acc_b7c3e9120fa18817", role: "follower", kind: "removedResidual", reason: "09-29 由你移出复制组 · 平台已确认", copyOn: true, dd: [0, 1100], daily: [0, 550], pos: [24, 400], recon: { rel: "2 分钟前", abs: "15:12:04" }, residual: "空 1 手 GC（MGCZ6 ×10）· 移除后仍在" },
  { tail: "9043", fullId: "tt_acc_2f9ad06b18c39043", role: "follower", kind: "platformUnknown", reason: "平台 API 连续 3 次未返回该账户状态", copyOn: true, dd: [300, 1100], daily: [120, 550], pos: "notProvided", recon: { rel: "18 分钟前", abs: "14:56:30", stale: true } },
]

export const PLATFORM_DD = 2000

/* ─── 差异（台账 / 驾驶舱 / 配置恢复门控 同源） ─── */
export type DiffType = "孤儿持仓" | "缺失成交" | "状态不一致" | "疑似重复"
export interface DiffNote { t: string; text: string }
export interface Diff {
  id: string; type: DiffType; sev: "高" | "中"; foundAt: number; ref: string; sym: string; acct: string
  explained?: string; explainedAt?: string; escalated?: boolean
  reason?: string; riskId?: string // 差异原因 / 关联风险事件
  escState?: "accepted"; escReason?: string; escAt?: string // 升级请求：只追加，已受理 ≠ 风控已决定
  notes?: DiffNote[] // 备注：只追加
}
export const DIFF_TYPES: DiffType[] = ["孤儿持仓", "缺失成交", "状态不一致", "疑似重复"]
export const DIFFS: Diff[] = [
  { id: "d0", type: "状态不一致", sev: "中", foundAt: ctEpoch("11:22:00"), ref: "sig-20260930-NQ-0413-9b22ce", sym: "NQ", acct: "7730", reason: "部分成交回报晚到", riskId: "r1", explained: "平台 11:39 部分成交后补齐，已核对成交回报", explainedAt: "11:40:12" },
  { id: "d1", type: "缺失成交", sev: "高", foundAt: ctEpoch("14:10:00"), ref: "sig-20260930-GC-0212-0f93aa", sym: "GC", acct: "3306", escalated: true, reason: "已发出 · 平台无成交回报", riskId: "r2" },
  { id: "d2", type: "状态不一致", sev: "中", foundAt: ctEpoch("14:45:22"), ref: "sig-20260930-ES-0108-3c71de", sym: "ES", acct: "3306", reason: "回执数量与账本不一致", riskId: "r2" },
  { id: "d3", type: "孤儿持仓", sev: "高", foundAt: ctEpoch("15:02:52"), ref: "无来源信号 · 平台单 TT-88120347", sym: "NQ", acct: "7730", reason: "平台有持仓 · 账本无来源信号", riskId: "r1" },
  { id: "d4", type: "疑似重复", sev: "高", foundAt: ctEpoch("14:35:00"), ref: "sig-20260930-GC-0214-d2f6a9", sym: "GC", acct: "4821", reason: "重试用新 ID · 未被拦截" },
]
export const ageMin = (d: Diff) => Math.floor((Date.now() - d.foundAt) / 60_000)

/* ─── 事件时间线 ─── */
export interface Ev { t: string; rel: string; kind: "state" | "config"; type: string; obj: string; change: string; result: string; tone: Tone }
export const EVENTS: Ev[] = [
  { t: "15:09:52", rel: "4 分钟前", kind: "state", type: "自愈", obj: "账户 ··1195", change: "读回断开 → 重连第 2 次", result: "进行中", tone: "warn" },
  { t: "14:41:30", rel: "33 分钟前", kind: "state", type: "风控", obj: "账户 ··3306", change: "差异超 30 分钟 → 对账停用", result: "已生效", tone: "bad" },
  { t: "14:22:07", rel: "52 分钟前", kind: "state", type: "风控", obj: "账户 ··7730", change: "最大回撤 $1,120 ≥ $1,100 → 移出复制组", result: "未生效", tone: "bad" },
  { t: "14:02:15", rel: "1 小时前", kind: "state", type: "暂停", obj: "账户 ··5512", change: "复制中 → 手动暂停", result: "已生效", tone: "muted" },
  { t: "13:40:02", rel: "1 小时前", kind: "config", type: "配置变更", obj: "品种 GC · 手数", change: "2 → 1", result: "即时生效", tone: "muted" },
  { t: "09:31:20", rel: "6 小时前", kind: "state", type: "凭证轮换", obj: "Webhook 凭证", change: "··91c0 → ··7f3a", result: "完成 · 期间不补发", tone: "muted" },
  { t: "08:30:11", rel: "7 小时前", kind: "state", type: "开闸", obj: "信号出口", change: "门禁通过 → 已开启", result: "心跳确认", tone: "ok" },
  { t: "08:28:40", rel: "7 小时前", kind: "state", type: "实测记录", obj: "刹车通道", change: "四步实测", result: "通过 · 用时 4.4s", tone: "ok" },
  { t: "昨 16:05", rel: "昨天", kind: "config", type: "配置变更", obj: "账户 ··4821 · 单日亏损阈值", change: "$700 → $550", result: "已保存", tone: "muted" },
]

/* ─── 品种映射 ─── */
export interface Inst { sym: string; enabled: boolean; micro: boolean; contract: string; lots: number; microSym: string; roll?: string }
export const INSTS: Inst[] = [
  { sym: "NQ", enabled: true, micro: true, contract: "MNQZ6", lots: 1, microSym: "MNQ" },
  { sym: "GC", enabled: true, micro: true, contract: "MGCZ6", lots: 1, microSym: "MGC", roll: "数据源 GCZ6 → GCG7 将于 10-28 换月，请核对下单合约月" },
  { sym: "ES", enabled: false, micro: false, contract: "—", lots: 1, microSym: "MES" },
  { sym: "CL", enabled: false, micro: false, contract: "—", lots: 1, microSym: "MCL" },
  { sym: "ZN", enabled: false, micro: false, contract: "—", lots: 1, microSym: "—" },
]

/* ─── 信号生命周期 L0–L8（驾驶舱异常块 / 台账 同一张表） ─── */
export type L = "pending" | "sent" | "matched" | "missing" | "dup" | "mismatch" | "rejected" | "explained" | "na"
export const L_META: Record<L, { label: string; tone: Tone; open: boolean; awaitReadback?: boolean }> = {
  pending: { label: "L0 待发", tone: "muted", open: true },
  sent: { label: "L1 已发送 · 未对账", tone: "sent", open: true, awaitReadback: true },
  matched: { label: "L2 已对平", tone: "ok", open: false },
  missing: { label: "L3 缺失成交", tone: "warn", open: true },
  dup: { label: "L4 疑似重复", tone: "bad", open: true },
  mismatch: { label: "L5 状态不一致", tone: "warn", open: true },
  rejected: { label: "L6 拒绝", tone: "muted", open: false },
  explained: { label: "L7 已解释", tone: "muted", open: false },
  na: { label: "L8 无需对账", tone: "muted", open: false },
}
export const L_KEYS = Object.keys(L_META) as L[]
export const DIFF_TO_L: Record<DiffType, L | null> = { 缺失成交: "missing", 状态不一致: "mismatch", 孤儿持仓: null, 疑似重复: "dup" }

/** 信号簿 · day: 0 今日 · 1 昨日 · 2–6 更早；时间戳取自信号自身（毫秒），缺失即「未提供」 */
export interface Sig { id: string; day: number; gen?: string; logged: string; sent?: string; ack?: string; sym: string; dir: "多" | "空"; qty: number; contract: string; acct: string; dedupe: string; state: L; judged?: string; dupOf?: string }
export const SIGS: Sig[] = [
  { id: "sig-20260930-NQ-0417-a8c1e2", day: 0, gen: "15:13:02.098", logged: "15:13:02.114", sent: "15:13:02.161", sym: "NQ", dir: "多", qty: 1, contract: "MNQZ6", acct: "4821", dedupe: "首发 · 通过", state: "sent" },
  { id: "sig-20260930-NQ-0416-77b0d4", day: 0, gen: "14:52:30.990", logged: "14:52:31.006", sym: "NQ", dir: "多", qty: 1, contract: "MNQZ6", acct: "4821", dedupe: "重复 ID · 已拦截", state: "dup", judged: "14:55:00", dupOf: "sig-20260930-NQ-0415-52e0b1" },
  { id: "sig-20260930-NQ-0415-52e0b1", day: 0, gen: "14:52:28.301", logged: "14:52:28.318", sent: "14:52:28.366", ack: "14:52:28.590", sym: "NQ", dir: "多", qty: 1, contract: "MNQZ6", acct: "4821", dedupe: "首发 · 通过", state: "matched", judged: "14:55:00" },
  { id: "sig-20260930-GC-0214-d2f6a9", day: 0, gen: "14:32:11.402", logged: "14:32:11.420", sent: "14:32:11.468", ack: "14:32:11.702", sym: "GC", dir: "多", qty: 1, contract: "MGCZ6", acct: "4821", dedupe: "重试 · 新 ID 未拦截", state: "dup", judged: "14:35:00", dupOf: "sig-20260930-GC-0213-71aa0c" },
  { id: "sig-20260930-GC-0213-71aa0c", day: 0, gen: "14:32:05.201", logged: "14:32:05.218", sent: "14:32:05.266", sym: "GC", dir: "多", qty: 1, contract: "MGCZ6", acct: "4821", dedupe: "首发 · 通过", state: "sent" },
  { id: "sig-20260930-GC-0212-0f93aa", day: 0, logged: "14:08:44.530", sent: "14:08:44.588", sym: "GC", dir: "空", qty: 1, contract: "MGCZ6", acct: "3306", dedupe: "首发 · 通过", state: "missing", judged: "14:10:00" },
  { id: "sig-20260930-ES-0109-b84e10", day: 0, gen: "13:47:55.880", logged: "13:47:55.905", sent: "13:47:55.952", sym: "ES", dir: "空", qty: 2, contract: "MESZ6", acct: "3306", dedupe: "首发 · 通过", state: "rejected", judged: "13:47:56" },
  { id: "sig-20260930-ES-0108-3c71de", day: 0, gen: "13:47:55.880", logged: "13:47:55.902", sent: "13:47:55.950", ack: "13:47:56.130", sym: "ES", dir: "空", qty: 1, contract: "MESZ6", acct: "3306", dedupe: "首发 · 通过", state: "mismatch", judged: "13:52:10" },
  { id: "sig-20260930-NQ-0414-1a7d3f", day: 0, gen: "13:20:05.399", logged: "13:20:05.412", sent: "13:20:05.470", ack: "13:20:05.688", sym: "NQ", dir: "多", qty: 1, contract: "MNQZ6", acct: "4821", dedupe: "首发 · 通过", state: "matched", judged: "13:25:00" },
  { id: "sig-20260930-CL-0302-4b9e17", day: 0, gen: "13:12:47.011", logged: "13:12:47.030", sent: "13:12:47.081", ack: "13:12:47.300", sym: "CL", dir: "空", qty: 1, contract: "MCLX6", acct: "4821", dedupe: "首发 · 通过", state: "matched", judged: "13:15:00" },
  { id: "sig-20260930-GC-0211-5e04b9", day: 0, logged: "12:31:58.077", sent: "12:31:58.120", ack: "12:31:58.301", sym: "GC", dir: "多", qty: 1, contract: "MGCZ6", acct: "4821", dedupe: "首发 · 通过", state: "matched", judged: "12:35:00" },
  { id: "sig-20260930-ZN-0501-9a03c2", day: 0, gen: "11:10:05.120", logged: "11:10:05.141", sent: "11:10:05.190", sym: "ZN", dir: "多", qty: 2, contract: "ZNZ6", acct: "9043", dedupe: "首发 · 通过", state: "na", judged: "11:10:06" },
  { id: "sig-20260930-NQ-0413-9b22ce", day: 0, gen: "11:02:40.288", logged: "11:02:40.300", sent: "11:02:40.344", ack: "11:02:40.590", sym: "NQ", dir: "空", qty: 1, contract: "MNQZ6", acct: "7730", dedupe: "首发 · 通过", state: "explained", judged: "11:40:12" },
  { id: "sig-20260930-NQ-0412-44f8a0", day: 0, logged: "10:15:21.511", sym: "NQ", dir: "多", qty: 1, contract: "MNQZ6", acct: "4821", dedupe: "首发 · 通过", state: "pending" },
  { id: "sig-20260929-GC-0210-c01d77", day: 1, gen: "15:58:59.910", logged: "15:59:59.930", sym: "GC", dir: "空", qty: 1, contract: "MGCZ6", acct: "4821", dedupe: "首发 · 通过", state: "rejected", judged: "16:00:01" },
  { id: "sig-20260929-NQ-0411-e9f402", day: 1, gen: "14:10:12.004", logged: "14:10:12.020", sent: "14:10:12.071", ack: "14:10:12.240", sym: "NQ", dir: "多", qty: 1, contract: "MNQZ6", acct: "7730", dedupe: "首发 · 通过", state: "matched", judged: "14:15:00" },
  { id: "sig-20260927-NQ-0405-6a31b8", day: 3, logged: "10:44:03.611", sent: "10:44:03.660", ack: "10:44:03.902", sym: "NQ", dir: "空", qty: 1, contract: "MNQZ6", acct: "4821", dedupe: "首发 · 通过", state: "matched", judged: "10:50:00" },
]
/** 落盘时间 → 当日毫秒（深链接比较用，不做字符串前缀比） */
/** 信号落盘的绝对毫秒（mock 时钟同源，含跨日偏移）· 台账时间比较一律用它 */
export const sigMs = (s: Pick<Sig, "logged" | "day">) => { const [hms, f = "0"] = s.logged.split("."); return ctEpoch(hms) - s.day * 86_400_000 + Number(f.padEnd(3, "0").slice(0, 3)) }
/** 绝对毫秒 → HH:MM:SS.mmm（台账 chip 用） */
export const ctFmtMs = (ms: number) => `${ctFmt(ms)}.${String(((ms - T0) % 1000 + 1000) % 1000).padStart(3, "0")}`

/* ─── 风控事件（台账 ④ / 驾驶舱异常块 / 账户卡 同源）· 四类结果标签 ─── */
export type RiskResult = "已加回" | "自动加回失败" | "未生效" | "已停用"
export const RISK_RESULT: Record<RiskResult, Tone> = { 已加回: "muted", 自动加回失败: "bad", 未生效: "bad", 已停用: "warn" }
export interface RiskEv {
  id: string; day: number; acct: string; metric: string; at: string; result: RiskResult
  trigger: { v: string; formula: string[][]; equity: string }
  remove: { at: string; note: string; bad: boolean }
  readd: string; failWhy?: string
  notes: { t: string; text: string }[]
}
export const RISK_EVENTS: RiskEv[] = [
  {
    id: "r1", day: 0, acct: "7730", metric: "最大回撤", at: "14:22:07", result: "未生效",
    trigger: { v: "$1,120", formula: [["峰值权益", "$51,340", "读回 · 13:58:40 盘中峰值"], ["当前权益", "$50,220", "读回 · 14:22:07"], ["阈值", "$1,100", "账户卡配置 · 50K × 55%"]], equity: "$50,220" },
    remove: { at: "14:22:08", note: "已发起移出复制组 · 平台未确认（未生效分支）", bad: true },
    readd: "自动 · 次日该品种交易时段开始 · 计数重置", notes: [],
  },
  {
    id: "r2", day: 0, acct: "3306", metric: "对账升级", at: "14:41:30", result: "已停用",
    trigger: { v: "差异 31 分钟", formula: [["首次发现", "14:10:00", "对账循环"], ["升级线", "30 分钟", "口径表"]], equity: "$49,880" },
    remove: { at: "14:41:31", note: "平台已确认移出复制组", bad: false },
    readd: "自动 · 次日该品种交易时段开始 · 差异全部解释后可提前人工恢复", notes: [],
  },
  {
    id: "r3", day: 1, acct: "9043", metric: "单日亏损", at: "09-29 13:20:44", result: "自动加回失败",
    trigger: { v: "$575", formula: [["时段起点权益", "$50,610", "读回"], ["当前权益", "$50,035", "读回"], ["阈值", "$550", "账户卡配置"]], equity: "$50,035" },
    remove: { at: "13:20:45", note: "平台已确认", bad: false },
    readd: "自动 · 09-30 交易时段开始执行加回", failWhy: "加回失败 · 账户在平台侧不存在", notes: [{ t: "09-30 08:12:40", text: "平台客服确认该账户正在迁移，迁移完成前不可入组" }],
  },
  {
    id: "r4", day: 2, acct: "4821", metric: "单日亏损", at: "09-28 15:02:11", result: "已加回",
    trigger: { v: "$560", formula: [["时段起点权益", "$50,900", "读回"], ["当前权益", "$50,340", "读回"], ["阈值", "$550", "账户卡配置"]], equity: "$50,340" },
    remove: { at: "15:02:12", note: "平台已确认", bad: false },
    readd: "自动 · 09-29 交易时段开始加回成功 · 计数已重置", notes: [],
  },
]

/* ─── 台账快照 · 来源清单 · 完整性（零差异只在「完整」时成立） ─── */
export type SrcStatus = "ok" | "stale" | "missing"
export interface SnapSrc { name: string; ref: string; at: string; status: SrcStatus }
export type SnapMode = "ok" | "stale"
export const STALE_AT = "14:05:00"
export function snapSources(at: string, mode: SnapMode, readback: boolean): SnapSrc[] {
  const rb = (name: string, ref: string): SnapSrc => (!readback ? { name, ref, at: "未提供", status: "missing" } : mode === "stale" ? { name, ref, at: STALE_AT, status: "stale" } : { name, ref, at, status: "ok" })
  return [
    { name: "信号簿", ref: "src-sigbook-a41f", at, status: "ok" },
    { name: "本地发送记录", ref: "src-outbox-02be", at, status: "ok" },
    { name: "账户状态", ref: "src-acct-77c0", at, status: "ok" },
    { name: "对账循环", ref: "src-recon-3d19", at, status: "ok" },
    rb("平台回执", "src-ack-c5e8"),
    rb("订单读回", "src-ord-90ab"),
    rb("持仓读回", "src-pos-1f66"),
  ]
}
export const srcMissing = (xs: SnapSrc[]) => xs.filter((x) => x.status !== "ok")
export const srcWhy = (xs: SnapSrc[]) => srcMissing(xs).map((x) => `${x.name}${x.status === "missing" ? "缺失" : "过期"}`).join("、")

/** 心跳：自开闸起按 HB_INTERVAL 计，中断一次扣 HB_LAG 内的拍数 */
export const HB_BREAKS = 1
export const hbOkCount = (atHms: string) => Math.max(0, Math.floor((hmsToMs(atHms.slice(0, 8)) - hmsToMs("08:30:11")) / 1000 / HB_INTERVAL) - HB_BREAKS * (HB_LAG / HB_INTERVAL))

/** 被拒信号 · 按小时聚合（最后一格 = 过去 1 小时）· 基线取此前各小时中位数 */
export const REJECT_BARS = [1, 2, 1, 3, 2, 1, 2, 3, 2, 1, 4, 14]
export const REJECT_BASE = [...REJECT_BARS.slice(0, -1)].sort((a, b) => a - b)[Math.floor((REJECT_BARS.length - 1) / 2)]

/** 诊断层：七层各自独立，已发出 ≠ 已成交，未知不自动重发 */
export interface Layer { en: string; zh: string; tone: Tone; status: string; at?: string; id?: string }
export function layersOf(s: Sig): Layer[] {
  const x = s.id.split("-").pop() ?? ""
  const orderId = s.ack ? `TT··${(parseInt(x, 16) % 10000).toString().padStart(4, "0")}` : undefined
  const noSent = !s.sent
  const fill: Pick<Layer, "tone" | "status"> =
    s.state === "matched" ? { tone: "ok", status: "已对平成交" }
    : s.state === "missing" ? { tone: "warn", status: "缺失 · 平台无成交" }
    : s.state === "mismatch" ? { tone: "warn", status: "数量 / 状态不一致" }
    : s.state === "dup" ? { tone: "bad", status: "疑似重复 · 未确认成交" }
    : s.state === "explained" ? { tone: "muted", status: "已解释" }
    : s.state === "rejected" ? { tone: "muted", status: "无成交 · 已拒绝" }
    : s.state === "na" ? { tone: "muted", status: "无需对账" }
    : s.state === "sent" ? { tone: "muted", status: "未对账 · 无法判定" }
    : { tone: "muted", status: "无 · 未发出" }
  return [
    { en: "Signal", zh: "信号", tone: s.gen ? "ok" : "muted", status: s.gen ? "已生成" : "未提供", at: s.gen, id: `sig··${x}` },
    { en: "Intent", zh: "意图", tone: "ok", status: "已落盘", at: s.logged, id: `int··${x}` },
    { en: "Attempt", zh: "尝试", tone: s.sent ? "sent" : "muted", status: s.sent ? "已发出" : s.state === "dup" ? "已拦截 · 重复 ID" : s.state === "rejected" ? "已拒绝 · 未发出" : "未发出", at: s.sent, id: s.sent ? `att··${x}` : undefined },
    { en: "Ack", zh: "回执", tone: s.ack ? "ok" : noSent ? "muted" : "warn", status: s.ack ? "已回执" : noSent ? "无" : "无回执 · 未知 · 不自动重发", at: s.ack },
    { en: "Order", zh: "订单", tone: orderId ? "ok" : "muted", status: orderId ? "平台订单已读回" : "未提供", id: orderId },
    { en: "Fill", zh: "成交", ...fill, at: s.state === "matched" || s.state === "missing" || s.state === "mismatch" ? s.judged : undefined },
    { en: "Position", zh: "持仓", tone: s.state === "matched" ? "ok" : "muted", status: s.state === "matched" ? "持仓已核对" : "未提供 · 无法判定", at: s.state === "matched" ? s.judged : undefined },
  ]
}
/** 证据行（只读）：每层的来源记录 */
export function evidenceOf(s: Sig): { src: string; at?: string; note: string }[] {
  return [
    { src: "信号簿", at: s.logged, note: `落盘 · ${s.id}` },
    { src: "本地发送记录", at: s.sent, note: s.sent ? `${s.dedupe}` : "无发送记录" },
    { src: "平台回执", at: s.ack, note: s.ack ? "平台 ack" : "未收到回执" },
    { src: "对账循环", at: s.judged, note: L_META[s.state].label },
    { src: "读回扩展 · 持仓", at: s.state === "matched" ? s.judged : undefined, note: s.state === "matched" ? "持仓核对一致" : "无读回证据" },
  ]
}
