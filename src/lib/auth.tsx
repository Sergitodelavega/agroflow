import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAuthRepository, type AccountSession, type SignUpInput, type SignUpOutcome } from "./api/auth";
import type { DataBackend } from "./api/types";

export {
  AUTH_ROLES,
  DEMO_ACCOUNTS,
  ROLE_LABELS,
  type AuthRole,
  type DemoAccount,
} from "./accounts";
export { AuthError, PASSWORD_MIN_LENGTH, type AccountSession } from "./api/auth";

interface AuthValue {
  session: AccountSession | null;
  /** Faux tant que la session persistée n'a pas été relue (Supabase répond en asynchrone). */
  ready: boolean;
  backend: DataBackend;
  /** Le code de vérification est affiché à l'écran quand aucun e-mail n'est réellement envoyé. */
  showsDevCode: boolean;
  signUp: (input: SignUpInput) => Promise<SignUpOutcome>;
  verify: (email: string, code: string) => Promise<AccountSession>;
  resendCode: (email: string) => Promise<{ devCode: string | null }>;
  signIn: (email: string, password: string) => Promise<AccountSession>;
  signOut: () => Promise<void>;
}

// Keep a single Context instance across Vite HMR module reloads (see store.tsx).
const globalAuth = globalThis as unknown as {
  __agroflowAuthContext?: React.Context<AuthValue | null>;
};
const AuthContext =
  globalAuth.__agroflowAuthContext ??
  (globalAuth.__agroflowAuthContext = createContext<AuthValue | null>(null));

const repo = getAuthRepository();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccountSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    repo
      .getSession()
      .then((restored) => {
        if (!cancelled) setSession(restored);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const outcome = await repo.signUp(input);
    if (outcome.status === "session") setSession(outcome.session);
    return outcome;
  }, []);

  const verify = useCallback(async (email: string, code: string) => {
    const next = await repo.verify(email, code);
    setSession(next);
    return next;
  }, []);

  const resendCode = useCallback((email: string) => repo.resendCode(email), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await repo.signIn(email, password);
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await repo.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      ready,
      backend: repo.backend,
      showsDevCode: repo.showsDevCode,
      signUp,
      verify,
      resendCode,
      signIn,
      signOut,
    }),
    [session, ready, signUp, verify, resendCode, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useOptionalAuth(): AuthValue | null {
  return useContext(AuthContext);
}
