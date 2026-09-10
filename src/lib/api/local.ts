import type { AppState } from "../types";
import { createSeed } from "../seed";
import { DEMO_WORKSPACE, emptyState, type DataRepository, type Workspace } from "./types";

/** Clé historique de l'espace de démo — conservée pour ne pas perdre les états déjà stockés. */
export const LOCAL_STATE_KEY = "agroflow.state.v5";

function storageKey(workspace: Workspace): string {
  return workspace.key === DEMO_WORKSPACE.key
    ? LOCAL_STATE_KEY
    : `${LOCAL_STATE_KEY}.${workspace.key}`;
}

/** État de départ : le seed pour la démo, un espace vide pour un compte créé. */
export function initialState(workspace: Workspace): AppState {
  return workspace.seeded ? createSeed() : emptyState();
}

export function loadLocalState(workspace: Workspace): AppState {
  try {
    const raw = localStorage.getItem(storageKey(workspace));
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // ignore corrupted storage
  }
  return initialState(workspace);
}

export function saveLocalState(workspace: Workspace, state: AppState): void {
  try {
    localStorage.setItem(storageKey(workspace), JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function createLocalRepository(): DataRepository {
  return {
    backend: "local",
    load: loadLocalState,
    save: saveLocalState,
  };
}
