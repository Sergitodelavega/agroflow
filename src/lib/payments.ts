export const PAYMENTS_STORAGE_KEY = "agroflow.payments.v1";

export type PaymentStatus = "pending" | "succeeded" | "failed";
export type PaymentProvider = "kkiapay" | "local-sandbox";

export interface SandboxPayment {
  id: string;
  operationId: string;
  lotIds: string[];
  payerOrg: string;
  amountFcfa: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  transactionId?: string;
  createdAt: string;
}

function envFlag(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

/** Shown only when VITE_PAYMENTS=sandbox — existing demo flows stay unchanged. */
export function isPaymentsSandboxEnabled(): boolean {
  return envFlag("VITE_PAYMENTS").toLowerCase() === "sandbox";
}

export function getKkiapayPublicKey(): string {
  return envFlag("VITE_KKIAPAY_PUBLIC_KEY");
}

export function isKkiapaySandbox(): boolean {
  const raw = envFlag("VITE_KKIAPAY_SANDBOX");
  return raw === "" || raw === "true" || raw === "1";
}

export function loadPayments(): SandboxPayment[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SandboxPayment[];
  } catch {
    // ignore
  }
  return [];
}

function savePayments(rows: SandboxPayment[]): void {
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore quota
  }
}

export function findPaymentForOperation(
  operationId: string,
  payerOrg: string,
): SandboxPayment | undefined {
  return loadPayments().find(
    (row) => row.operationId === operationId && row.payerOrg === payerOrg && row.status === "succeeded",
  );
}

export function clearPayments(): void {
  try {
    localStorage.removeItem(PAYMENTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function recordPayment(input: Omit<SandboxPayment, "id" | "createdAt">): SandboxPayment {
  const row: SandboxPayment = {
    ...input,
    id: `PAY-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  };
  savePayments([row, ...loadPayments()]);
  return row;
}
