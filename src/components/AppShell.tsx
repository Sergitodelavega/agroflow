import { type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  GitMerge,
  Map,
  Truck,
  RotateCcw,
  Leaf,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useStore } from "../lib/store";
import { deriveAlerts } from "../lib/alerts";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { useRole, lotsForViewer, operationsForViewer, type NavKey } from "../lib/role";
import { getNextStep } from "../lib/guidance";
import NextStep from "./NextStep";
import PageTransition from "./PageTransition";

const nav: { key: NavKey; to: string; label: string; icon: typeof Boxes; end?: boolean }[] = [
  { key: "dashboard", to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { key: "operations", to: "/operations", label: "Opérations", icon: Truck },
  { key: "lots", to: "/lots", label: "Lots", icon: Boxes },
  { key: "creer", to: "/creer", label: "Créer un lot", icon: PackagePlus },
  { key: "compatibilite", to: "/compatibilite", label: "Compatibilité", icon: GitMerge },
  { key: "carte", to: "/carte", label: "Carte des flux", icon: Map },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { lots, operations, resetDemo } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useTheme();
  const { role, profile, perms } = useRole();
  const { logout } = useAuth();
  const scopedLots = lotsForViewer(lots, operations, role, profile.org, perms);
  const scopedOps = operationsForViewer(operations, lots, role, profile.org, perms);
  const path = `${location.pathname}${location.search}`;
  const next = getNextStep({
    role,
    path,
    lots: scopedLots,
    operations: scopedOps,
    perms,
  });
  const alerts = deriveAlerts(scopedLots, scopedOps);
  const critical = alerts.filter((a) => a.level === "alerte").length;
  const visibleNav = nav.filter((n) => perms.nav.includes(n.key));

  const signOut = () => {
    logout();
    navigate("/connexion");
  };

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col border-b border-border bg-surface lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Leaf className="size-4.5" />
          </div>
          <div>
            <div className="font-mono text-sm font-bold tracking-tight text-foreground">
              AGROFLOW
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
              Mutualisation logistique
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-0.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-border p-3 lg:block">
          <button
            onClick={() => {
              resetDemo();
              navigate(perms.home);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-faint transition-colors duration-200 hover:bg-surface-2 hover:text-muted"
          >
            <RotateCcw className="size-3.5" />
            Réinitialiser la démo
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">
              {profile.name.split(" ").map((p) => p[0]).join("")}
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {profile.name}
                <span className="font-mono text-xs uppercase tracking-wide text-faint">· connecté</span>
              </div>
              <div className="text-xs text-muted">{profile.org}</div>
            </div>
            <span className="rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide text-primary">
              {profile.label}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-2.5 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-primary/50 hover:text-primary"
            >
              <LogOut className="size-3.5" />
              Déconnexion
            </button>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-muted">
            <span className="hidden tnum sm:inline">
              {scopedLots.length} lot{scopedLots.length > 1 ? "s" : ""}
            </span>
            <span className="hidden tnum sm:inline">
              {scopedOps.length} opération{scopedOps.length > 1 ? "s" : ""}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 ${critical ? "text-alerte" : "text-primary"}`}
            >
              <span className={`size-1.5 rounded-full ${critical ? "animate-pulse bg-alerte" : "bg-primary"}`} />
              {critical ? `${critical} alerte(s)` : "Système nominal"}
            </span>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              className="flex size-7 items-center justify-center rounded-lg border border-border-strong text-muted transition-colors duration-200 hover:border-primary/50 hover:text-primary"
            >
              {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>
        </header>
        {next && <NextStep step={next} path={path} />}
        <main className="min-w-0 flex-1 p-5 lg:p-7">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
