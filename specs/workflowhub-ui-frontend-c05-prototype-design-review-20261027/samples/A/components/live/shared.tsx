import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

// PB-DES-TOKENS · 实盘模块唯一配色来源
export const C = {
  ok: "#64df95",
  bad: "#ff8aa1",
  warn: "#ffd166",
  muted: "#aeb1c5",
  primary: "#91baff",
  raised: "#20203a",
  sent: "#8b9ab8", // 蓝灰 · 已发送未对账（sent 永不绿）
}

export type Tone = "ok" | "bad" | "warn" | "muted" | "sent" | "primary"

export function Lamp({ tone, pulse, size = 8 }: { tone: Tone; pulse?: boolean; size?: number }) {
  return <span className={`inline-block shrink-0 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ width: size, height: size, background: C[tone] }} />
}

export function Chip({ tone, children, solid, className = "" }: { tone: Tone; children: ReactNode; solid?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-[2px] text-[11px] font-medium ${className}`}
      style={solid ? { background: C[tone], color: "#0b0d16" } : { color: C[tone], background: `${C[tone]}14`, boxShadow: `inset 0 0 0 1px ${C[tone]}30` }}
    >
      {children}
    </span>
  )
}

// 相对时间显示，hover 出绝对时间（CT）
export function RelTime({ rel, abs, tone }: { rel: string; abs: string; tone?: Tone }) {
  return (
    <span title={`${abs} CT`} className="cursor-help font-mono tabular-nums underline decoration-white/10 decoration-dotted underline-offset-2" style={tone ? { color: C[tone] } : undefined}>
      {rel}
    </span>
  )
}

// 降级字段：灰掉 + 为什么没有 + 怎么补上
export function Degraded({ word, why, fix, onFix }: { word: string; why: string; fix?: string; onFix?: () => void }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[13px] font-medium text-[#aeb1c5]">{word}</div>
      <div className="text-[10px] leading-snug text-slate-500">
        {why}
        {fix && (
          <>
            {" · "}
            <button onClick={onFix} className="text-[#91baff]/80 hover:text-[#91baff]">{fix}</button>
          </>
        )}
      </div>
    </div>
  )
}

export function SectionHead({ id, idx, title, sub, right }: { id?: string; idx: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div id={id} className="flex scroll-mt-32 items-end gap-3">
      <span className="font-mono text-[11px] text-slate-600">{idx}</span>
      <h2 className="text-[15px] font-semibold text-slate-100">{title}</h2>
      {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
  )
}

export function Modal({ title, tone = "primary", children, onClose, footer, width = 520 }: {
  title: string; tone?: Tone; children: ReactNode; onClose: () => void; footer: ReactNode; width?: number
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title} style={{ width, maxWidth: "100%" }} className="flex max-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0f19] shadow-[0_24px_80px_rgba(0,0,0,.6)]">
        <div className="h-[3px] shrink-0" style={{ background: C[tone] }} />
        <div className="shrink-0 px-6 pb-2 pt-5 text-[16px] font-semibold text-slate-100">{title}</div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 text-[13px] text-slate-300">{children}</div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-white/[0.06] bg-white/[0.015] px-6 py-3.5">{footer}</div>
      </div>
    </div>
  )
}

/** 点击弹出的小浮层：点击触发、Esc / 点外部关闭、关闭后焦点回到触发器；fixed 定位避开裁剪 */
export function Pop({ trigger, children, width = 280, label }: {
  trigger: (p: { onClick: (e: React.MouseEvent) => void; open: boolean; ref: React.RefObject<HTMLElement | null> }) => ReactNode
  children: ReactNode; width?: number; label: string
}) {
  const anchor = useRef<HTMLElement | null>(null)
  const pop = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (!r) return
      const h = pop.current?.offsetHeight ?? 160
      const below = r.bottom + 6
      const top = below + h > window.innerHeight - 8 ? Math.max(8, r.top - 6 - h) : below
      setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), top })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true) }
  }, [open, width])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); anchor.current?.focus() } }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (anchor.current?.contains(t) || pop.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown) }
  }, [open])
  return (
    <>
      {trigger({ onClick: (e) => { e.stopPropagation(); setOpen((o) => !o) }, open, ref: anchor })}
      {open && createPortal(
        <div ref={pop} role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()} className="fixed z-[80] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0a0d14] p-3 text-[12px] text-slate-300 shadow-2xl" style={{ left: pos?.left ?? -9999, top: pos?.top ?? 0, width, maxWidth: "calc(100vw - 16px)", maxHeight: "calc(100vh - 16px)" }}>
          {children}
        </div>,
        document.getElementById("live-cockpit") ?? document.body,
      )}
    </>
  )
}

export const btn = {
  primary: "rounded-lg bg-[#91baff] px-4 py-2 text-[13px] font-semibold text-[#0b0d16] hover:bg-[#a6c7ff] disabled:cursor-not-allowed disabled:opacity-30",
  outline: "rounded-lg border border-[#91baff]/50 px-3.5 py-1.5 text-[12px] font-medium text-[#91baff] hover:bg-[#91baff]/10 disabled:opacity-30",
  neutral: "rounded-lg border border-white/[0.1] bg-white/[0.02] px-3.5 py-1.5 text-[12px] font-medium text-slate-300 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30",
  danger: "rounded-lg border border-[#ff8aa1]/50 px-3.5 py-1.5 text-[12px] font-medium text-[#ff8aa1] hover:bg-[#ff8aa1]/10 disabled:cursor-not-allowed disabled:opacity-30",
}

export const card = "rounded-xl border border-white/[0.06] bg-[#0b0e17]"
