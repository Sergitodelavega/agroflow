import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useRole, lotsForViewer, operationsForViewer } from "../lib/role";
import { deriveAlerts, operationRouteEvents } from "../lib/alerts";
import { EVENT_LABELS, type OperationStatus } from "../lib/types";
import { Button, OperationStatusConfirm, Panel, PanelHeader, Select, EmptyState } from "../components/ui";
import { Truck } from "lucide-react";
import { OperationStatusBadge, VigilanceBadge } from "../components/badges";

export default function OperationsList() {
  const { lots: allLots, operations: allOperations, setOperationStatus } = useStore();
  const { role, perms, profile } = useRole();
  const lots = lotsForViewer(allLots, allOperations, role, profile.org, perms);
  const operations = operationsForViewer(allOperations, allLots, role, profile.org, perms);
  const alerts = deriveAlerts(lots, operations);
  const [status, setStatus] = useState<OperationStatus | "all">("all");
  const [watch, setWatch] = useState<"all" | "issues">("all");
  const [pendingStartId, setPendingStartId] = useState<string | null>(null);
  const worstOf = (opIdLots: string[]) => {
    const opAlerts = alerts.filter((a) => opIdLots.includes(a.lotId));
    if (opAlerts.some((a) => a.level === "alerte")) return "alerte" as const;
    if (opAlerts.length) return "vigilance" as const;
    return "ok" as const;
  };
  const vigRank = { ok: 0, vigilance: 1, alerte: 2 };
  const filtered = operations.filter((op) => {
    if (status !== "all" && op.status !== status) return false;
    if (watch === "issues" && worstOf(op.lotIds) === "ok") return false;
    return true;
  });
  const ranked = [...filtered].sort((a, b) => {
    const rank = (value: OperationStatus) =>
      value === "en_cours" ? 0 : value === "planifiee" ? 1 : 2;
    return rank(a.status) - rank(b.status) || vigRank[worstOf(b.lotIds)] - vigRank[worstOf(a.lotIds)];
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Opérations</h1>
        <p className="mt-1 text-sm text-muted">
          {ranked.length} opération{ranked.length > 1 ? "s" : ""} — filtrez par statut ou par alerte, puis ouvrez une tournée.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as OperationStatus | "all")}
          className="max-w-[220px]"
        >
          <option value="all">Tous les statuts</option>
          <option value="planifiee">Planifiée</option>
          <option value="en_cours">En cours</option>
          <option value="livree">Livrée</option>
        </Select>
        <Select
          value={watch}
          onChange={(e) => setWatch(e.target.value as "all" | "issues")}
          className="max-w-[240px]"
        >
          <option value="all">Toutes les vigilances</option>
          <option value="issues">Avec alerte ou vigilance</option>
        </Select>
      </div>

      <Panel>
        <PanelHeader title="Tournées" hint="En cours et alertes d'abord" />
        {ranked.length === 0 ? (
          <EmptyState>Aucune opération ne correspond au filtre.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 font-medium">Opération</th>
                  <th className="px-4 py-2 font-medium">Corridor</th>
                  {role !== "transporteur" && <th className="px-4 py-2 font-medium">Transporteur</th>}
                  <th className="px-4 py-2 text-right font-medium">Lots</th>
                  <th className="px-4 py-2 text-right font-medium">Volume</th>
                  <th className="px-4 py-2 font-medium">Dernier événement</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Vigilance</th>
                  {role === "transporteur" && <th className="px-4 py-2 font-medium">Action</th>}
                </tr>
              </thead>
              <tbody>
                {ranked.map((op) => {
                  const opLots = lots.filter((l) => op.lotIds.includes(l.id));
                  const volume = opLots.reduce((s, l) => s + l.quantityKg, 0);
                  const worst = worstOf(op.lotIds);
                  const lastEvent = operationRouteEvents(opLots)[0];
                  return (
                    <tr key={op.id} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50">
                      <td className="px-4 py-2.5">
                        <Link to={`/operation/${op.id}`} className="font-mono text-xs text-info hover:underline">
                          {op.id}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{op.corridor}</td>
                      {role !== "transporteur" && (
                        <td className="px-4 py-2.5 text-muted">{op.carrier || "Non assigné"}</td>
                      )}
                      <td className="tnum px-4 py-2.5 text-right text-muted">{op.lotIds.length}</td>
                      <td className="tnum px-4 py-2.5 text-right text-muted">{volume.toLocaleString("fr-FR")} kg</td>
                      <td className="max-w-[220px] px-4 py-2.5">
                        {lastEvent ? (
                          <>
                            <div className="text-foreground">{EVENT_LABELS[lastEvent.type]}</div>
                            <div className="truncate text-xs text-faint">{lastEvent.note}</div>
                          </>
                        ) : (
                          <span className="text-xs text-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <OperationStatusBadge status={op.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <VigilanceBadge level={worst} />
                      </td>
                      {role === "transporteur" && (
                        <td className="px-4 py-2.5">
                          {op.status === "planifiee" && perms.canManageOperation ? (
                            <Button
                              variant="primary"
                              onClick={() => setPendingStartId(op.id)}
                            >
                              <Truck className="size-4" />
                              Démarrer le transport
                            </Button>
                          ) : (
                            <span className="text-xs text-faint">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <OperationStatusConfirm
        open={pendingStartId !== null}
        status="en_cours"
        lotCount={operations.find((o) => o.id === pendingStartId)?.lotIds.length ?? 0}
        onClose={() => setPendingStartId(null)}
        onConfirm={() => {
          if (!pendingStartId) return;
          setOperationStatus(pendingStartId, "en_cours");
          setPendingStartId(null);
        }}
      />
    </div>
  );
}
