import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Leaf, Truck, Waypoints, ArrowLeft, Sparkles } from "lucide-react";
import { AUTH_ROLES, DEMO_ACCOUNTS, useAuth, type AuthRole } from "../lib/auth";
import { PERMISSIONS, PROFILES } from "../lib/role";
import { AnimatePresence, motion } from "motion/react";
import { Button, Field, Input, Panel } from "../components/ui";
import { usePageMotion } from "../components/PageTransition";

const ICONS: Record<AuthRole, typeof Leaf> = {
  producteur: Leaf,
  transporteur: Truck,
  operateur: Waypoints,
};

const BLURBS: Record<AuthRole, string> = {
  producteur: "Enregistrez vos lots et consultez les possibilités de regroupement.",
  transporteur: "Prenez en charge une opération et déclarez les événements.",
  operateur: "Regroupez les lots, assignez un transporteur et suivez le réseau.",
};

export default function Login() {
  const { session, login } = useAuth();
  const m = usePageMotion();
  const [role, setRole] = useState<AuthRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (session) {
    return <Navigate to={PERMISSIONS[session.role].home} replace />;
  }

  const fillDemo = () => {
    if (!role) return;
    const account = DEMO_ACCOUNTS[role];
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    const ok = login(role, email, password);
    if (!ok) setError("Identifiant ou mot de passe incorrect.");
  };

  const pickRole = (next: AuthRole) => {
    setRole(next);
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Accueil
          </Link>
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Leaf className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Connexion à AgroFlow
          </h1>
          <p className="mt-2 text-sm text-muted">
            Choisissez votre rôle, puis connectez-vous pour ouvrir votre tableau de bord.
          </p>
        </div>

        <AnimatePresence mode="wait">
        {!role ? (
          <motion.div
            key="roles"
            initial={m.initial}
            animate={m.animate}
            exit={m.exit}
            transition={m.transition}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {AUTH_ROLES.map((key) => {
              const Icon = ICONS[key];
              const profile = PROFILES[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickRole(key)}
                  className="rounded-xl border border-border bg-panel p-5 text-left transition-all duration-200 hover:border-primary/40 hover:bg-surface-2 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="mt-4 text-base font-semibold text-foreground">
                    {profile.label}
                  </div>
                  <p className="mt-1 text-sm text-muted">{BLURBS[key]}</p>
                  <p className="mt-3 font-mono text-xs text-faint">{profile.org}</p>
                </button>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={m.initial}
            animate={m.animate}
            exit={m.exit}
            transition={m.transition}
          >
          <Panel className="mx-auto max-w-md overflow-hidden rounded-xl">
            <div className="border-b border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setRole(null)}
                className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Changer de rôle
              </button>
              <h2 className="mt-2 text-lg font-semibold text-foreground">
                {PROFILES[role].label}
              </h2>
              <p className="text-sm text-muted">{PROFILES[role].name} · {PROFILES[role].org}</p>
            </div>
            <form onSubmit={submit} className="space-y-4 p-5">
              <Field label="Identifiant">
                <Input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Mot de passe">
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              {error && (
                <p className="text-sm text-alerte" role="alert">{error}</p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="submit" variant="primary" className="sm:flex-1">
                  Se connecter
                </Button>
                <Button type="button" variant="ghost" onClick={fillDemo}>
                  <Sparkles className="size-3.5" />
                  Remplir la démo
                </Button>
              </div>
            </form>
          </Panel>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
