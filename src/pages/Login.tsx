import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, MailCheck, Truck, Waypoints } from "lucide-react";
import {
  AUTH_ROLES,
  AuthError,
  DEMO_ACCOUNTS,
  PASSWORD_MIN_LENGTH,
  ROLE_LABELS,
  useAuth,
  type AuthRole,
} from "../lib/auth";
import { AnimatePresence, motion } from "motion/react";
import { Field, Input } from "../components/ui";
import BrandMark from "../components/BrandMark";
import { usePageMotion } from "../components/PageTransition";

type Mode = "connexion" | "inscription" | "verification";

const ICONS: Record<AuthRole, typeof Leaf> = {
  producteur: Leaf,
  transporteur: Truck,
  operateur: Waypoints,
};

const BLURBS: Record<AuthRole, string> = {
  producteur: "Enregistrez vos lots et suivez leur regroupement.",
  transporteur: "Prenez en charge une opération et déclarez les événements de route.",
  operateur: "Regroupez les lots, assignez un transporteur et pilotez le réseau.",
};

const HEADINGS: Record<Mode, { eyebrow: string; title: string; body: string }> = {
  connexion: {
    eyebrow: "Connexion",
    title: "Accédez à l'espace de votre organisation",
    body: "Identifiez-vous avec l'adresse e-mail de votre compte AgroFlow.",
  },
  inscription: {
    eyebrow: "Inscription",
    title: "Créez votre compte AgroFlow",
    body: "Choisissez le rôle qui correspond à votre activité, puis renseignez vos informations. Un code de vérification confirmera votre adresse.",
  },
  verification: {
    eyebrow: "Vérification",
    title: "Confirmez votre adresse e-mail",
    body: "Saisissez le code à six chiffres associé à votre inscription.",
  },
};

function messageOf(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  return "Une erreur est survenue. Réessayez dans un instant.";
}

