import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEMO_ACCOUNTS, ROLE_LABELS } from "./accounts";
import { useAuth } from "./auth";
import type { Lot, Operation } from "./types";

export type Role = "producteur" | "transporteur" | "acheteur" | "operateur";

export type NavKey = "dashboard" | "operations" | "lots" | "creer" | "compatibilite" | "carte";

export interface RoleProfile {
  role: Role;
  label: string;
  name: string;
  org: string;
}

/** Profils de démonstration — un compte créé apporte ses propres nom et organisation. */
export const PROFILES: Record<Role, RoleProfile> = {
  producteur: {
    role: "producteur",
    label: ROLE_LABELS.producteur,
    name: DEMO_ACCOUNTS.producteur.name,
    org: DEMO_ACCOUNTS.producteur.org,
  },
  transporteur: {
    role: "transporteur",
    label: ROLE_LABELS.transporteur,
    name: DEMO_ACCOUNTS.transporteur.name,
    org: DEMO_ACCOUNTS.transporteur.org,
  },
  acheteur: {
    role: "acheteur",
    label: "Acheteur",
    name: "Fatou D.",
    org: "Grossiste Dantokpa",
  },
  operateur: {
    role: "operateur",
    label: ROLE_LABELS.operateur,
    name: DEMO_ACCOUNTS.operateur.name,
    org: DEMO_ACCOUNTS.operateur.org,
  },
};

export interface Permissions {
  nav: NavKey[];
  home: string;
  canCreateLot: boolean;
  canGroup: boolean; // créer une opération à partir d'un regroupement (opérateur)
  canLogEvent: boolean;
  canManageOperation: boolean; // piloter le statut d'une opération (transport, livraison)
  canConfirmReception: boolean; // confirmer la réception d'un lot (acheteur)
  scopeOwn: boolean; // limite les lots à ceux de son organisation
}

/** Lots visibles pour le rôle : toute la plateforme, ou seulement ceux de l'organisation. */
export function visibleLots(lots: Lot[], perms: Permissions, org: string): Lot[] {
  return perms.scopeOwn ? lots.filter((l) => l.producer === org) : lots;
}

/** Opérations qui touchent au moins un des lots fournis (déjà scopés). */
export function visibleOperations(operations: Operation[], lots: Lot[]): Operation[] {
  const ids = new Set(lots.map((l) => l.id));
  return operations.filter((op) => op.lotIds.some((id) => ids.has(id)));
}

/** Lots déjà placés dans une opération — ce que le transporteur a à charger. */
export function lotsOnOperations(lots: Lot[]): Lot[] {
  return lots.filter((l) => Boolean(l.operationId));
}

/** Opérations visibles : le transporteur ne voit que celles qui lui sont assignées. */
export function operationsForViewer(
  operations: Operation[],
  lots: Lot[],
  role: Role,
  org: string,
  perms: Permissions,
): Operation[] {
  if (role === "transporteur") {
    return operations.filter((op) => op.carrier === org);
  }
  return visibleOperations(operations, visibleLots(lots, perms, org));
}

/** Lots visibles, limités aux tournées assignées pour le transporteur. */
export function lotsForViewer(
  lots: Lot[],
  operations: Operation[],
  role: Role,
  org: string,
  perms: Permissions,
): Lot[] {
  const scoped = visibleLots(lots, perms, org);
  if (role === "transporteur") {
    const mine = new Set(
      operations.filter((op) => op.carrier === org).map((op) => op.id),
    );
    return scoped.filter((l) => l.operationId && mine.has(l.operationId));
  }
  return scoped;
}

/** Un lot n'est plus modifiable ni annulable une fois regroupé par l'opérateur. */
export function lotIsOpen(lot: Lot): boolean {
  return lot.status === "enregistre" && !lot.operationId;
}

/** Producteur : ses lots ouverts. Opérateur : tout lot encore ouvert. */
export function canEditLot(lot: Lot, perms: Permissions, org: string): boolean {
  if (!lotIsOpen(lot)) return false;
  if (perms.scopeOwn) return perms.canCreateLot && lot.producer === org;
  return perms.canGroup;
}

export const PERMISSIONS: Record<Role, Permissions> = {
  producteur: {
    nav: ["dashboard", "lots", "creer", "compatibilite", "carte"],
    home: "/",
    canCreateLot: true,
    canGroup: false,
    canLogEvent: false,
    canManageOperation: false,
    canConfirmReception: false,
    scopeOwn: true,
  },
  transporteur: {
    nav: ["dashboard", "operations", "lots", "carte"],
    home: "/",
    canCreateLot: false,
    canGroup: false,
    canLogEvent: true,
    canManageOperation: true,
    canConfirmReception: false,
    scopeOwn: false,
  },
  acheteur: {
    nav: ["lots", "carte"],
    home: "/lots",
    canCreateLot: false,
    canGroup: false,
    canLogEvent: false,
    canManageOperation: false,
    canConfirmReception: true,
    scopeOwn: false,
  },
  operateur: {
    nav: ["dashboard", "operations", "lots", "compatibilite", "carte"],
    home: "/",
    canCreateLot: false,
    canGroup: true,
    canLogEvent: false,
    canManageOperation: false,
    canConfirmReception: false,
    scopeOwn: false,
  },
};

interface RoleValue {
  role: Role;
  profile: RoleProfile;
  perms: Permissions;
  authenticated: boolean;
  /** Vrai pour les trois comptes de démonstration, qui gardent les données de seed. */
  demo: boolean;
}

const GUEST_PERMS: Permissions = {
  nav: [],
  home: "/",
  canCreateLot: false,
  canGroup: false,
  canLogEvent: false,
  canManageOperation: false,
  canConfirmReception: false,
  scopeOwn: false,
};

const GUEST_PROFILE: RoleProfile = {
  role: "acheteur",
  label: "Visiteur",
  name: "Visiteur",
  org: "Consultation publique",
};

// Stable context instance across Vite HMR reloads (see store.tsx).
const globalRole = globalThis as unknown as {
  __agroflowRoleContext?: React.Context<RoleValue | null>;
};
const RoleContext =
  globalRole.__agroflowRoleContext ??
  (globalRole.__agroflowRoleContext = createContext<RoleValue | null>(null));

export function RoleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  const value = useMemo<RoleValue>(
    () =>
      session
        ? {
            role: session.role,
            // Le nom et l'organisation viennent du compte, pas du profil de démo :
            // c'est ce qui isole les lots d'un compte fraîchement créé.
            profile: {
              role: session.role,
              label: ROLE_LABELS[session.role],
              name: session.name,
              org: session.org,
            },
            perms: PERMISSIONS[session.role],
            authenticated: true,
            demo: session.demo,
          }
        : {
            role: GUEST_PROFILE.role,
            profile: GUEST_PROFILE,
            perms: GUEST_PERMS,
            authenticated: false,
            demo: false,
          },
    [session],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
