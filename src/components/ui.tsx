import { useEffect, useId, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[16px] border border-border bg-panel ${className}`}
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
        <h2 className="text-[15px] font-medium text-foreground">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-[14px] text-faint">{hint}</p>}
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
    <div className="rounded-[16px] border border-border bg-panel px-5 py-4">
      <div className="text-[14px] text-faint">
        {label}
      </div>
      <div className={`tnum mt-1.5 text-[24px] font-medium tracking-[-0.48px] ${colors[accent]}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[14px] text-muted">{sub}</div>}
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
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] px-4 py-2 text-[16px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-foreground text-background hover:bg-foreground/90",
    outline:
      "border border-border-strong bg-panel text-foreground hover:border-foreground/40",
    ghost: "text-muted hover:text-foreground hover:bg-background",
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
      <span className="mb-1.5 block text-[14px] font-medium text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-[16px] border border-border-strong bg-panel px-3 py-2.5 text-[16px] text-foreground placeholder:text-faint focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputCls} ${props.className || ""}`} />
  );
}

/**
 * État vide : un titre, une phrase, et l'action qui débloque la suite.
 * Sans `title` ni `action`, on garde la simple ligne d'explication.
 */
export function EmptyState({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      {title && (
        <h3 className="text-[16px] font-medium tracking-[-0.18px] text-foreground">{title}</h3>
      )}
      <p className={`max-w-[46ch] text-sm text-faint ${title ? "mt-2" : ""}`}>{children}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Lien mis en avant dans un état vide — même dessin que le bouton primaire. */
export function EmptyStateLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-foreground px-4 py-2 text-[16px] font-medium text-background transition-colors duration-200 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
    >
      {children}
    </Link>
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
        className="relative z-10 w-full max-w-md rounded-[16px] border border-border bg-panel p-5"
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
