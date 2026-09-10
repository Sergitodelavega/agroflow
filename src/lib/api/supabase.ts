import type { AppState } from "../types";
import { supabase } from "../supabase";
import type { DataRepository, Workspace } from "./types";
import { loadLocalState, saveLocalState } from "./local";

/**
 * Placeholder remote repository.
 * Reads/writes still go to localStorage until tables are migrated.
 * Intended mapping: lots, operations, lot_events, profiles — see docs/BACKEND.md.
 */
export function createSupabaseRepository(): DataRepository {
  return {
    backend: "supabase",
    load(workspace: Workspace): AppState {
      // TODO: select lots + operations (+ nested events) from Supabase, map to AppState.
      void supabase;
      return loadLocalState(workspace);
    },
    save(workspace: Workspace, state: AppState): void {
      // TODO: upsert lots / operations / events, then drop the local mirror.
      saveLocalState(workspace, state);
    },
  };
}
