import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Truck } from "lucide-react";
import { useStore } from "../lib/store";
import { useRole, lotsForViewer, operationsForViewer } from "../lib/role";
import { deriveAlerts, dedupeAlerts, lotVigilance, operationRouteEvents } from "../lib/alerts";
import { CATEGORY_LABELS } from "../lib/types";
import { estimateOperations, estimateViewerSavings, formatFcfa } from "../lib/savings";
import {
  Button,
  KPIStat,
  OperationStatusConfirm,
  Panel,
  PanelHeader,
  EmptyState,
  EmptyStateLink,
} from "../components/ui";
import {
  OperationStatusBadge,
  StatusBadge,
  VigilanceBadge,
} from "../components/badges";

function SeeAll({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1 text-[14px] text-foreground hover:text-muted">
      {children} <ArrowUpRight className="size-3.5" />
    </Link>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[14px]">
        <span className="text-muted">{label}</span>
        <span className="tnum font-medium text-foreground">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-[16px] bg-background">
        <div className="h-full rounded-[16px] bg-foreground" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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
  // Tiret plutôt qu'un point : les noms abrégés (« Adjovi H. ») finissent déjà par un point.
  const intro =
    role === "producteur"
      ? `Bienvenue ${profile.name} — voici les lots de ${profile.org}, leur compatibilité et les alertes.`
      : role === "transporteur"
        ? `Bienvenue ${profile.name} — voici les opérations à prendre en charge et les alertes de transport.`
        : role === "operateur"
          ? `Bienvenue ${profile.name} — voici les lots à regrouper, les opérations par transporteur et les alertes du réseau.`
          : `Bienvenue ${profile.name} — vue consolidée des lots, des opérations et des alertes.`;

  // Espace vierge (compte fraîchement créé) : un accueil qui explique le premier geste,
  // plutôt qu'une grille d'indicateurs à zéro et des tableaux vides.
  if (lots.length === 0 && operations.length === 0) {
    const blank =
      role === "producteur"
        ? {
            title: "Enregistrez votre premier lot",
            body: "Déclarez le produit, la quantité, le trajet et la fenêtre de disponibilité. L'opérateur logistique pourra ensuite le rapprocher d'autres besoins pour partager un véhicule.",
            action: <EmptyStateLink to="/creer">Créer un lot</EmptyStateLink>,
          }
        : role === "transporteur"
          ? {
              title: "Aucune tournée ne vous est assignée",
              body: "Dès qu'un opérateur logistique regroupe des lots sur l'un de vos corridors, l'opération apparaît ici avec ses lots, son volume et ses alertes.",
              action: <EmptyStateLink to="/operations">Voir les opérations</EmptyStateLink>,
            }
          : {
              title: "Aucun lot sur votre réseau",
              body: "Les besoins de transport déclarés par les producteurs arrivent dans l'inventaire. Vous pourrez alors analyser la compatibilité et créer une opération.",
              action: <EmptyStateLink to="/lots">Ouvrir l'inventaire</EmptyStateLink>,
            };

    return (
      <div className="space-y-8">
        <div>
          <h1 className="app-heading text-[clamp(26px,7vw,33px)] text-foreground">
            Tableau de bord
          </h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-normal tracking-[-0.18px] text-muted">
            Bienvenue {profile.name} — votre espace {profile.org} est vide pour le moment.
          </p>
        </div>
        <Panel>
          <PanelHeader title="Premiers pas" hint="Ce qui débloque la suite" />
          <EmptyState title={blank.title} action={blank.action}>
            {blank.body}
          </EmptyState>
        </Panel>
      </div>
    );
  }

  const totalVolume = lots.reduce((s, l) => s + l.quantityKg, 0);
  const pooled = lots.filter((l) => l.operationId).length;
  const poolingRate = lots.length ? Math.round((pooled / lots.length) * 100) : 0;
  const inTransit = lots.filter((l) => l.status === "en_transport").length;
  const viewerSavings = estimateViewerSavings(lots, operations, allLots);
  const networkSavings = estimateOperations(operations, allLots);
  const alertRate = lots.length ? Math.round((alerts.length / lots.length) * 100) : 0;
  const runningRate = operations.length ? Math.round((runningOps / operations.length) * 100) : 0;
  const plannedRate = operations.length ? Math.round((plannedOps / operations.length) * 100) : 0;
  const ungroupedRate = lots.length ? Math.round((ungroupedLots.length / lots.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="app-heading text-[clamp(26px,7vw,33px)] text-foreground">
          Tableau de bord
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-normal tracking-[-0.18px] text-muted">{intro}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {role === "transporteur" ? (
          <>
            <KPIStat label="À prendre en charge" value={plannedOps} sub="opération(s) planifiée(s)" />
            <KPIStat label="En cours" value={runningOps} sub="tournée(s) sur la route" />
            <KPIStat label="Lots en transport" value={inTransit} sub={`${lots.length} lot(s) dans les opérations`} />
            <KPIStat label="Alertes de route" value={alerts.length} sub={`${alerts.filter((a) => a.level === "alerte").length} critique(s)`} accent={alerts.some((a) => a.level === "alerte") ? "alerte" : "foreground"} />
          </>
        ) : role === "operateur" ? (
          <>
            <KPIStat label="À regrouper" value={ungroupedLots.length} sub="lot(s) sans opération" />
            <KPIStat label="En cours" value={runningOps} sub="tournée(s) sur la route" />
            <KPIStat
              label="Économie estimée"
              value={formatFcfa(networkSavings.savedFcfa)}
              sub={`${networkSavings.tripsAvoided} course(s) évitée(s) · ${plannedOps} planifiée(s)`}
            />
            <KPIStat label="Alertes réseau" value={alerts.length} sub={`${alerts.filter((a) => a.level === "alerte").length} critique(s)`} accent={alerts.some((a) => a.level === "alerte") ? "alerte" : "foreground"} />
          </>
        ) : (
          <>
            <KPIStat label="Volume total" value={`${totalVolume.toLocaleString("fr-FR")} kg`} sub={`${lots.length} lot(s)`} />
            <KPIStat
              label="Économie estimée"
              value={formatFcfa(viewerSavings.savedFcfa)}
              sub={`${poolingRate}% mutualisés · ${viewerSavings.tripsAvoided} course(s) évitée(s)`}
            />
            <KPIStat
              label="En transport"
              value={inTransit}
              sub={
                operations.length === 0
                  ? "Aucune opération"
                  : `${operations.length} opération${operations.length > 1 ? "s" : ""}`
              }
            />
            <KPIStat label="Alertes actives" value={alerts.length} sub={`${alerts.filter((a) => a.level === "alerte").length} critique(s)`} accent={alerts.some((a) => a.level === "alerte") ? "alerte" : "foreground"} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        {role === "transporteur" ? (
        <Panel>
          <PanelHeader
            title="Opérations"
            action={<SeeAll to="/operations">Tout voir</SeeAll>}
          />
          {rankedOps.length === 0 ? (
            <EmptyState>Aucune opération ne vous est assignée.</EmptyState>
          ) : (
            <ul className="divide-y divide-border/50">
              {rankedOps.map((op) => (
                <li key={op.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Link to={`/operation/${op.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
                    <Truck className="size-4 shrink-0 text-foreground" />
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
                <SeeAll to={`/compatibilite?lot=${ungroupedLots[0].id}`}>Analyser</SeeAll>
              ) : (
                <SeeAll to="/lots">Tout voir</SeeAll>
              )
            }
          />
          {ungroupedLots.length === 0 ? (
            <EmptyState
              title="Aucun lot en attente"
              action={<EmptyStateLink to="/lots">Ouvrir l'inventaire</EmptyStateLink>}
            >
              Tous les lots enregistrés sont déjà rattachés à une opération.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[14px] text-faint">
                    <th className="px-4 py-2 font-medium">Lot</th>
                    <th className="px-4 py-2 font-medium">Produit</th>
                    <th className="px-4 py-2 font-medium">Producteur</th>
                    <th className="px-4 py-2 text-right font-medium">Qté</th>
                    <th className="px-4 py-2 font-medium">Vigilance</th>
                  </tr>
                </thead>
                <tbody>
                  {ungroupedLots.slice(0, 7).map((lot) => (
                    <tr key={lot.id} className="border-b border-border/50 last:border-0 hover:bg-background">
                      <td className="px-4 py-2.5">
                        <Link to={`/passeport/${lot.id}`} className="font-mono text-xs text-foreground hover:underline">
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
            action={<SeeAll to="/lots">Tout voir</SeeAll>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[14px] text-faint">
                  <th className="px-4 py-2 font-medium">Lot</th>
                  <th className="px-4 py-2 font-medium">Produit</th>
                  <th className="px-4 py-2 text-right font-medium">Qté</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Vigilance</th>
                </tr>
              </thead>
              <tbody>
                {lots.slice(0, 7).map((lot) => (
                  <tr key={lot.id} className="border-b border-border/50 last:border-0 hover:bg-background">
                    <td className="px-4 py-2.5">
                      <Link to={`/passeport/${lot.id}`} className="font-mono text-xs text-foreground hover:underline">
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
          <Panel>
            <PanelHeader title="Indicateurs" hint="Lecture rapide de votre périmètre" />
            <div className="space-y-5 px-5 py-5">
              {role === "transporteur" ? (
                <>
                  <Meter label="Tournées en cours" value={runningRate} />
                  <Meter label="Opérations planifiées" value={plannedRate} />
                  <Meter label="Lots concernés par une alerte" value={alertRate} />
                </>
              ) : role === "operateur" ? (
                <>
                  <Meter label="Lots encore à regrouper" value={ungroupedRate} />
                  <Meter label="Tournées en cours" value={runningRate} />
                  <Meter label="Lots concernés par une alerte" value={alertRate} />
                </>
              ) : (
                <>
                  <Meter label="Lots mutualisés" value={poolingRate} />
                  <Meter label="Lots concernés par une alerte" value={alertRate} />
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-muted">Courses évitées</span>
                    <span className="tnum font-medium text-foreground">{viewerSavings.tripsAvoided}</span>
                  </div>
                </>
              )}
            </div>
          </Panel>

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
                        <Link to={href} className="font-mono text-xs text-foreground hover:underline">
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
                  <SeeAll to="/operations">Tout voir</SeeAll>
                ) : undefined
              }
            />
            {operations.length === 0 ? (
              <EmptyState
                title={perms.scopeOwn ? "Vos lots attendent un regroupement" : "Aucune opération"}
                action={
                  perms.nav.includes("compatibilite") && ungroupedLots.length > 0 ? (
                    <EmptyStateLink to={`/compatibilite?lot=${ungroupedLots[0].id}`}>
                      Voir la compatibilité
                    </EmptyStateLink>
                  ) : undefined
                }
              >
                {perms.scopeOwn
                  ? "L'opérateur logistique crée l'opération dès que des lots compatibles peuvent partager un véhicule."
                  : "Aucune tournée n'a encore été constituée."}
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
                    <Link to={`/operation/${op.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-background">
                      <Truck className="size-4 shrink-0 text-foreground" />
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
