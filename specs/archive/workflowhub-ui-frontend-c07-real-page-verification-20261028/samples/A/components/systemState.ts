import { useSyncExternalStore } from "react"

/* ── 本机数据能力 + 磁盘 + 运行状态 · 单一数据源 ──────────────────────
   顶栏数据浮窗、工作台运行监控浮窗、模拟详情页行内状态共用同一套事实与
   状态源（smallest local extension）。读不到的字段一律「未提供」。 */

/* ---------- 磁盘压力档（顶栏与监控浮窗同源） ---------- */
export type Pressure = "normal" | "t1" | "t2" | "t3"

export const PRESSURE_META: Record<Pressure, { dot: string; text: string; bar: string; label: string; level: number; humane: string; action: string | null }> = {
  normal: { dot: "bg-emerald-400", text: "text-emerald-400", bar: "bg-emerald-400", label: "正常", level: 1, humane: "磁盘充裕，可自由新建", action: null },
  t1: { dot: "bg-amber-400", text: "text-amber-300", bar: "bg-amber-400", label: "档 1", level: 2, humane: "空间偏紧，已暂停新建", action: "停止新建" },
  t2: { dot: "bg-orange-400", text: "text-orange-300", bar: "bg-orange-400", label: "档 2", level: 3, humane: "空间紧张，停后台并清理", action: "停后台·清理" },
  t3: { dot: "bg-rose-400", text: "text-rose-300", bar: "bg-rose-400", label: "档 3", level: 4, humane: "空间告急，正在停运行中", action: "停运行中" },
}

/* ---------- Footprint / 保留窗口 状态（详情页与监控浮窗同源） ---------- */
export type FpState = "normal" | "rebuilding" | "backfill" | "out-of-window" | "ref-mismatch"

export const FP_META: Record<FpState, { label: string; dot: string; text: string; spin: boolean }> = {
  normal: { label: "正常", dot: "bg-emerald-400", text: "text-emerald-300", spin: false },
  rebuilding: { label: "重建渲染中", dot: "bg-sky-400", text: "text-sky-300", spin: true },
  backfill: { label: "历史回补中", dot: "bg-sky-400", text: "text-sky-300", spin: true },
  "out-of-window": { label: "超出保留窗口·无法重建", dot: "bg-amber-400", text: "text-amber-300", spin: false },
  "ref-mismatch": { label: "记录引用对不上", dot: "bg-rose-400", text: "text-rose-300", spin: false },
}

export const FP_DEMO: { key: FpState; label: string }[] = [
  { key: "normal", label: "正常" },
  { key: "rebuilding", label: "重建渲染中" },
  { key: "backfill", label: "历史回补中" },
  { key: "out-of-window", label: "超出保留窗口" },
  { key: "ref-mismatch", label: "记录引用对不上" },
]

/* ---------- 本机数据能力与磁盘事实（fixture · 单一数据源） ---------- */
export interface Coverage { sym: string; start: string; end: string; range: string; days: number; latest: string; gap: string | null; gapDays: number; behindDays: number }
export interface CleanRecord { time: string; category: string; result: string; ok: boolean; reclaimed: string }

