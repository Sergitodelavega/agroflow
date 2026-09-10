import {
  DEMO_ACCOUNT_LIST,
  isDemoEmail,
  normalizeEmail,
  type AuthRole,
} from "../accounts";
import {
  AuthError,
  assertSignUpInput,
  isValidEmail,
  newId,
  type AccountSession,
  type AuthRepository,
  type SignUpInput,
  type SignUpOutcome,
} from "./authTypes";

const ACCOUNTS_KEY = "agroflow.accounts.v1";
const SESSION_KEY = "agroflow.session.v2";
const CODE_TTL_MS = 15 * 60 * 1000;

interface StoredAccount {
  userId: string;
  email: string;
  role: AuthRole;
  name: string;
  org: string;
  salt: string;
  passwordHash: string;
  verified: boolean;
  code: string | null;
  codeExpiresAt: number | null;
}

type AccountMap = Record<string, StoredAccount>;

function readAccounts(): AccountMap {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw) as AccountMap;
  } catch {
    // stockage corrompu : on repart des comptes de démo
  }
  return {};
}

function writeAccounts(accounts: AccountMap): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // quota plein : la session en mémoire reste utilisable
  }
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Empreinte salée du mot de passe : la démo locale ne stocke pas de mot de passe en clair.
 * Ce n'est pas un remplacement d'un vrai backend — Supabase Auth prend le relais dès qu'il est configuré.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `agroflow:${salt}:${password}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Contexte non sécurisé (pas de WebCrypto) : repli lisible, démo uniquement.
  let acc = 0;
  for (let i = 0; i < input.length; i += 1) acc = (acc * 31 + input.charCodeAt(i)) >>> 0;
  return `fallback-${acc.toString(16)}`;
}

function newCode(): string {
  const bytes = new Uint32Array(1);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 1_000_000);
  }
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

function toSession(account: StoredAccount): AccountSession {
  return {
    userId: account.userId,
    email: account.email,
    role: account.role,
    name: account.name,
    org: account.org,
    demo: isDemoEmail(account.email),
  };
}

/** Les trois comptes de démo sont recréés à la volée s'ils manquent. */
async function ensureDemoAccounts(accounts: AccountMap): Promise<AccountMap> {
  let changed = false;
  for (const demo of DEMO_ACCOUNT_LIST) {
    if (accounts[demo.email]) continue;
    const salt = randomSalt();
    accounts[demo.email] = {
      userId: `demo-${demo.role}`,
      email: demo.email,
      role: demo.role,
      name: demo.name,
      org: demo.org,
      salt,
      passwordHash: await hashPassword(demo.password, salt),
      verified: true,
      code: null,
      codeExpiresAt: null,
    };
    changed = true;
  }
  if (changed) writeAccounts(accounts);
  return accounts;
}

async function loadAccounts(): Promise<AccountMap> {
  return ensureDemoAccounts(readAccounts());
}

function persistSession(session: AccountSession | null): void {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: session.userId, email: session.email }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export function createLocalAuthRepository(): AuthRepository {
  return {
    backend: "local",
    showsDevCode: true,

    async getSession(): Promise<AccountSession | null> {
      let stored: { email?: string } | null = null;
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        stored = raw ? (JSON.parse(raw) as { email?: string }) : null;
      } catch {
        stored = null;
      }
      if (!stored?.email) return null;
      const accounts = await loadAccounts();
      const account = accounts[normalizeEmail(stored.email)];
      if (!account || !account.verified) {
        persistSession(null);
        return null;
      }
      return toSession(account);
    },

    async signUp(input: SignUpInput): Promise<SignUpOutcome> {
      assertSignUpInput(input);
      const email = normalizeEmail(input.email);
      const accounts = await loadAccounts();
      const existing = accounts[email];
      if (existing?.verified) {
        throw new AuthError(
          "email_taken",
          "Un compte existe déjà avec cette adresse. Connectez-vous.",
        );
      }

      const salt = randomSalt();
      const code = newCode();
      accounts[email] = {
        // Une inscription reprise après abandon garde son identifiant.
        userId: existing?.userId ?? newId(),
        email,
        role: input.role,
        name: input.name.trim(),
        org: input.org.trim() || input.name.trim(),
        salt,
        passwordHash: await hashPassword(input.password, salt),
        verified: false,
        code,
        codeExpiresAt: Date.now() + CODE_TTL_MS,
      };
      writeAccounts(accounts);
      return { status: "verification", email, devCode: code };
    },

    async verify(email: string, code: string): Promise<AccountSession> {
      const normalized = normalizeEmail(email);
      const accounts = await loadAccounts();
      const account = accounts[normalized];
      if (!account) {
        throw new AuthError("invalid_credentials", "Aucune inscription en attente pour cette adresse.");
      }
      if (account.verified) {
        const session = toSession(account);
        persistSession(session);
        return session;
      }
      if (!account.code || !account.codeExpiresAt || Date.now() > account.codeExpiresAt) {
        throw new AuthError("invalid_code", "Ce code a expiré. Demandez-en un nouveau.");
      }
      if (account.code !== code.trim()) {
        throw new AuthError("invalid_code", "Code incorrect. Vérifiez les six chiffres reçus.");
      }
      account.verified = true;
      account.code = null;
      account.codeExpiresAt = null;
      writeAccounts(accounts);
      const session = toSession(account);
      persistSession(session);
      return session;
    },

    async resendCode(email: string): Promise<{ devCode: string | null }> {
      const normalized = normalizeEmail(email);
      const accounts = await loadAccounts();
      const account = accounts[normalized];
      if (!account) {
        throw new AuthError("invalid_credentials", "Aucune inscription en attente pour cette adresse.");
      }
      if (account.verified) return { devCode: null };
      account.code = newCode();
      account.codeExpiresAt = Date.now() + CODE_TTL_MS;
      writeAccounts(accounts);
      return { devCode: account.code };
    },

    async signIn(email: string, password: string): Promise<AccountSession> {
      if (!isValidEmail(email)) {
        throw new AuthError("invalid_input", "Saisissez une adresse e-mail valide.");
      }
      const normalized = normalizeEmail(email);
      const accounts = await loadAccounts();
      const account = accounts[normalized];
      if (!account) {
        throw new AuthError("invalid_credentials", "Adresse e-mail ou mot de passe incorrect.");
      }
      const hash = await hashPassword(password, account.salt);
      if (hash !== account.passwordHash) {
        throw new AuthError("invalid_credentials", "Adresse e-mail ou mot de passe incorrect.");
      }
      if (!account.verified) {
        throw new AuthError("unverified", "Ce compte n'est pas encore vérifié.");
      }
      const session = toSession(account);
      persistSession(session);
      return session;
    },

    async signOut(): Promise<void> {
      persistSession(null);
    },
  };
}