export default function Login({ initialMode = "connexion" }: { initialMode?: Mode }) {
  const { signIn, signUp, verify, resendCode, showsDevCode } = useAuth();
  const m = usePageMotion();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const heading = HEADINGS[mode];

  const goTo = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const fillDemo = (key: AuthRole) => {
    const account = DEMO_ACCOUNTS[key];
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setNotice("");
  };

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err) {
      if (err instanceof AuthError && err.code === "unverified") {
        // Inscription laissée en suspens : on renvoie l'utilisateur à l'étape de vérification.
        const resent = await resendCode(email).catch(() => ({ devCode: null }));
        setDevCode(resent.devCode);
        setCode("");
        setMode("verification");
        setNotice("Ce compte attend encore sa vérification. Un nouveau code vient d'être émis.");
      } else {
        setError(messageOf(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setBusy(true);
    setError("");
    try {
      const outcome = await signUp({ email, password, name, org, role });
      if (outcome.status === "verification") {
        setDevCode(outcome.devCode);
        setCode("");
        setMode("verification");
        setNotice(
          outcome.devCode
            ? "Compte créé. Saisissez le code ci-dessous pour l'activer."
            : "Compte créé. Un code de vérification vient d'être envoyé à votre adresse.",
        );
      }
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verify(email, code);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError("");
    try {
      const resent = await resendCode(email);
      setDevCode(resent.devCode);
      setNotice(
        resent.devCode
          ? "Nouveau code émis."
          : "Nouveau code envoyé à votre adresse e-mail.",
      );
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const signUpValid =
    name.trim() && email.trim() && password.length >= PASSWORD_MIN_LENGTH;

  return (
    <div className="app-cosmos flex min-h-full items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="mb-5 inline-flex min-h-11 items-center gap-2 text-[14px] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Retour à l'accueil
          </Link>
          <div className="mb-4 flex items-center justify-center gap-2.5 text-foreground">
            <BrandMark variant="black" className="size-9" decorative />
            <span className="landing-wordmark text-[28px] leading-none">AgroFlow</span>
          </div>
          <p className="landing-eyebrow text-foreground">{heading.eyebrow}</p>
          <h1 className="app-heading mx-auto mt-3 max-w-lg text-[clamp(26px,8vw,33px)] text-foreground">
            {heading.title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[16px] leading-normal tracking-[-0.18px] text-muted">
            {heading.body}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === "connexion" && (
            <motion.div
              key="connexion"
              initial={m.initial}
              animate={m.animate}
              exit={m.exit}
              transition={m.transition}
              className="mx-auto max-w-md"
            >
              <div className="overflow-hidden rounded-[16px] border border-border bg-panel">
                <form onSubmit={submitSignIn} className="space-y-4 p-4 sm:p-5">
                  <Field label="Adresse e-mail">
                    <Input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="min-h-12 rounded-[16px] bg-panel px-4 text-[16px]"
                    />
                  </Field>
                  <Field label="Mot de passe">
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="min-h-12 rounded-[16px] bg-panel px-4 text-[16px]"
                    />
                  </Field>
                  {error && (
                    <p className="text-[14px] text-alerte" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="landing-btn landing-btn-fill min-h-12 w-full disabled:opacity-50"
                  >
                    {busy ? "Connexion…" : "Se connecter"}
                  </button>
                </form>
                <div className="border-t border-border px-4 py-4 sm:px-5">
                  <p className="text-[14px] text-muted">
                    Pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => goTo("inscription")}
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      Créer un compte
                    </button>
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[16px] border border-border bg-panel px-4 py-4 sm:px-5">
                <p className="text-[14px] font-medium text-foreground">
                  Explorer avec un jeu de données
                </p>
                <p className="mt-1 text-[14px] leading-normal text-muted">
                  Les comptes de démonstration ouvrent un espace déjà rempli de lots et
                  d'opérations. Un compte créé démarre vide.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AUTH_ROLES.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => fillDemo(key)}
                      className="min-h-11 rounded-[16px] border border-border-strong px-3.5 text-[14px] text-foreground transition-colors hover:border-foreground/40"
                    >
                      {ROLE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {mode === "inscription" && !role && (
            <motion.div
              key="roles"
              initial={m.initial}
              animate={m.animate}
              exit={m.exit}
              transition={m.transition}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                {AUTH_ROLES.map((key) => {
                  const Icon = ICONS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRole(key)}
                      className="min-h-[11rem] rounded-[16px] border border-border bg-panel p-4 text-left transition-colors duration-200 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                    >
                      <div className="flex size-11 items-center justify-center rounded-[16px] bg-background text-foreground">
                        <Icon className="size-5" />
                      </div>
                      <div className="mt-4 text-[18px] leading-snug tracking-[-0.2px] text-foreground">
                        {ROLE_LABELS[key]}
                      </div>
                      <p className="mt-1 text-[14px] leading-normal text-muted">{BLURBS[key]}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-center text-[14px] text-muted">
                Vous avez déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => goTo("connexion")}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Se connecter
                </button>
              </p>
            </motion.div>
          )}

          {mode === "inscription" && role && (
            <motion.div
              key="inscription"
              initial={m.initial}
              animate={m.animate}
              exit={m.exit}
              transition={m.transition}
            >
              <div className="mx-auto max-w-md overflow-hidden rounded-[16px] border border-border bg-panel">
                <div className="border-b border-border px-4 py-4 sm:px-5">
                  <button
                    type="button"
                    onClick={() => setRole(null)}
                    className="inline-flex min-h-11 items-center gap-2 text-[14px] text-muted transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" />
                    Changer de rôle
                  </button>
                  <h2 className="app-heading mt-1 text-[24px] text-foreground">
                    {ROLE_LABELS[role]}
                  </h2>
                  <p className="text-[14px] text-muted">{BLURBS[role]}</p>
                </div>
                <form onSubmit={submitSignUp} className="space-y-4 p-4 sm:p-5">
                  <Field label="Nom et prénom">
                    <Input
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="min-h-12 rounded-[16px] bg-panel px-4 text-[16px]"
                    />
                  </Field>
                  <Field label="Organisation">
                    <Input
                      autoComplete="organization"
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                      placeholder="Coopérative, entreprise de transport…"
                      className="min-h-12 rounded-[16px] bg-panel px-4 text-[16px]"
                    />
                  </Field>
                  <Field label="Adresse e-mail">
                    <Input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="min-h-12 rounded-[16px] bg-panel px-4 text-[16px]"
                    />
                  </Field>
                  <Field label="Mot de passe">
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      className="min-h-12 rounded-[16px] bg-panel px-4 text-[16px]"
                    />
                  </Field>
                  <p className="text-[14px] text-faint">
                    {PASSWORD_MIN_LENGTH} caractères minimum.
                  </p>
                  {error && (
                    <p className="text-[14px] text-alerte" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy || !signUpValid}
                    className="landing-btn landing-btn-fill min-h-12 w-full disabled:opacity-50"
                  >
                    {busy ? "Création…" : "Créer mon compte"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {mode === "verification" && (
            <motion.div
              key="verification"
              initial={m.initial}
              animate={m.animate}
              exit={m.exit}
              transition={m.transition}
            >
              <div className="mx-auto max-w-md overflow-hidden rounded-[16px] border border-border bg-panel">
                <div className="border-b border-border px-4 py-4 sm:px-5">
                  <div className="flex size-11 items-center justify-center rounded-[16px] bg-background text-foreground">
                    <MailCheck className="size-5" />
                  </div>
                  <p className="mt-3 text-[14px] text-muted">Code envoyé à</p>
                  <p className="text-[16px] font-medium text-foreground">{email}</p>
                </div>
                <form onSubmit={submitVerify} className="space-y-4 p-4 sm:p-5">
                  {showsDevCode && devCode && (
                    <div className="rounded-[16px] border border-border-strong bg-background px-4 py-3">
                      <p className="text-[14px] text-muted">
                        Aucun e-mail n'est envoyé sans backend configuré. Code de
                        vérification :
                      </p>
                      <p className="tnum mt-1 text-[24px] font-medium tracking-[0.2em] text-foreground">
                        {devCode}
                      </p>
                    </div>
                  )}
                  {notice && <p className="text-[14px] text-muted">{notice}</p>}
                  <Field label="Code de vérification">
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      required
                      className="tnum min-h-12 rounded-[16px] bg-panel px-4 text-[16px] tracking-[0.3em]"
                    />
                  </Field>
                  {error && (
                    <p className="text-[14px] text-alerte" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <button
                      type="submit"
                      disabled={busy || code.length !== 6}
                      className="landing-btn landing-btn-fill min-h-12 flex-1 disabled:opacity-50"
                    >
                      {busy ? "Vérification…" : "Vérifier et continuer"}
                    </button>
                    <button
                      type="button"
                      onClick={resend}
                      disabled={busy}
                      className="landing-btn landing-btn-outline min-h-12 flex-1 disabled:opacity-50"
                    >
                      Renvoyer le code
                    </button>
                  </div>
                </form>
                <div className="border-t border-border px-4 py-4 sm:px-5">
                  <button
                    type="button"
                    onClick={() => goTo("connexion")}
                    className="inline-flex min-h-11 items-center gap-2 text-[14px] text-muted transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" />
                    Revenir à la connexion
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mx-auto mt-8 max-w-md text-center text-[14px] text-faint">
          Le passeport d'un lot reste consultable sans connexion, via le QR code.
        </p>
      </div>
    </div>
  );
}
