// Minimal copy of PaperBuilder frontend/src/ui/primitives.tsx.
// Kept the four shared primitives the carrier consumes (Metric, UiStatusBadge,
// UiAction, UiLineage) plus the local `classes` helper.
// Removed UiTable, UiDialog, UiDialogLoading and UiDrawer, together with their
// ../modal-focus imports; no other behaviour was changed.
// P8 N3: removed the async-state panel (no usage point anywhere in the carrier
// tree) and the contract symbols it alone consumed.
// The value-tone prop stays: `app/components/simulation-board-panels.tsx:21`
// still passes it (that file is not part of this import), so removing it would
// make this copy diverge from its consumer without a tsc/build run to prove it.
// P8 is the batched repair of the C11 leftovers.
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { type LineageIdentity } from "./ui-contract";
import "./tokens-base.css";
import "./primitives.css";

export type UiTone = "neutral" | "success" | "warning" | "danger" | "smart";

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type MetricTone = "pos" | "neg" | "na";

export function Metric({
  label,
  value,
  valueTone,
  description,
  className,
  ariaLabel,
  bottomLabel,
  bottom,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  valueTone?: MetricTone;
  description?: ReactNode;
  className?: string;
  ariaLabel?: string;
  bottomLabel?: ReactNode;
  bottom?: ReactNode;
  tone?: MetricTone;
}) {
  const hasBottom = bottomLabel !== undefined && bottomLabel !== null || bottom !== undefined && bottom !== null;
  const valueTitle = typeof value === "string" ? value : undefined;
  const bottomTitle = typeof bottom === "string" ? bottom : undefined;
  return <div className={classes("pb-ui-metric", className)} role="group" aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}>
    <span className="pb-ui-metric-label">{label}</span>
    <strong className={classes("pb-ui-metric-value", valueTone && `is-${valueTone}`)} title={valueTitle}>{value}</strong>
    {description && <span className="pb-ui-metric-description">{description}</span>}
    {hasBottom && <span className="pb-ui-metric-bottom-label">{bottomLabel}</span>}
    {hasBottom && <strong className={classes("pb-ui-metric-bottom-value", tone && `is-${tone}`)} title={bottomTitle}>{bottom}</strong>}
  </div>;
}

export function UiStatusBadge({
  tone = "neutral",
  className,
  title,
  children,
  ...props
}: {
  tone?: UiTone;
  className?: string;
  title?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className" | "title">) {
  return <span {...props} className={classes("pb-ui-status-badge", `pb-ui-status-badge-${tone}`, className)} title={title}>{children}</span>;
}

export function UiAction({
  className,
  type,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  className?: string;
}) {
  return <button {...props} type={type ?? "button"} className={classes("pb-ui-action", className)} />;
}

export function UiLineage({ identity, className, variant = "default" }: { identity: LineageIdentity; className?: string; variant?: "default" | "market" }) {
  const values = [
    ["策略版本", identity.strategy_version_id],
    ["task_id", identity.task_id],
    ["run_id", identity.run_id],
    ...(variant === "market" ? [
      ["runspec_hash", identity.runspec_hash],
      ["source", identity.source_identity],
      ["market_segment_id", identity.market_segment_id],
    ] : []),
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim() !== "");
  return <span className={classes("pb-ui-lineage", className)} role="group" aria-label="当前 lineage" data-lineage-variant={variant}>
    {values.map(([label, value]) => <span key={label} className="pb-ui-lineage-item" role="group" title={value} aria-label={`${label} ${value}`}><b>{label}</b><span>{value}</span></span>)}
  </span>;
}