export const MACHINE = {
  // 数据能力评估
  dataLatest: "2026-09-12",
  dataLatestStale: false,
  backtestDays: 47,
  coverage: [
    { sym: "NQ", start: "2026-06-27", end: "2026-09-12", range: "2026-06-27 ~ 2026-09-12", days: 47, latest: "2026-09-12", gap: null, gapDays: 0, behindDays: 0 },
    { sym: "ES", start: "2026-07-15", end: "2026-09-05", range: "2026-07-15 ~ 2026-09-05", days: 40, latest: "2026-09-05", gap: null, gapDays: 0, behindDays: 7 },
    { sym: "MNQ", start: "2026-08-01", end: "2026-09-09", range: "2026-08-01 ~ 2026-09-09", days: 26, latest: "2026-09-09", gap: "缺 09-10~09-12 段", gapDays: 3, behindDays: 3 },
  ] as Coverage[],
  coldStart: { ready: true as boolean, note: "NQ 预热段就绪", detail: "MNQ 缺 09-10~09-12 段，补齐中 41 / 78" },
  realtime: { ready: true as boolean, feed: "已连接", note: null as string | null },
  // 实时消费段 / 延迟（监控浮窗数据面）
  segment: "seg-20260916-nqz25 · 09:30 – 14:52 ET",
  lastTick: "14:52:03 ET",
  latencySec: 3,
  latencyMs: 271,
  uptime: "271 小时",
  // 磁盘与清理
  disk: { used: "104.2 GB", quota: "90 GB", sysDisk: "88%" },
  cleaning: [
    { time: "09-16 14:02", category: "重建缓存", result: "成功", ok: true, reclaimed: "6.4 GB" },
    { time: "09-16 03:00", category: "过期行情段", result: "成功", ok: true, reclaimed: "12.1 GB" },
    { time: "09-15 22:41", category: "运行日志", result: "跳过 · 正被占用", ok: false, reclaimed: "未提供" },
    { time: "09-15 03:00", category: "过期行情段", result: "成功", ok: true, reclaimed: "9.7 GB" },
    { time: "09-14 03:00", category: "重建缓存", result: "成功", ok: true, reclaimed: "4.2 GB" },
    { time: "09-13 03:00", category: "临时快照", result: "成功", ok: true, reclaimed: "2.8 GB" },
    { time: "09-12 03:00", category: "过期行情段", result: "成功", ok: true, reclaimed: "11.5 GB" },
  ] as CleanRecord[],
  nextCleanWindow: "2026-09-17 03:00 ET",
  cpu: "未提供",
  mem: "12.4 GiB / 32 GiB",
  // 策略执行节奏（监控浮窗）
  exec: {
    signal1m: 2, order1m: 1, fill1m: 1,
    signalDay: 43, orderDay: 4, fillDay: 3,
    lastEvent: "14:52:03 · 订单 已止盈",
    errors: 0, rejects: 1, lastReject: "14:41:55 · 风控拒绝：超出当日下单上限",
  },
}

/* ---------- 轻量共享 store（pressure + footprint） ---------- */
let pressure: Pressure = "t1"
let fp: FpState = "normal"
const listeners = new Set<() => void>()
function emit() { listeners.forEach((l) => l()) }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb) }

export function setPressure(p: Pressure) { pressure = p; emit() }
export function setFootprint(s: FpState) { fp = s; emit() }
export function usePressure() { return useSyncExternalStore(subscribe, () => pressure, () => pressure) }
export function useFootprint() { return useSyncExternalStore(subscribe, () => fp, () => fp) }

/* ── 共享回测数据 Hub（三件套设置 + 五类状态 + 月格矩阵 + 缺口） ─────────
   顶栏「本机数据」浮窗的设置区与状态区、页面缺口提示条共用同一数据源。
   demo：用 scenario 驱动 8 个边界态，均为示例数据（无真实读盘）。 */

export const HUB_SYMBOLS = ["ES", "NQ", "GC", "CL", "ZN"] as const
export const HUB_MONTHS = [
  "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03",
  "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09",
]

export type CellState = "full" | "partial" | "missing"
export interface MonthCell { month: string; state: CellState; days: number; total: number }
export interface SymRow { sym: string; cells: MonthCell[]; fullCount: number; qualified: boolean; coldReady: boolean }

/** 用 12 字编码（f 满 / p 部分 / m 缺）生成一行月格；第 13 格为冷启动（前 2 交易日在库） */
function row(sym: string, code: string, coldReady = true): SymRow {
  const cells: MonthCell[] = HUB_MONTHS.map((month, i) => {
    const ch = code[i] ?? "m"
    const total = 22
    const state: CellState = ch === "f" ? "full" : ch === "p" ? "partial" : "missing"
    const days = state === "full" ? 22 : state === "partial" ? 17 : 0
    return { month, state, days, total }
  })
  const fullCount = cells.filter((c) => c.state === "full").length
  return { sym, cells, fullCount, qualified: fullCount >= 11, coldReady }
}

const LOCAL_MATRIX: SymRow[] = [
  row("ES", "fffffffffffp", true),
  row("NQ", "fffffffffffp", true),
  row("GC", "fffffffffffm", true),
  row("CL", "ffffffffppmm", false),
  row("ZN", "ffffffppmmmm", false),
]
const SHARE_MATRIX: SymRow[] = [
  row("ES", "ffffffffffff"),
  row("NQ", "ffffffffffff"),
  row("GC", "ffffffffffff"),
  row("CL", "ffffffffffpp"),
  row("ZN", "ffffffffppmm"),
]

