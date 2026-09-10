import type { AuthRole } from "../accounts";
import type { DataBackend } from "./types";

/** Session applicative — ce que le reste de l'app connaît d'un utilisateur connecté. */
export interface AccountSession {
  userId: string;
  email: string;
  role: AuthRole;
  name: string;
  org: string;
  /** Un compte de démo hérite des données de seed ; un compte créé démarre vide. */
  demo: boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  org: string;
  role: AuthRole;
}

/**
 * Après une inscription : soit le backend demande une vérification,
 * soit il ouvre directement la session (confirmation d'e-mail désactivée côté Supabase).
 */
export type SignUpOutcome =
  | { status: "verification"; email: string; devCode: string | null }
  | { status: "session"; session: AccountSession };

export type AuthErrorCode =
  | "invalid_input"
  | "email_taken"
  | "invalid_credentials"
  | "unverified"
  | "invalid_code"
  | "unavailable";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export interface AuthRepository {
  readonly backend: DataBackend;
  /** Vrai quand le code de vérification est affiché à l'écran faute d'envoi d'e-mail réel. */
  readonly showsDevCode: boolean;
  getSession(): Promise<AccountSession | null>;
  signUp(input: SignUpInput): Promise<SignUpOutcome>;
  verify(email: string, code: string): Promise<AccountSession>;
  resendCode(email: string): Promise<{ devCode: string | null }>;
  signIn(email: string, password: string): Promise<AccountSession>;
  signOut(): Promise<void>;
}

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Validation partagée par les deux backends, pour un message d'erreur identique. */
export function assertSignUpInput(input: SignUpInput): void {
  if (!isValidEmail(input.email)) {
    throw new AuthError("invalid_input", "Saisissez une adresse e-mail valide.");
  }
  if (input.password.length < PASSWORD_MIN_LENGTH) {
    throw new AuthError(
      "invalid_input",
      `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    );
  }
  if (!input.name.trim()) {
    throw new AuthError("invalid_input", "Indiquez le nom du responsable du compte.");
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `usr-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
