import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Truck } from "lucide-react";
import { useStore } from "../lib/store";
import { useRole, lotsForViewer, operationsForViewer } from "../lib/role";
import { deriveAlerts, dedupeAlerts, lotVigilance, operationRouteEvents } from "../lib/alerts";
import { CATEGORY_LABELS } from "../lib/types";
import { estimateOperations, estimateViewerSavings, formatFcfa } from "../lib/savings";
import { Button, KPIStat, OperationStatusConfirm, Panel, PanelHeader, EmptyState } from "../components/ui";
import {
  OperationStatusBadge,
  StatusBadge,
  VigilanceBadge,
} from "../components/badges";

export default function Dashboard() {
  const { lots: allLots, operations: allOperations, setOperationStatus } = useStore();
  const [pendingStartId, setPendingStartId] = useState<string | null>(null);
  const { role, perms, profile } = useRole();
  const lots = lotsForViewer(allLots, allOperations, role, profile.org, perms);
  const operations = operationsForViewer(allOperations, allLots, role, profile.org, perms);
  const plannedOps = operations.filter((o) => o.status === "planifiee").length;
  const runningOps = operations.filter((o) => o.status === "en_cours").length;
  const rankedOps = [...operations].sort((a, b) => {
    const rank = (status: typeof a.status) =>
      status === "en_cours" ? 0 : status === "planifiee" ? 1 : 2;
    return rank(a.status) - rank(b.status);
  });
  const alerts = dedupeAlerts(deriveAlerts(lots, operations));

  const ungroupedLots = lots.filter((l) => !l.operationId && l.status === "enregistre");
  const intro =
    role === "producteur"
      ? `Bienvenue ${profile.name}. Voici les lots de ${profile.org}, leur compatibilité et les alertes.`
      : role === "transporteur"
        ? `Bienvenue ${profile.name}. Voici les opérations à prendre en charge et les alertes de transport.`
        : role === "operateur"
          ? `Bienvenue ${profile.name}. Voici les lots à regrouper, les opérations par transporteur et les alertes du réseau.`
          : `Bienvenue ${profile.name}. Vue consolidée des lots, des opérations et des alertes.`;

  const totalVolume = lots.reduce((s, l) => s + l.quantityKg, 0);
  const pooled = lots.filter((l) => l.operationId).length;
  const poolingRate = lots.length ? Math.round((pooled / lots.length) * 100) : 0;
  const inTransit = lots.filter((l) => l.status === "en_transport").length;
  const viewerSavings = estimateViewerSavings(lots, operations, allLots);
  const networkSavings = estimateOperations(operations, allLots);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Tableau de bord · {profile.label}
        </h1>
        <p className="mt-1 text-sm text-muted">{intro}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {role === "transporteur" ? (
          <>
            <KPIStat label="À prendre en charge" value={plannedOps} sub="opération(s) planifiée(s)" accent="info" />
            <KPIStat label="En cours" value={runningOps} sub="tournée(s) sur la route" accent="primary" />
            <KPIStat label="Lots en transport" value={inTransit} sub={`${lots.length} lot(s) dans les opérations`} />
            <KPIStat label="Alertes de route" value={alerts.length} sub={`${alerts.filter((a) => a.level === "alerte").length} critique(s)`} accent={alerts.some((a) => a.level === "alerte") ? "alerte" : "vigilance"} />
          </>
        ) : role === "operateur" ? (
          <>
            <KPIStat label="À regrouper" value={ungroupedLots.length} sub="lot(s) sans opération" accent="info" />
            <KPIStat label="En cours" value={runningOps} sub="tournée(s) sur la route" accent="primary" />
            <KPIStat
              label="Économie estimée"
              value={formatFcfa(networkSavings.savedFcfa)}
              sub={`${networkSavings.tripsAvoided} course(s) évitée(s) · ${plannedOps} planifiée(s)`}
              accent="info"
            />
            <KPIStat label="Alertes réseau" value={alerts.length} sub={`${alerts.filter((a) => a.level === "alerte").length} critique(s)`} accent={alerts.some((a) => a.level === "alerte") ? "alerte" : "vigilance"} />
          </>
        ) : (
          <>
            <KPIStat label="Volume total" value={`${totalVolume.toLocaleString("fr-FR")} kg`} sub={`${lots.length} lot(s)`} />
            <KPIStat
              label="Économie estimée"
              value={formatFcfa(viewerSavings.savedFcfa)}
              sub={`${poolingRate}% mutualisés · ${viewerSavings.tripsAvoided} course(s) évitée(s)`}
              accent="info"
            />
            <KPIStat
              label="En transport"
              value={inTransit}
              sub={
                operations.length === 0
                  ? "Aucune opération"
                  : `${operations.length} opération${operations.length > 1 ? "s" : ""}`
              }
              accent="primary"
            />
            <KPIStat label="Alertes actives" value={alerts.length} sub={`${alerts.filter((a) => a.level === "alerte").length} critique(s)`} accent={alerts.some((a) => a.level === "alerte") ? "alerte" : "vigilance"} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {role === "transporteur" ? (
        <Panel>
          <PanelHeader
            title="Opérations"
            action={
              <Link to="/operations" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Tout voir <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          {rankedOps.length === 0 ? (
            <EmptyState>Aucune opération ne vous est assignée.</EmptyState>
          ) : (
            <ul className="divide-y divide-border/50">
              {rankedOps.map((op) => (
                <li key={op.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Link to={`/operation/${op.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
                    <Truck className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground">{op.id}</span>
                        <OperationStatusBadge status={op.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-faint">{op.corridor}</p>
                    </div>
                    <span className="tnum text-xs text-muted">{op.lotIds.length} lots</span>
                  </Link>
                  {op.status === "planifiee" && perms.canManageOperation && (
                    <Button
                      variant="primary"
                      onClick={() => setPendingStartId(op.id)}
                    >
                      <Truck className="size-4" />
                      Démarrer le transport
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        ) : role === "operateur" ? (
        <Panel>
          <PanelHeader
            title="Lots à regrouper"
            action={
              ungroupedLots.length > 0 ? (
                <Link
                  to={`/compatibilite?lot=${ungroupedLots[0].id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Analyser <ArrowUpRight className="size-3.5" />
                </Link>
              ) : (
                <Link to="/lots" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Tout voir <ArrowUpRight className="size-3.5" />
                </Link>
              )
            }
          />
          {ungroupedLots.length === 0 ? (
            <EmptyState>Aucun lot en attente de regroupement.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-faint">
                    <th className="px-4 py-2 font-medium">Lot</th>
                    <th className="px-4 py-2 font-medium">Produit</th>
                    <th className="px-4 py-2 font-medium">Producteur</th>
                    <th className="px-4 py-2 text-right font-medium">Qté</th>
                    <th className="px-4 py-2 font-medium">Vigilance</th>
                  </tr>
                </thead>
                <tbody>
                  {ungroupedLots.slice(0, 7).map((lot) => (
                    <tr key={lot.id} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50">
                      <td className="px-4 py-2.5">
                        <Link to={`/passeport/${lot.id}`} className="font-mono text-xs text-info hover:underline">
                          {lot.id}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-foreground">{lot.product}</div>
                        <div className="text-xs text-faint">{CATEGORY_LABELS[lot.category]}</div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">{lot.producer}</td>
                      <td className="tnum px-4 py-2.5 text-right text-muted">{lot.quantityKg} kg</td>
                      <td className="px-4 py-2.5"><VigilanceBadge level={lotVigilance(lot)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        ) : (
        <Panel>
          <PanelHeader
            title="Lots récents"
            action={
              <Link to="/lots" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Tout voir <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 font-medium">Lot</th>
                  <th className="px-4 py-2 font-medium">Produit</th>
                  <th className="px-4 py-2 text-right font-medium">Qté</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Vigilance</th>
                </tr>
              </thead>
              <tbody>
                {lots.slice(0, 7).map((lot) => (
                  <tr key={lot.id} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-4 py-2.5">
                      <Link to={`/passeport/${lot.id}`} className="font-mono text-xs text-info hover:underline">
                        {lot.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-foreground">{lot.product}</div>
                      <div className="text-xs text-faint">{CATEGORY_LABELS[lot.category]}</div>
                    </td>
                    <td className="tnum px-4 py-2.5 text-right text-muted">{lot.quantityKg} kg</td>
                    <td className="px-4 py-2.5"><StatusBadge status={lot.status} /></td>
                    <td className="px-4 py-2.5"><VigilanceBadge level={lotVigilance(lot)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        )}

        <div className="space-y-6">
          {/* Alerts */}
          <Panel>
            <PanelHeader title="Alertes de vigilance" hint="Règles déclenchées automatiquement" />
            {alerts.length === 0 ? (
              <EmptyState>Aucune alerte active.</EmptyState>
            ) : (
              <ul className="divide-y divide-border/50">
                {alerts.slice(0, 5).map((a, i) => {
                  const lot = lots.find((l) => l.id === a.lotId);
                  const toOp = lot?.operationId && role !== "producteur";
                  const href = toOp ? `/operation/${lot.operationId}` : `/passeport/${a.lotId}`;
                  const lastNote = lot
                    ? operationRouteEvents([lot]).find((e) => e.type === "incident" || e.type === "retard")?.note
                    : undefined;
                  return (
                  <li key={i} className="flex items-start gap-3 px-4 py-3">
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${a.level === "alerte" ? "text-alerte" : "text-vigilance"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={href} className="font-mono text-xs text-info hover:underline">
                          {toOp ? lot.operationId : a.lotId}
                        </Link>
                        <VigilanceBadge level={a.level} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{a.message}</p>
                      {lastNote && lastNote !== a.message && (
                        <p className="mt-0.5 truncate text-xs text-faint">{lastNote}</p>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {role !== "transporteur" && (
          <Panel>
            <PanelHeader
              title="Opérations"
              action={
                role === "operateur" ? (
                  <Link to="/operations" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Tout voir <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : undefined
              }
            />
            {operations.length === 0 ? (
              <EmptyState>
                {perms.scopeOwn
                  ? "Aucune opération ne concerne vos lots."
                  : "Aucune opération enregistrée."}
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border/50">
                {rankedOps.map((op) => {
                  const opAlerts = alerts.filter((a) => op.lotIds.includes(a.lotId));
                  const worst = opAlerts.some((a) => a.level === "alerte")
                    ? "alerte"
                    : opAlerts.length
                      ? "vigilance"
                      : "ok";
                  return (
                  <li key={op.id}>
                    <Link to={`/operation/${op.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/50">
                      <Truck className="size-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground">{op.id}</span>
                          <OperationStatusBadge status={op.status} />
                          {worst !== "ok" && <VigilanceBadge level={worst} />}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-faint">
                          {op.corridor}
                          {op.carrier ? ` · ${op.carrier}` : ""}
                        </p>
                      </div>
                      <span className="tnum text-xs text-muted">{op.lotIds.length} lots</span>
                    </Link>
                  </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          )}
        </div>
      </div>

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
