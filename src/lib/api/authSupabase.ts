import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { isDemoEmail, normalizeEmail, type AuthRole } from "../accounts";
import { supabase } from "../supabase";
import { createLocalAuthRepository } from "./authLocal";
import {
  AuthError,
  assertSignUpInput,
  isValidEmail,
  type AccountSession,
  type AuthRepository,
  type SignUpInput,
  type SignUpOutcome,
} from "./authTypes";

const ROLES: AuthRole[] = ["producteur", "transporteur", "operateur"];

/** Supabase répond en anglais : on retraduit les cas courants pour une UI française. */
function signUpFailure(message: string): AuthError {
  if (/already|exist|registered/i.test(message)) {
    return new AuthError(
      "email_taken",
      "Un compte existe déjà avec cette adresse. Connectez-vous.",
    );
  }
  if (/email/i.test(message) && /invalid/i.test(message)) {
    return new AuthError(
      "invalid_input",
      "Cette adresse e-mail est refusée par le service d'authentification. Essayez une autre adresse.",
    );
  }
  if (/password/i.test(message)) {
    return new AuthError(
      "invalid_input",
      "Ce mot de passe est refusé. Choisissez-en un plus long ou plus varié.",
    );
  }
  if (/rate limit|too many/i.test(message)) {
    return new AuthError(
      "unavailable",
      "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
    );
  }
  return new AuthError("invalid_input", "L'inscription a échoué. Vérifiez vos informations.");
}

function client(): SupabaseClient {
  if (!supabase) {
    throw new AuthError("unavailable", "Le service d'authentification n'est pas joignable.");
  }
  return supabase;
}

function readRole(value: unknown): AuthRole {
  return ROLES.includes(value as AuthRole) ? (value as AuthRole) : "producteur";
}

function sessionFromUser(user: User): AccountSession {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = normalizeEmail(user.email ?? "");
  const name = typeof meta.display_name === "string" && meta.display_name.trim()
    ? meta.display_name.trim()
    : email;
  const org = typeof meta.org === "string" && meta.org.trim() ? meta.org.trim() : name;
  return {
    userId: user.id,
    email,
    role: readRole(meta.role),
    name,
    org,
    demo: isDemoEmail(email),
  };
}

/**
 * `profiles` fait foi quand la table est en place (voir docs/BACKEND.md) ;
 * sinon on garde les métadonnées posées à l'inscription.
 */
async function withProfile(session: AccountSession): Promise<AccountSession> {
  try {
    const { data, error } = await client()
      .from("profiles")
      .select("role, display_name, org")
      .eq("id", session.userId)
      .maybeSingle();
    if (error || !data) return session;
    const row = data as { role?: unknown; display_name?: unknown; org?: unknown };
    return {
      ...session,
      role: readRole(row.role ?? session.role),
      name: typeof row.display_name === "string" && row.display_name ? row.display_name : session.name,
      org: typeof row.org === "string" && row.org ? row.org : session.org,
    };
  } catch {
    return session;
  }
}

function fromSupabaseSession(session: Session | null): AccountSession | null {
  return session?.user ? sessionFromUser(session.user) : null;
}

export function createSupabaseAuthRepository(): AuthRepository {
  // Filet de sécurité : les comptes de démo restent utilisables même si le
  // projet Supabase branché ne les contient pas (voir supabase/seed.sql).
  const demoFallback = createLocalAuthRepository();

  return {
    backend: "supabase",
    // Supabase envoie un vrai e-mail : aucun code n'est affiché dans l'interface.
    showsDevCode: false,

    async getSession(): Promise<AccountSession | null> {
      const { data } = await client().auth.getSession();
      const mapped = fromSupabaseSession(data.session);
      if (mapped) return withProfile(mapped);
      const local = await demoFallback.getSession();
      return local?.demo ? local : null;
    },

    async signUp(input: SignUpInput): Promise<SignUpOutcome> {
      assertSignUpInput(input);
      const email = normalizeEmail(input.email);
      const name = input.name.trim();
      const { data, error } = await client().auth.signUp({
        email,
        password: input.password,
        options: {
          data: { role: input.role, display_name: name, org: input.org.trim() || name },
        },
      });
      if (error) throw signUpFailure(error.message);
      // Confirmation d'e-mail désactivée côté projet : la session est déjà ouverte.
      const opened = fromSupabaseSession(data.session);
      if (opened) return { status: "session", session: await withProfile(opened) };
      return { status: "verification", email, devCode: null };
    },

    async verify(email: string, code: string): Promise<AccountSession> {
      const normalized = normalizeEmail(email);
      const token = code.trim();
      const auth = client().auth;
      let result = await auth.verifyOtp({ email: normalized, token, type: "signup" });
      if (result.error) {
        // Selon la configuration du projet, le jeton de confirmation est de type "email".
        result = await auth.verifyOtp({ email: normalized, token, type: "email" });
      }
      if (result.error || !result.data.session) {
        throw new AuthError("invalid_code", "Code incorrect ou expiré. Demandez-en un nouveau.");
      }
      return withProfile(sessionFromUser(result.data.session.user));
    },

    async resendCode(email: string): Promise<{ devCode: string | null }> {
      const { error } = await client().auth.resend({
        type: "signup",
        email: normalizeEmail(email),
      });
      if (error) {
        throw new AuthError(
          "unavailable",
          "Impossible d'envoyer un nouveau code pour le moment. Réessayez dans quelques minutes.",
        );
      }
      return { devCode: null };
    },

    async signIn(email: string, password: string): Promise<AccountSession> {
      if (!isValidEmail(email)) {
        throw new AuthError("invalid_input", "Saisissez une adresse e-mail valide.");
      }
      const normalized = normalizeEmail(email);
      const { data, error } = await client().auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (error || !data.session) {
        if (isDemoEmail(normalized)) return demoFallback.signIn(normalized, password);
        const unverified = /confirm/i.test(error?.message ?? "");
        throw new AuthError(
          unverified ? "unverified" : "invalid_credentials",
          unverified
            ? "Ce compte n'est pas encore vérifié."
            : "Adresse e-mail ou mot de passe incorrect.",
        );
      }
      return withProfile(sessionFromUser(data.session.user));
    },

    async signOut(): Promise<void> {
      await demoFallback.signOut();
      await client().auth.signOut();
    },
  };
}
