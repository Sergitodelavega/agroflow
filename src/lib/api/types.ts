import type { AppState } from "../types";
import type { AccountSession } from "./authTypes";

export type DataBackend = "local" | "supabase";

/**
 * Espace de travail d'un compte. Les comptes de démo partagent l'espace `demo`
 * (données de seed) ; tout compte créé depuis l'inscription reçoit le sien, vide.
 */
export interface Workspace {
  key: string;
  seeded: boolean;
}

export const DEMO_WORKSPACE: Workspace = { key: "demo", seeded: true };

export function emptyState(): AppState {
  return { lots: [], operations: [] };
}

/**
 * Sans session, on lit l'espace de démo : le passeport public (`/passeport/:id`)
 * reste consultable via QR sans être connecté.
 */
export function workspaceFor(session: AccountSession | null): Workspace {
  if (!session || session.demo) return DEMO_WORKSPACE;
  return { key: `user.${session.userId}`, seeded: false };
}

/**
 * Thin persistence seam behind StoreProvider.
 * Mutations stay in the store; only load/save go through a backend.
 */
export interface DataRepository {
  readonly backend: DataBackend;
  load(workspace: Workspace): AppState;
  save(workspace: Workspace, state: AppState): void;
}
