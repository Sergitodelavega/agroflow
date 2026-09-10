import {
  Boxes,
  GitMerge,
  LayoutDashboard,
  Map,
  PackagePlus,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { NavKey } from "./role";

export type AppNavItem = {
  key: NavKey;
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  end?: boolean;
};

export const APP_NAV: AppNavItem[] = [
  { key: "dashboard", to: "/", label: "Tableau de bord", shortLabel: "Accueil", icon: LayoutDashboard, end: true },
  { key: "operations", to: "/operations", label: "Opérations", shortLabel: "Tournées", icon: Truck },
  { key: "lots", to: "/lots", label: "Lots", shortLabel: "Lots", icon: Boxes },
  { key: "creer", to: "/creer", label: "Créer un lot", shortLabel: "Créer", icon: PackagePlus },
  { key: "compatibilite", to: "/compatibilite", label: "Compatibilité", shortLabel: "Compat.", icon: GitMerge },
  { key: "carte", to: "/carte", label: "Carte des flux", shortLabel: "Carte", icon: Map },
];
