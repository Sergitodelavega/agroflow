import { User } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { AppNavItem } from "../lib/nav";
import type { NavKey } from "../lib/role";

export default function MobileNav({
  items,
  notifs,
  profileOpen,
  profileDot,
  onProfile,
}: {
  items: AppNavItem[];
  notifs?: Partial<Record<NavKey, number>>;
  profileOpen: boolean;
  profileDot: boolean;
  onProfile: () => void;
}) {
  return (
    <nav
      aria-label="Navigation principale"
      className="app-mobile-bar pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-0.5 overflow-hidden rounded-[16px] border border-border bg-panel px-1.5 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const count = notifs?.[item.key] ?? 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              onClick={() => {
                if (profileOpen) onProfile();
              }}
              className={({ isActive }) =>
                `relative flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-[16px] px-2.5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
                  isActive && !profileOpen
                    ? "flex-[1.6] bg-foreground text-background"
                    : "flex-1 text-muted hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {isActive && !profileOpen && (
                    <span className="max-w-16 truncate">{item.shortLabel}</span>
                  )}
                  {count > 0 && !(isActive && !profileOpen) && (
                    <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
        <button
          type="button"
          aria-label="Profil"
          aria-expanded={profileOpen}
          aria-current={profileOpen ? "true" : undefined}
          onClick={onProfile}
          className={`relative flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-[16px] px-2.5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
            profileOpen
              ? "flex-[1.6] bg-foreground text-background"
              : "flex-1 text-muted hover:text-foreground"
          }`}
        >
          <User className="size-5 shrink-0" aria-hidden />
          {profileOpen && <span>Profil</span>}
          {profileDot && !profileOpen && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground" />
          )}
        </button>
      </div>
    </nav>
  );
}
