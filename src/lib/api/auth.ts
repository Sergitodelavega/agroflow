import { isSupabaseConfigured } from "../supabase";
import { createLocalAuthRepository } from "./authLocal";
import { createSupabaseAuthRepository } from "./authSupabase";
import type { AuthRepository } from "./authTypes";

export {
  AuthError,
  PASSWORD_MIN_LENGTH,
  type AccountSession,
  type AuthErrorCode,
  type AuthRepository,
  type SignUpInput,
  type SignUpOutcome,
} from "./authTypes";

let cached: AuthRepository | null = null;

/**
 * Supabase Auth dès que l'URL et la clé anon sont présentes, sinon un équivalent
 * local pour que la démonstration tourne sans backend.
 */
export function getAuthRepository(): AuthRepository {
  if (!cached) {
    cached = isSupabaseConfigured
      ? createSupabaseAuthRepository()
      : createLocalAuthRepository();
  }
  return cached;
}
