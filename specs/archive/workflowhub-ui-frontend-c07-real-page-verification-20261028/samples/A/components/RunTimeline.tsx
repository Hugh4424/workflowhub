/* Shared combined run timeline — used by both the T11 run-detail drawer
   (时间线 section) and the workbench 最新事件 module so the two event
   streams stay visually and semantically identical.

   All rows below are example/placeholder evidence structures, not real
   PaperBuilder run data. */

export type TimelineCat =
  | "launch" | "market" | "signal" | "order" | "fill" | "risk" | "stop" | "close" | "anomaly"

export interface TimelineEvent {
  time: string
  cat: TimelineCat
  summary: string
  detail?: string     // 有意义的辅助信息（价格/数量/来源/原因），无意义则省略
}

export const CAT_META: Record<TimelineCat, { label: string; cls: string }> = {
  launch:  { label: "启动",   cls: "bg-sky-500/10 text-sky-300 ring-sky-500/20" },
  market:  { label: "行情",   cls: "bg-slate-500/10 text-slate-300 ring-slate-500/20" },
  signal:  { label: "信号",   cls: "bg-violet-500/10 text-violet-300 ring-violet-500/20" },
  order:   { label: "订单",   cls: "bg-sky-500/10 text-sky-300 ring-sky-500/20" },
  fill:    { label: "成交",   cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" },
  risk:    { label: "风控",   cls: "bg-amber-500/10 text-amber-300 ring-amber-500/20" },
  stop:    { label: "停止",   cls: "bg-amber-500/10 text-amber-300 ring-amber-500/20" },
  close:   { label: "收尾",   cls: "bg-slate-500/10 text-slate-300 ring-slate-500/20" },
  anomaly: { label: "异常",   cls: "bg-rose-500/10 text-rose-300 ring-rose-500/20" },
}

// 示例组合时间线（占位结构）
export const TIMELINE_SIM001: TimelineEvent[] = [
  { time: "09:30:00", cat: "launch", summary: "运行启动" },
  { time: "09:30:01", cat: "market", summary: "首条行情已接收", detail: "Databento Live" },
  { time: "10:14:22", cat: "signal", summary: "吸收反转信号 · 多" },
  { time: "10:14:22", cat: "risk", summary: "风控放行", detail: "日限额充足 · 规则 v12" },
  { time: "10:14:31", cat: "fill", summary: "入场成交 · 多", detail: "1 手 @ 21,430.25" },
  { time: "11:02:47", cat: "fill", summary: "止盈成交", detail: "1 手 @ 21,443.75 · +$270.00" },
  { time: "14:52:03", cat: "market", summary: "最后确认行情" },
]

export const TIMELINE_SIM005: TimelineEvent[] = [
  { time: "09:30:00", cat: "launch", summary: "运行启动" },
  { time: "09:30:02", cat: "market", summary: "首条行情已接收", detail: "Databento Live" },
  { time: "10:56:40", cat: "anomaly", summary: "行情连接中断", detail: "心跳超时 · 证据在此后不完整" },
  { time: "10:56:42", cat: "stop", summary: "策略推进停止", detail: "系统收尾" },
]

function TimelineRow({ e }: { e: TimelineEvent }) {
  const m = CAT_META[e.cat]
  return (
    <li className="flex items-baseline gap-3 py-1.5">
      <span className="w-[58px] shrink-0 font-mono text-[11px] text-slate-500">{e.time}</span>
      <span className={`shrink-0 self-center rounded px-1.5 py-[2px] text-[10px] font-medium ring-1 ${m.cls}`}>{m.label}</span>
      <span className="min-w-0 flex-1 text-[12px] text-slate-200">{e.summary}</span>
      {e.detail && <span className="shrink-0 font-mono text-[11px] text-slate-500">{e.detail}</span>}
    </li>
  )
}

export default function RunTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <div className="px-1 py-6 text-center text-[12px] text-slate-600">尚无时间线事件</div>
  }
  return (
    <ol className="divide-y divide-white/[0.05]">
      {events.map((e, i) => <TimelineRow key={i} e={e} />)}
    </ol>
  )
}
