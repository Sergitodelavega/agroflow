import { Compass, LogOut, Moon, Sun } from "lucide-react";
import type { RoleProfile } from "../lib/role";
import type { Theme } from "../lib/theme";

export type ProfileNotice = {
  id: string;
  title: string;
  body: string;
  onOpen: () => void;
};

export function NoticeList({
  notices,
  empty,
  roomy = false,
}: {
  notices: ProfileNotice[];
  empty: string;
  roomy?: boolean;
}) {
  if (notices.length === 0) {
    return (
      <p className={`text-faint ${roomy ? "px-1 py-6 text-[16px] leading-normal" : "px-1 py-4 text-[14px]"}`}>
        {empty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {notices.map((notice) => (
        <li key={notice.id}>
          <button
            type="button"
            onClick={notice.onOpen}
            className={`flex w-full items-start text-left transition-colors hover:text-muted ${
              roomy ? "min-h-14 gap-4 py-4" : "min-h-11 gap-3 py-3"
            }`}
          >
            <Compass className={`shrink-0 text-foreground ${roomy ? "mt-1 size-5" : "mt-0.5 size-4"}`} />
            <span className="min-w-0">
              <span className={`block font-medium text-foreground ${roomy ? "text-[16px]" : "text-[15px]"}`}>
                {notice.title}
              </span>
              <span
                className={`mt-1 block text-muted ${
                  roomy ? "text-[16px] leading-normal tracking-[-0.18px]" : "text-[14px]"
                }`}
              >
                {notice.body}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function MobileProfile({
  open,
  profile,
  theme,
  notices,
  onClose,
  onToggleTheme,
  onSignOut,
}: {
  open: boolean;
  profile: RoleProfile;
  theme: Theme;
  notices: ProfileNotice[];
  onClose: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25"
        aria-label="Fermer le profil"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Profil"
        className="absolute inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] max-h-[70vh] overflow-y-auto rounded-[16px] border border-border bg-panel px-4 pt-4"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="pb-2">
          <p className="landing-wordmark text-[22px] leading-none">AgroFlow</p>
          <p className="mt-2 text-[16px] font-medium text-foreground">{profile.name}</p>
          <p className="text-[14px] text-muted">
            {profile.label} · {profile.org}
          </p>
        </div>

        <section className="border-t border-border pt-3">
          <h2 className="text-[15px] font-medium text-foreground">Notifications</h2>
          <NoticeList notices={notices} empty="Aucune notification pour le moment." />
        </section>

        <div className="mt-2 flex flex-col gap-2 border-t border-border py-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex min-h-11 items-center gap-3 rounded-[16px] px-2 text-[16px] font-medium text-foreground hover:bg-background"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-11 items-center gap-3 rounded-[16px] px-2 text-[16px] font-medium text-foreground hover:bg-background"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
