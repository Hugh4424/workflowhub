import { useSyncExternalStore } from "react"
import { ACCTS, DIFFS, EVENTS, HB_INTERVAL, INSTS, RISK_EVENTS, T0, ctNow, readbackAge, type Acct, type Diff, type DiffType, type Ev, type Inst, type L, type RiskEv } from "./data"
import type { Tone } from "./shared"
import { DEFAULT_LINKS, SYMS, type Sym } from "./demoUniverse"

export type Gate = "closed" | "opening" | "open"
export type LivePage = "monitor" | "config" | "ledger"
export type StepState = "idle" | "wait" | "run" | "pass" | "fail" | "abort"
/** 刹车实测一次尝试：失败不会被后来的成功覆盖 */
export interface BrakeTry { at: string; result: "通过" | "失败" | "已中止"; reason: string; dur?: string; ms?: number }
/** 演示：开闸等待出口心跳的超时（秒）· 超时回落「已关闭 · 心跳超时」 */
export const OPEN_TIMEOUT_S = 60
/** 演示：出口心跳在开闸后多久到达（毫秒）；心跳中断演示开关打开时永不到达 */
export const OPEN_HB_DELAY_MS = 4500
/** 演示：刹车实测通过后对当前交易 session 的有效时长（毫秒） */
export const BRAKE_VALID_MS = 30 * 60_000

/** 台账深链接入参：品种 + 对账状态 + 起始毫秒（+ 账户 / 差异类型 / 定位信号），跳入即预置筛选并高亮 */
export interface LedgerFilter { sym?: string; state?: L | "open" | "all"; fromMs?: number; acct?: string; diffType?: DiffType | "open"; sigIds?: string[]; risk?: string; riskIds?: string[]; states?: L[]; origin?: string }

export interface CredState { state: "ok" | "expiring" | "invalid" | "rotating"; tail: string; since?: string }
/** 每品种已接入的模拟（参数保留；出口关闭时各处显示「未接入」，重开后恢复） */
export type Outlets = Record<Sym, string | null>

interface LiveState {
  gate: Gate
  gateAt: string | null
  gateAtMs: number | null // 开闸时刻
  hbAt: number | null // 上一次出口心跳时刻（唯一来源 · 开闸初始化、每次心跳刷新）
  hbStalled: boolean // 演示：出口心跳中断
  demoRerunFail: boolean // 演示：每日报告重跑失败
  reconAt: number // 上一次对账确认时刻（唯一来源 · 读回在线时每分钟确认一次）
  readback: boolean
  readbackLostAt: string | null
  page: LivePage
  ledgerSnap: { at: string; age: number } // 台账进页时取一次的快照（顶栏与页头同读）
  ledgerFilter: LedgerFilter | null
  focusAcct: string | null
  navToCockpit: boolean // 工作台 → 驾驶舱直达
  navToLogs: boolean // 配置页 → 业务日志页（由 Board 消费后复位）
  cred: CredState
  dedupe: boolean
  antiResend: boolean // 防重发 · 默认开；关闭须输入确认文字，驾驶舱同读
  credNone: boolean // 未配置 Webhook 凭证（不进 CredState，避免影响其他页的穷举）
  brake: { steps: StepState[]; at?: string; atMs?: number; dur?: string; fail?: string; reasons?: string[]; history?: BrakeTry[] }
  openAt: number | null // 开闸请求时刻（等待心跳计时起点）
  gateFail: string | null // 上次开闸失败 / 回落原因（如 心跳超时）
  pendingOps: Record<string, { op: string; at: string }> // 已受理 · 待平台确认（尾号 → 操作）
  revs: Record<string, number> // 保存修订号 rN（params / acct-尾号）
  outlets: Outlets // 品种 → 模拟 id
  accts: Acct[]
  insts: Inst[]
  events: Ev[]
  risks: RiskEv[]
  diffs: Diff[]
}

// C05 isolated mock: source persistence deliberately excluded.
let state: LiveState = {
  gate: "open",
  gateAt: "08:30:11 CT",
  gateAtMs: T0,
  hbAt: T0,
  hbStalled: false,
  demoRerunFail: false,
  reconAt: T0 - 2 * 60_000,
  readback: true,
  readbackLostAt: null,
  page: "monitor",
  ledgerSnap: { at: ctNow(), age: readbackAge() },
  ledgerFilter: null,
  focusAcct: null,
  navToCockpit: false,
  navToLogs: false,
  cred: { state: "ok", tail: "7f3a" },
  dedupe: true,
  antiResend: true,
  credNone: false,
  brake: { steps: ["pass", "pass", "pass", "pass"], at: "08:28:40", atMs: T0, dur: "4.4s", history: [{ at: "08:28:40", result: "通过", reason: "四步全过", dur: "4.4s", ms: T0 }] },
  openAt: null,
  gateFail: null,
  pendingOps: {},
  revs: { params: 7 },
  outlets: { ...DEFAULT_LINKS },
  accts: ACCTS,
  insts: INSTS,
  events: EVENTS,
  risks: RISK_EVENTS,
  diffs: DIFFS,
}
const initialState = structuredClone(state)
const mockTimeouts = new Set<ReturnType<typeof setTimeout>>()
export function scheduleSampleTimer(callback:()=>void, delay:number) { const id=setTimeout(()=>{mockTimeouts.delete(id);callback()},delay);mockTimeouts.add(id);return id }
const subs = new Set<() => void>()

