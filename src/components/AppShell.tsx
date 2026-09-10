import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronsRight, LogOut, Moon, RotateCcw, Sun, X } from "lucide-react";
import { useStore } from "../lib/store";
import { deriveAlerts } from "../lib/alerts";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { useRole, lotsForViewer, operationsForViewer } from "../lib/role";
import { APP_NAV, type AppNavItem } from "../lib/nav";
import { getNextStep } from "../lib/guidance";
import BrandMark from "./BrandMark";
import NextStepModal from "./NextStep";
import PageTransition from "./PageTransition";
import MobileNav from "./MobileNav";
import MobileProfile, { NoticeList, type ProfileNotice } from "./MobileProfile";

const SHOWN_KEY = "agroflow.nextstep.shown";

function pathName(path: string): string {
  return path.split("?")[0] || "/";
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lots, operations, resetWorkspace, seeded } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useTheme();
  const markVariant = theme === "dark" ? "white" : "black";
  const { role, profile, perms } = useRole();
  const { signOut: endSession } = useAuth();
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
  const visibleNav = APP_NAV.filter((item) => perms.nav.includes(item.key));

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem("agroflow.sidebar") !== "0";
    } catch {
      return true;
    }
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [desktopNoticesOpen, setDesktopNoticesOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("agroflow.sidebar", sidebarOpen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [sidebarOpen]);

  const stepKey = next ? `${role}|${next.to}|${next.body}` : "";

  useEffect(() => {
    if (!desktopNoticesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopNoticesOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [desktopNoticesOpen]);

  useEffect(() => {
    if (!next || pathName(path) !== pathName(perms.home)) return;
    try {
      if (sessionStorage.getItem(SHOWN_KEY) === stepKey) return;
      sessionStorage.setItem(SHOWN_KEY, stepKey);
    } catch {
      // still show once in this mount
    }
    setModalOpen(true);
  }, [next, path, perms.home, stepKey]);

  const openNext = useCallback(() => {
    setProfileOpen(false);
    setDesktopNoticesOpen(false);
    setModalOpen(true);
  }, []);

  const notices = useMemo<ProfileNotice[]>(() => {
    const items: ProfileNotice[] = [];
    if (next) {
      items.push({
        id: "prochain-pas",
        title: next.title,
        body: next.body,
        onOpen: openNext,
      });
    }
    alerts.slice(0, 3).forEach((alert) => {
      items.push({
        id: `alerte-${alert.lotId}-${alert.message}`,
        title: alert.level === "alerte" ? "Alerte" : "Vigilance",
        body: alert.message,
        onOpen: () => {
          setProfileOpen(false);
          setDesktopNoticesOpen(false);
          navigate(`/passeport/${alert.lotId}`);
        },
      });
    });
    return items;
  }, [alerts, next, navigate, openNext]);

  const resetLabel = seeded ? "Réinitialiser la démo" : "Vider mon espace";

  const signOut = async () => {
    try {
      sessionStorage.removeItem(SHOWN_KEY);
    } catch {
      // ignore
    }
    await endSession();
    navigate("/connexion");
  };

  return (
    <div className="app-cosmos flex min-h-full">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-panel transition-[width] duration-300 ease-in-out lg:flex ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="border-b border-border p-2">
          <Link
            to={perms.home}
            className="flex items-center gap-3 rounded-[16px] p-2 text-foreground transition-colors hover:bg-background"
          >
            <BrandMark variant={markVariant} className="size-8" decorative />
            {sidebarOpen && (
              <span className="min-w-0">
                <span className="landing-wordmark block text-[18px] leading-none">AgroFlow</span>
                <span className="mt-1 block truncate text-[14px] text-muted">{profile.label}</span>
              </span>
            )}
          </Link>
        </div>

        <nav aria-label="Navigation principale" className="flex-1 space-y-1 overflow-y-auto p-2">
          {visibleNav.map((item) => (
            <SidebarOption
              key={item.to}
              item={item}
              open={sidebarOpen}
              notifs={item.key === "dashboard" ? critical : 0}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-border p-2">
          {sidebarOpen && (
            <div className="mb-1 px-3 py-2 text-[14px] font-medium text-muted">Compte</div>
          )}
          <button
            type="button"
            onClick={() => setDesktopNoticesOpen((value) => !value)}
            className="flex h-11 w-full items-center rounded-[16px] text-muted transition-colors hover:bg-background hover:text-foreground"
            aria-expanded={desktopNoticesOpen}
          >
            <span className="relative grid size-11 place-content-center">
              <Bell className="size-4" />
              {notices.length > 0 && (
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-foreground" />
              )}
            </span>
            {sidebarOpen && <span className="text-[14px] font-medium">Notifications</span>}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-full items-center rounded-[16px] text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <span className="grid size-11 place-content-center">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </span>
            {sidebarOpen && (
              <span className="text-[14px] font-medium">
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              resetWorkspace();
              navigate(perms.home);
            }}
            title={sidebarOpen ? undefined : resetLabel}
            className="flex h-11 w-full items-center rounded-[16px] text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <span className="grid size-11 place-content-center">
              <RotateCcw className="size-4" />
            </span>
            {sidebarOpen && <span className="text-[14px] font-medium">{resetLabel}</span>}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex h-11 w-full items-center rounded-[16px] text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <span className="grid size-11 place-content-center">
              <LogOut className="size-4" />
            </span>
            {sidebarOpen && <span className="text-[14px] font-medium">Déconnexion</span>}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="flex h-11 w-full items-center rounded-[16px] text-muted transition-colors hover:bg-background hover:text-foreground"
            aria-expanded={sidebarOpen}
          >
            <span className="grid size-11 place-content-center">
              <ChevronsRight
                className={`size-4 transition-transform duration-300 ${sidebarOpen ? "rotate-180" : ""}`}
              />
            </span>
            {sidebarOpen && <span className="text-[14px] font-medium">Réduire</span>}
          </button>

        </div>
      </aside>

      {desktopNoticesOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20"
            aria-label="Fermer les notifications"
            onClick={() => setDesktopNoticesOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="desktop-notices-title"
            className={`absolute bottom-8 w-[440px] max-w-[calc(100vw-6rem)] rounded-[16px] border border-border bg-panel p-[24px] ${
              sidebarOpen ? "left-72" : "left-20"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="landing-eyebrow text-foreground">Compte</p>
                <h2 id="desktop-notices-title" className="app-heading mt-2 text-[24px] text-foreground">
                  Notifications
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDesktopNoticesOpen(false)}
                className="grid size-11 shrink-0 place-content-center rounded-[16px] text-muted hover:bg-background hover:text-foreground"
                aria-label="Fermer les notifications"
              >
                <X className="size-4" />
              </button>
            </div>
            <NoticeList notices={notices} empty="Aucune notification pour le moment." roomy />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-panel px-4 py-3 lg:hidden">
          <Link
            to={perms.home}
            className="grid size-11 shrink-0 place-content-center text-foreground"
            aria-label="Tableau de bord"
          >
            <BrandMark variant={markVariant} className="size-8" />
          </Link>
          <span className="landing-wordmark text-[20px] leading-none">AgroFlow</span>
        </header>
        <main className="min-w-0 flex-1 p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:p-7 lg:pb-7">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <MobileNav
        items={visibleNav}
        notifs={critical ? { dashboard: critical } : undefined}
        profileOpen={profileOpen}
        profileDot={notices.length > 0}
        onProfile={() => setProfileOpen((value) => !value)}
      />

      <MobileProfile
        open={profileOpen}
        profile={profile}
        theme={theme}
        notices={notices}
        onClose={() => setProfileOpen(false)}
        onToggleTheme={toggleTheme}
        onSignOut={signOut}
      />

      {next && (
        <NextStepModal
          step={next}
          path={path}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function SidebarOption({
  item,
  open,
  notifs,
}: {
  item: AppNavItem;
  open: boolean;
  notifs: number;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={open ? undefined : item.label}
      className={({ isActive }) =>
        `relative flex h-11 w-full items-center rounded-[16px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
          isActive
            ? "bg-foreground text-background"
            : "text-muted hover:bg-background hover:text-foreground"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="grid size-11 place-content-center">
            <Icon className="size-4" />
          </span>
          {open && <span className="text-[14px] font-medium">{item.label}</span>}
          {notifs > 0 && open && (
            <span
              className={`absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[12px] font-medium ${
                isActive ? "bg-background text-foreground" : "bg-foreground text-background"
              }`}
            >
              {notifs}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
