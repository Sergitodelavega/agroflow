/**
 * Comptes de démonstration — source unique pour l'auth, les profils et le seed.
 * L'acheteur n'a pas de compte : il consulte le passeport public.
 */

export type AuthRole = "producteur" | "transporteur" | "operateur";

export const AUTH_ROLES: AuthRole[] = ["producteur", "transporteur", "operateur"];

export const ROLE_LABELS: Record<AuthRole, string> = {
  producteur: "Producteur",
  transporteur: "Transporteur",
  operateur: "Opérateur logistique",
};

export interface DemoAccount {
  role: AuthRole;
  email: string;
  /** Mot de passe public de la démonstration, pas un secret applicatif. */
  password: string;
  name: string;
  org: string;
}

export const DEMO_ACCOUNTS: Record<AuthRole, DemoAccount> = {
  producteur: {
    role: "producteur",
    email: "adjovi@seme.coop",
    password: "demo",
    name: "Adjovi H.",
    org: "Coopérative Maraîchère de Sèmè",
  },
  transporteur: {
    role: "transporteur",
    email: "karim@borgou-express.bj",
    password: "demo",
    name: "Karim B.",
    org: "Transport Borgou Express",
  },
  operateur: {
    role: "operateur",
    email: "rachid@agroflow.bj",
    password: "demo",
    name: "Rachid S.",
    org: "AgroFlow — Coordination",
  },
};

export const DEMO_ACCOUNT_LIST: DemoAccount[] = Object.values(DEMO_ACCOUNTS);

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Les comptes de démo gardent les données de seed ; tout autre compte démarre vide. */
export function isDemoEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return DEMO_ACCOUNT_LIST.some((account) => account.email === normalized);
}
