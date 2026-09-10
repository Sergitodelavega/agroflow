import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
export type AuthRole = "producteur" | "transporteur" | "operateur";

export interface DemoAccount {
  role: AuthRole;
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: Record<AuthRole, DemoAccount> = {
  producteur: {
    role: "producteur",
    email: "adjovi@seme.coop",
    password: "demo",
  },
  transporteur: {
    role: "transporteur",
    email: "karim@borgou-express.bj",
    password: "demo",
  },
  operateur: {
    role: "operateur",
    email: "rachid@agroflow.bj",
    password: "demo",
  },
};

export const AUTH_ROLES: AuthRole[] = ["producteur", "transporteur", "operateur"];

interface Session {
  role: AuthRole;
}

interface AuthValue {
  session: Session | null;
  login: (role: AuthRole, email: string, password: string) => boolean;
  logout: () => void;
}

const KEY = "agroflow.session";

const globalAuth = globalThis as unknown as {
  __agroflowAuthContext?: React.Context<AuthValue | null>;
};
const AuthContext =
  globalAuth.__agroflowAuthContext ??
  (globalAuth.__agroflowAuthContext = createContext<AuthValue | null>(null));

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed.role && parsed.role in DEMO_ACCOUNTS) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  useEffect(() => {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  }, [session]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      login: (role, email, password) => {
        const account = DEMO_ACCOUNTS[role];
        const ok =
          email.trim().toLowerCase() === account.email &&
          password === account.password;
        if (ok) setSession({ role });
        return ok;
      },
      logout: () => setSession(null),
    }),
    [session],
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
