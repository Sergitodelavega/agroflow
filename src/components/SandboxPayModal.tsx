import { useEffect, useId, useRef, useState } from "react";
import { Banknote, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui";
import { formatFcfa } from "../lib/savings";
import { useKkiapay } from "../lib/kkiapay";
import {
  findPaymentForOperation,
  getKkiapayPublicKey,
  isKkiapaySandbox,
  isPaymentsSandboxEnabled,
  recordPayment,
  type PaymentProvider,
} from "../lib/payments";

export function SandboxSharePay({
  operationId,
  lotIds,
  amountFcfa,
  payerOrg,
  payerName,
  corridor,
}: {
  operationId: string;
  lotIds: string[];
  amountFcfa: number;
  payerOrg: string;
  payerName: string;
  corridor: string;
}) {
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(() => findPaymentForOperation(operationId, payerOrg));

  if (!isPaymentsSandboxEnabled() || amountFcfa <= 0) return null;

  if (paid) {
    return (
      <div className="rounded-[16px] border border-border bg-panel px-4 py-3">
        <p className="text-[14px] font-medium text-foreground">Paiement test (sandbox)</p>
        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted">
          <CheckCircle2 className="size-4 text-foreground" />
          Part de {formatFcfa(paid.amountFcfa)} enregistrée
          {paid.transactionId ? ` · ${paid.transactionId}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Banknote className="size-4" />
        Payer ma part · {formatFcfa(amountFcfa)}
      </Button>
      <SandboxPayModal
        open={open}
        operationId={operationId}
        lotIds={lotIds}
        amountFcfa={amountFcfa}
        payerOrg={payerOrg}
        payerName={payerName}
        corridor={corridor}
        onClose={() => setOpen(false)}
        onSettled={(row) => {
          if (row.status === "succeeded") setPaid(row);
        }}
      />
    </>
  );
}

function SandboxPayModal({
  open,
  operationId,
  lotIds,
  amountFcfa,
  payerOrg,
  payerName,
  corridor,
  onClose,
  onSettled,
}: {
  open: boolean;
  operationId: string;
  lotIds: string[];
  amountFcfa: number;
  payerOrg: string;
  payerName: string;
  corridor: string;
  onClose: () => void;
  onSettled: (row: ReturnType<typeof recordPayment>) => void;
}) {
  const titleId = useId();
  const publicKey = getKkiapayPublicKey();
  const hasWidgetKey = Boolean(publicKey);
  const {
    ready,
    openKkiapayWidget,
    addSuccessListener,
    addFailedListener,
    addKkiapayCloseListener,
    removeKkiapayListener,
  } = useKkiapay();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"succeeded" | "failed" | null>(null);

  const settleRef = useRef<(status: "succeeded" | "failed", provider: PaymentProvider, transactionId?: string) => void>(() => {});
  settleRef.current = (status, provider, transactionId) => {
    const row = recordPayment({
      operationId,
      lotIds,
      payerOrg,
      amountFcfa,
      status,
      provider,
      transactionId,
    });
    setBusy(false);
    setOutcome(status);
    onSettled(row);
  };

  const settle = (status: "succeeded" | "failed", provider: PaymentProvider, transactionId?: string) => {
    settleRef.current(status, provider, transactionId);
  };

  useEffect(() => {
    if (!open) return;
    addSuccessListener((data) => {
      settleRef.current("succeeded", "kkiapay", data?.transactionId);
    });
    addFailedListener((data) => {
      setError("Le paiement Kkiapay a échoué. Vous pouvez simuler le résultat ci-dessous.");
      settleRef.current("failed", "kkiapay", data?.transactionId);
    });
    addKkiapayCloseListener(() => {
      setBusy(false);
    });
    return () => {
      removeKkiapayListener("success");
      removeKkiapayListener("failed");
    };
  }, [open, addSuccessListener, addFailedListener, addKkiapayCloseListener, removeKkiapayListener]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (open) {
      setError(null);
      setOutcome(null);
    }
  }, [open]);

  if (!open) return null;

  const simulate = (status: "succeeded" | "failed") => {
    setError(null);
    settle(status, "local-sandbox", `SBOX-${Date.now().toString(36)}`);
  };

  const payWithKkiapay = () => {
    if (!publicKey) return;
    setBusy(true);
    setError(null);
    openKkiapayWidget({
      amount: amountFcfa,
      api_key: publicKey,
      sandbox: isKkiapaySandbox(),
      name: payerName,
      data: operationId,
      partnerId: operationId,
      theme: "#0d0d0d",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25"
        aria-label="Fermer le paiement test"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-[16px] border border-border bg-panel p-5"
      >
        <p className="text-[14px] font-medium uppercase tracking-[0.04em] text-faint">
          Paiement test (sandbox)
        </p>
        <h2 id={titleId} className="mt-1 text-[24px] font-medium tracking-[-0.48px] text-foreground">
          Part de transport
        </h2>
        <p className="mt-2 text-[16px] text-muted">
          Simulation uniquement — aucun argent réel n'est prélevé. Cette part correspond au
          prorata de vos lots sur la tournée partagée.
        </p>

        <dl className="mt-4 space-y-2 rounded-[16px] border border-border bg-background px-4 py-3 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-faint">Opération</dt>
            <dd className="font-mono text-foreground">{operationId}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-faint">Corridor</dt>
            <dd className="text-right text-foreground">{corridor}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-faint">Payeur</dt>
            <dd className="text-right text-foreground">{payerOrg}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-faint">Lots</dt>
            <dd className="font-mono text-right text-foreground">{lotIds.join(", ")}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2">
            <dt className="text-muted">Montant</dt>
            <dd className="tnum text-[18px] font-medium text-foreground">{formatFcfa(amountFcfa)}</dd>
          </div>
        </dl>

        {outcome === "succeeded" && (
          <p className="mt-4 flex items-center gap-2 text-[14px] text-foreground">
            <CheckCircle2 className="size-4" /> Paiement sandbox réussi.
          </p>
        )}
        {outcome === "failed" && (
          <p className="mt-4 flex items-center gap-2 text-[14px] text-alerte">
            <XCircle className="size-4" /> Paiement sandbox refusé.
          </p>
        )}
        {error && <p className="mt-4 text-[14px] text-alerte">{error}</p>}

        {outcome === null && (
          <div className="mt-5 space-y-2">
            {hasWidgetKey && (
              <Button
                variant="primary"
                className="w-full"
                disabled={busy || !ready}
                onClick={payWithKkiapay}
              >
                {busy ? "Ouverture de Kkiapay…" : "Ouvrir Kkiapay (sandbox)"}
              </Button>
            )}
            <Button variant="outline" className="w-full" disabled={busy} onClick={() => simulate("succeeded")}>
              Simuler un succès
            </Button>
            <Button variant="ghost" className="w-full" disabled={busy} onClick={() => simulate("failed")}>
              Simuler un échec
            </Button>
            {!hasWidgetKey && (
              <p className="text-[14px] text-faint">
                Pas de clé publique Kkiapay — simulation locale uniquement. Ajoutez
                VITE_KKIAPAY_PUBLIC_KEY pour ouvrir le widget via le SDK React.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            {outcome ? "Fermer" : "Annuler"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SandboxSharePay;