export function patchLive(next: Partial<LiveState> | ((s: LiveState) => Partial<LiveState>)) {
  const p = typeof next === "function" ? next(state) : next
  // 进入台账：取一次读回 / 刷新快照，之后台账页不再走秒
  if (p.page === "ledger" && state.page !== "ledger") p.ledgerSnap = { at: ctNow(), age: readbackAge() }
  state = { ...state, ...p }
  subs.forEach((f) => f())
}

// 后台时钟：出口心跳每 HB_INTERVAL 秒到达一次；对账循环在读回在线时每 60 秒确认一次
export function mountSampleMock() {
  const interval = setInterval(() => {
    const now = Date.now(), p: Partial<LiveState> = {}
    const beating = state.gate === "open" && state.cred.state !== "rotating" && !state.hbStalled
    if (beating && (!state.hbAt || now - state.hbAt >= HB_INTERVAL * 1000)) p.hbAt = now
    // 开闸等待心跳：到达 → 已开启；超时 → 回落已关闭（心跳超时）
    if (state.gate === "opening" && state.openAt) {
      const wait = now - state.openAt
      if (!state.hbStalled && wait >= OPEN_HB_DELAY_MS) {
        Object.assign(p, { gate: "open" as Gate, gateAt: `${ctNow()} CT`, gateAtMs: now, hbAt: now, openAt: null, gateFail: null })
        queueMicrotask(() => logEvent({ kind: "state", type: "开闸", obj: "信号出口", change: "门禁通过 → 已开启", result: "心跳确认", tone: "ok" }))
      } else if (wait >= OPEN_TIMEOUT_S * 1000) {
        Object.assign(p, { gate: "closed" as Gate, gateAt: null, gateAtMs: null, openAt: null, gateFail: "心跳超时" })
        queueMicrotask(() => logEvent({ kind: "state", type: "开闸失败", obj: "信号出口", change: `等待心跳 ${OPEN_TIMEOUT_S}s → 已关闭`, result: "心跳超时 · 模拟未受影响", tone: "bad" }))
      }
    }
    if (state.readback && now - state.reconAt >= 60_000) p.reconAt = now
    if (Object.keys(p).length) patchLive(p)
  }, 1000)
  return () => { clearInterval(interval); for (const id of mockTimeouts) clearTimeout(id); mockTimeouts.clear(); state=structuredClone(initialState); }
}
export const getLive = () => state

export function useLive() {
  return useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state)
}
export const useOutlet = useLive

/** 追加一条事件（append-only） */
export function logEvent(e: Omit<Ev, "t" | "rel">) {
  patchLive((s) => ({ events: [{ ...e, t: ctNow(), rel: "刚刚" }, ...s.events] }))
}

export function setReadback(on: boolean) {
  patchLive({ readback: on, readbackLostAt: on ? null : ctNow() })
}

/** 关闸 / 全停：出口唯一写入口 · 再开须重过 5 项核验 · 已接入的参数保留，模拟照常运行 */
export function closeGate(how: "关闸" | "一键全停") {
  patchLive((s) => ({ gate: "closed", gateAt: null, gateAtMs: null, hbAt: null, openAt: null, gateFail: null, brake: { steps: ["idle", "idle", "idle", "idle"], history: s.brake.history } }))
  logEvent({ kind: "state", type: how, obj: "信号出口", change: "已开启 → 纯模拟", result: "已生效 · 持仓保留", tone: "muted" })
}

export const goLedger = (f: LedgerFilter | null) => patchLive({ page: "ledger", ledgerFilter: f })
export const goConfig = (tail: string | null) => patchLive({ page: "config", focusAcct: tail })
export const goCockpitConfig = () => patchLive({ page: "config", navToCockpit: true, focusAcct: null })

/** 某品种当前是否「有效接入」：出口开着且该品种有接入 */
export const effectiveLink = (s: Pick<LiveState, "gate" | "outlets">, sym: string): string | null => (s.gate === "open" ? s.outlets[sym as Sym] ?? null : null)
/** 有效接入路数（出口关闭 = 0） */
export const effectiveCount = (s: Pick<LiveState, "gate" | "outlets">) => SYMS.filter((x) => effectiveLink(s, x)).length
/** 仅改这一路 */
export const setOutlet = (sym: string, id: string | null) => patchLive((s) => ({ outlets: { ...s.outlets, [sym]: id } }))