export type HubScenario =
  | "empty"          // 三件套全未设置（首次启动）
  | "lib-only"       // 只设库目录
  | "lib-broken"     // 库目录被删/不可写
  | "key-auth-fail"  // key 已设置但鉴权失败
  | "share-offline"  // 共享盘离线/半同步 → 完整性校验失败
  | "downloading"    // 下载中超限停手
  | "window-short"   // 回测窗口不足 30 天
  | "migrated"       // 老目录迁移后
  | "configured"     // 三件套齐备、五类状态混合

export const HUB_SCENARIOS: { key: HubScenario; label: string }[] = [
  { key: "empty", label: "全未设置" },
  { key: "lib-only", label: "仅库目录" },
  { key: "lib-broken", label: "库目录不可写" },
  { key: "key-auth-fail", label: "key 鉴权失败" },
  { key: "share-offline", label: "共享盘校验失败" },
  { key: "downloading", label: "下载超限停手" },
  { key: "window-short", label: "窗口不足30天" },
  { key: "migrated", label: "老目录迁移" },
  { key: "configured", label: "齐备（混合）" },
]

export interface Gap { sym: string; month: string; onShare: boolean }
export interface HubSnapshot {
  scenario: HubScenario
  lib: { value: string | null; error: string | null }
  key: { tail: string | null; authFailed: boolean }
  share: { value: string | null; integrityError: string | null }
  coldStartReady: boolean
  windowShort: boolean
  migratedFrom: string | null
  downloadCap: boolean
  gaps: Gap[]
  localMatrix: SymRow[] | null
  shareMatrix: SymRow[] | null
}

const LIB_PATH = "/Users/quant/PaperBuilder/library"
const SHARE_PATH = "/Users/quant/Library/CloudStorage/Dropbox/pb-shared"
const KEY_TAIL = "k3j9"
const DEMO_GAPS: Gap[] = [
  { sym: "ES", month: "2025-03", onShare: true },
  { sym: "CL", month: "2025-08", onShare: true },
  { sym: "ZN", month: "2025-09", onShare: false },
]

export function hubSnapshot(s: HubScenario): HubSnapshot {
  const base: HubSnapshot = {
    scenario: s,
    lib: { value: LIB_PATH, error: null },
    key: { tail: KEY_TAIL, authFailed: false },
    share: { value: SHARE_PATH, integrityError: null },
    coldStartReady: true,
    windowShort: false,
    migratedFrom: null,
    downloadCap: false,
    gaps: DEMO_GAPS,
    localMatrix: LOCAL_MATRIX,
    shareMatrix: SHARE_MATRIX,
  }
  switch (s) {
    case "empty":
      return { ...base, lib: { value: null, error: null }, key: { tail: null, authFailed: false },
        share: { value: null, integrityError: null }, coldStartReady: false, gaps: [], localMatrix: null, shareMatrix: null }
    case "lib-only":
      return { ...base, key: { tail: null, authFailed: false }, share: { value: null, integrityError: null }, shareMatrix: null }
    case "lib-broken":
      return { ...base, lib: { value: LIB_PATH, error: "目录不可写（已被移动或权限不足）" }, coldStartReady: false, localMatrix: null, gaps: [] }
    case "key-auth-fail":
      return { ...base, key: { tail: KEY_TAIL, authFailed: true } }
    case "share-offline":
      return { ...base, share: { value: SHARE_PATH, integrityError: "共享盘数据校验失败，拒绝使用（可能离线或半同步）" }, shareMatrix: null }
    case "downloading":
      return { ...base, downloadCap: true }
    case "window-short":
      return { ...base, windowShort: true }
    case "migrated":
      return { ...base, migratedFrom: "/Users/quant/PaperBuilder-old/library" }
    default:
      return base
  }
}

let hub: HubScenario = "configured"
export function setHubScenario(s: HubScenario) { hub = s; emit() }
export function useHubScenario() { return useSyncExternalStore(subscribe, () => hub, () => hub) }
export function useHub() { return hubSnapshot(useHubScenario()) }
