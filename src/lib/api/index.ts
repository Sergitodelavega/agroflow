import { isSupabaseConfigured } from "../supabase";
import { createLocalRepository } from "./local";
import { createSupabaseRepository } from "./supabase";
import type { DataBackend, DataRepository } from "./types";

export type { DataBackend, DataRepository, Workspace } from "./types";
export { DEMO_WORKSPACE, emptyState, workspaceFor } from "./types";
export { LOCAL_STATE_KEY, initialState } from "./local";
export { getAuthRepository } from "./auth";

/**
 * Always localStorage today.
 * When a real migration lands, flip this to return createSupabaseRepository()
 * only if `isSupabaseConfigured` is true — never break the demo if env is empty.
 */
export function getRepository(): DataRepository {
  if (isSupabaseConfigured) {
    // Client is ready; persistence is still local until the mapper is implemented.
    return createSupabaseRepository();
  }
  return createLocalRepository();
}

export function getDataBackend(): DataBackend {
  return getRepository().backend;
}
