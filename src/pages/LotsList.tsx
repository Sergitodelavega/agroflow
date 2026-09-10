import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Pencil, Ban, Check, Undo2 } from "lucide-react";
import { useStore } from "../lib/store";
import { useRole, lotsForViewer, operationsForViewer, canEditLot } from "../lib/role";
import { getNextStep } from "../lib/guidance";
import { lotVigilance } from "../lib/alerts";
import {
  CATEGORY_LABELS,
  CONSTRAINT_LABELS,
  type LotStatus,
} from "../lib/types";
import { Input, Panel, PanelHeader, Select, EmptyState, EmptyStateLink } from "../components/ui";
import { StatusBadge, VigilanceBadge } from "../components/badges";

export default function LotsList() {
  const { lots: allLots, operations: allOperations, cancelLot } = useStore();
  const { role, perms, profile } = useRole();
  const lots = lotsForViewer(allLots, allOperations, role, profile.org, perms);
  const operations = operationsForViewer(allOperations, allLots, role, profile.org, perms);
  const next = getNextStep({
    role,
    path: "/lots",
    lots,
    operations,
    perms,
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LotStatus | "all">("all");
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const showCreate = perms.canCreateLot && next?.to !== "/creer";
  const showProducer = !perms.scopeOwn;
  const showActions = (perms.canCreateLot && perms.scopeOwn) || perms.canGroup;

  const filtered = lots.filter((l) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      l.id.toLowerCase().includes(q) ||
      l.product.toLowerCase().includes(q) ||
      l.producer.toLowerCase().includes(q) ||
      l.destination.name.toLowerCase().includes(q);
    const matchS = status === "all" || l.status === status;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {role === "transporteur"
              ? "Lots des opérations"
              : perms.scopeOwn
                ? "Mes lots"
                : "Lots enregistrés"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {lots.length === 0
              ? "Aucun lot pour le moment."
              : `${filtered.length} lot(s) — ${
                  role === "transporteur"
                    ? "uniquement les lots déjà regroupés dans une tournée."
                    : perms.scopeOwn
                      ? "filtrez par statut ou recherchez un produit, un lot ou une destination."
                      : "filtrez par statut ou recherchez un producteur, un produit ou une destination."
                }`}
          </p>
        </div>
        {showCreate && (
          <Link to="/creer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-dim">
            + Nouveau lot
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as LotStatus | "all")} className="max-w-[200px]">
          <option value="all">Tous les statuts</option>
          {role !== "transporteur" && <option value="enregistre">Enregistré</option>}
          <option value="regroupe">Regroupé</option>
          <option value="en_transport">En transport</option>
          <option value="livre">Livré</option>
        </Select>
      </div>

      <Panel>
        <PanelHeader title="Inventaire des lots" />
        {lots.length === 0 ? (
          <EmptyState
            title={role === "transporteur" ? "Aucun lot à charger" : "Aucun lot enregistré"}
            action={
              perms.canCreateLot ? (
                <EmptyStateLink to="/creer">Créer un lot</EmptyStateLink>
              ) : undefined
            }
          >
            {role === "transporteur"
              ? "Les lots apparaissent ici une fois regroupés dans une tournée qui vous est assignée."
              : perms.canCreateLot
                ? "Déclarez un besoin de transport : produit, quantité, trajet et fenêtre de disponibilité."
                : "Les besoins de transport déclarés par les producteurs apparaîtront dans cet inventaire."}
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState title="Aucun résultat">
            Aucun lot ne correspond à cette recherche. Modifiez le texte saisi ou revenez à
            « Tous les statuts ».
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 font-medium">Lot</th>
                  {showProducer && <th className="px-4 py-2 font-medium">Producteur</th>}
                  <th className="px-4 py-2 font-medium">Produit</th>
                  <th className="px-4 py-2 text-right font-medium">Qté</th>
                  <th className="px-4 py-2 font-medium">Trajet</th>
                  <th className="px-4 py-2 font-medium">Contraintes</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Vigilance</th>
                  {showActions && <th className="px-4 py-2 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lot) => (
                  <tr key={lot.id} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-4 py-2.5">
                      <Link to={`/passeport/${lot.id}`} className="font-mono text-xs text-info hover:underline">{lot.id}</Link>
                    </td>
                    {showProducer && <td className="px-4 py-2.5 text-muted">{lot.producer}</td>}
                    <td className="px-4 py-2.5">
                      <div className="text-foreground">{lot.product}</div>
                      <div className="text-xs text-faint">{CATEGORY_LABELS[lot.category]}</div>
                    </td>
                    <td className="tnum px-4 py-2.5 text-right text-muted">{lot.quantityKg} kg</td>
                    <td className="px-4 py-2.5 text-xs text-muted">
                      {lot.origin.name} <span className="text-faint">→</span> {lot.destination.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {lot.constraints.map((c) => (
                          <span key={c} className="rounded-sm border border-border px-1.5 py-0.5 text-xs text-faint">{CONSTRAINT_LABELS[c]}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={lot.status} /></td>
                    <td className="px-4 py-2.5"><VigilanceBadge level={lotVigilance(lot)} /></td>
                    {showActions && (
                      <td className="px-4 py-2.5">
                        {canEditLot(lot, perms, profile.org) ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              to={`/creer?lot=${lot.id}`}
                              title="Modifier le lot"
                              className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-2 py-1 text-xs text-primary transition-colors duration-200 hover:border-primary/50"
                            >
                              <Pencil className="size-3.5" aria-hidden />
                              Modifier
                            </Link>
                            {pendingCancel === lot.id ? (
                              <>
                                <button
                                  type="button"
                                  title="Confirmer l'annulation"
                                  className="inline-flex items-center gap-1 rounded-lg border border-alerte/40 px-2 py-1 text-xs text-alerte transition-colors duration-200 hover:border-alerte/70"
                                  onClick={() => {
                                    cancelLot(lot.id);
                                    setPendingCancel(null);
                                  }}
                                >
                                  <Check className="size-3.5" aria-hidden />
                                  Confirmer
                                </button>
                                <button
                                  type="button"
                                  title="Ne pas annuler"
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
                                  onClick={() => setPendingCancel(null)}
                                >
                                  <Undo2 className="size-3.5" aria-hidden />
                                  Retour
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                title="Annuler le lot"
                                className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-2 py-1 text-xs text-muted transition-colors duration-200 hover:border-alerte/50 hover:text-alerte"
                                onClick={() => setPendingCancel(lot.id)}
                              >
                                <Ban className="size-3.5" aria-hidden />
                                Annuler
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-faint">Non modifiable</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
