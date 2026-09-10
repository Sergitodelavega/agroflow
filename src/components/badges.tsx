import type { LotStatus, OperationStatus, Vigilance } from "../lib/types";
import {
  OPERATION_STATUS_LABELS,
  STATUS_LABELS,
  VIGILANCE_LABELS,
} from "../lib/types";

const statusStyles: Record<LotStatus, string> = {
  enregistre: "border-border-strong text-muted",
  regroupe: "border-info/40 text-info",
  en_transport: "border-primary/40 text-primary",
  livre: "border-primary/50 bg-primary/10 text-primary",
};

export function StatusBadge({ status }: { status: LotStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-wide ${statusStyles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function OperationStatusBadge({ status }: { status: OperationStatus }) {
  const styles: Record<OperationStatus, string> = {
    planifiee: "border-info/40 text-info",
    en_cours: "border-primary/40 text-primary",
    livree: "border-faint text-faint",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-wide ${styles[status]}`}
    >
      {OPERATION_STATUS_LABELS[status]}
    </span>
  );
}

const vigilanceStyles: Record<Vigilance, string> = {
  ok: "border-primary/40 bg-primary/5 text-primary",
  vigilance: "border-vigilance/40 bg-vigilance/10 text-vigilance",
  alerte: "border-alerte/50 bg-alerte/10 text-alerte",
};

const vigilanceDot: Record<Vigilance, string> = {
  ok: "bg-primary",
  vigilance: "bg-vigilance",
  alerte: "bg-alerte",
};

export function VigilanceBadge({
  level,
  pulse = false,
}: {
  level: Vigilance;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-wide ${vigilanceStyles[level]}`}
    >
      <span
        className={`size-1.5 rounded-full ${vigilanceDot[level]} ${pulse && level !== "ok" ? "animate-pulse" : ""}`}
      />
      {VIGILANCE_LABELS[level]}
    </span>
  );
}
