import { useEffect, useId, type ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-panel ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  action,
  hint,
}: {
  title: ReactNode;
  action?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function KPIStat({
  label,
  value,
  sub,
  accent = "foreground",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: "foreground" | "primary" | "vigilance" | "alerte" | "info";
}) {
  const colors: Record<string, string> = {
    foreground: "text-foreground",
    primary: "text-primary",
    vigilance: "text-vigilance",
    alerte: "text-alerte",
    info: "text-info",
  };
  return (
    <div className="rounded-xl border border-border bg-panel px-5 py-4">
      <div className="font-mono text-xs uppercase tracking-[0.15em] text-faint">
        {label}
      </div>
      <div className={`tnum mt-1.5 text-2xl font-semibold ${colors[accent]}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

type ButtonVariant = "primary" | "ghost" | "outline";

export function Button({
  children,
  variant = "outline",
  className = "",
  type = "button",
  ...props
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary-dim",
    outline:
      "border border-border-strong text-foreground hover:border-primary/50 hover:text-primary",
    ghost: "text-muted hover:text-foreground hover:bg-surface-2",
  };
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-faint focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputCls} ${props.className || ""}`} />
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center text-sm text-faint">{children}</div>
  );
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Retour",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25"
        aria-label="Fermer la confirmation"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-panel p-5"
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="mt-3 space-y-2 text-sm text-muted">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OperationStatusConfirm({
  open,
  status,
  lotCount,
  onConfirm,
  onClose,
}: {
  open: boolean;
  status: "en_cours" | "livree" | null;
  lotCount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const start = status === "en_cours";
  return (
    <ConfirmDialog
      open={open && status !== null}
      title={start ? "Démarrer le transport ?" : "Marquer l'opération livrée ?"}
      confirmLabel={start ? "Démarrer le transport" : "Marquer livrée"}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <p>
        {lotCount} lot{lotCount > 1 ? "s" : ""}{" "}
        {start
          ? "passent en transport. Vous pourrez déclarer un contrôle, un retard ou un incident."
          : "seront marqués livrés. L'acheteur pourra confirmer la réception."}
      </p>
    </ConfirmDialog>
  );
}
