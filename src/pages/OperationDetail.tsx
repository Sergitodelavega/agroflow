import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Package, Truck } from "lucide-react";
import { useStore } from "../lib/store";
import { useRole } from "../lib/role";
import { CARRIERS } from "../lib/seed";
import { deriveAlerts, dedupeAlerts, operationRouteEvents } from "../lib/alerts";
import {
  EVENT_LABELS,
  type EventType,
  type LotEvent,
  type Vigilance,
} from "../lib/types";
import { estimateGroup, formatFcfa, savingsHint } from "../lib/savings";
import { Button, Field, Input, OperationStatusConfirm, Panel, PanelHeader, Select } from "../components/ui";
import { OperationStatusBadge, StatusBadge, VigilanceBadge } from "../components/badges";

// Départ et livraison restent les boutons de statut. Ici : événements de route.
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const eventDot: Record<string, string> = {
  ok: "border-primary bg-primary/20",
  vigilance: "border-vigilance bg-vigilance/20",
  alerte: "border-alerte bg-alerte/20",
};

const EVENT_OPTIONS: EventType[] = ["controle", "retard", "incident"];
const DEFAULT_VIGILANCE: Record<EventType, Vigilance> = {
  creation: "ok",
  regroupement: "ok",
  depart: "ok",
  controle: "ok",
  retard: "vigilance",
  incident: "alerte",
  livraison: "ok",
};

export default function OperationDetail() {
  const { id } = useParams();
  const { operations, lots, addOperationEvent, setOperationStatus, assignCarrier } = useStore();
  const { role, perms, profile } = useRole();
  const op = operations.find((o) => o.id === id);
  const assignedHere = !op || role !== "transporteur" || op.carrier === profile.org;

  const [eventType, setEventType] = useState<EventType>("controle");
  const [note, setNote] = useState("");
  const [pendingStatus, setPendingStatus] = useState<"en_cours" | "livree" | null>(null);

  if (!op || !assignedHere) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Opération introuvable</h1>
        <Link to="/" className="text-sm text-primary hover:underline">← Retour au tableau de bord</Link>
      </div>
    );
  }

  const opLots = lots.filter((l) => op.lotIds.includes(l.id));
  const volume = opLots.reduce((s, l) => s + l.quantityKg, 0);
  const savings = estimateGroup(opLots);
  const fill = Math.round((volume / op.vehicleCapacityKg) * 100);
  const overCapacity = volume > op.vehicleCapacityKg;
  const alerts = dedupeAlerts(
    deriveAlerts(lots, operations).filter((a) => op.lotIds.includes(a.lotId)),
  );
  const routeEvents = operationRouteEvents(opLots);
  const opsHome = perms.nav.includes("operations") ? "/operations" : "/";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addOperationEvent(
      op.id,
      eventType,
      note || EVENT_LABELS[eventType],
      DEFAULT_VIGILANCE[eventType],
    );
    setNote("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={opsHome} className="text-xs text-faint hover:text-muted">
            {opsHome === "/operations" ? "← Opérations" : "← Tableau de bord"}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl font-semibold tracking-tight">{op.id}</h1>
            <OperationStatusBadge status={op.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {op.corridor}
            {op.carrier ? ` · ${op.carrier}` : ""}
          </p>
        </div>
        {perms.canManageOperation && (
          <div className="flex items-center gap-2">
            {op.status === "planifiee" && (
              <Button variant="primary" onClick={() => setPendingStatus("en_cours")}>
                <Truck className="size-4" /> Démarrer le transport
              </Button>
            )}
            {op.status === "en_cours" && (
              <Button variant="primary" onClick={() => setPendingStatus("livree")}>
                <CheckCircle2 className="size-4" /> Marquer livrée
              </Button>
            )}
            {op.status === "livree" && (
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary">
                <CheckCircle2 className="size-4" /> Opération livrée
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {perms.canGroup && (
            <Panel>
              <PanelHeader
                title="Transporteur assigné"
                hint={
                  op.status === "planifiee"
                    ? "Modifiable tant que le départ n'a pas eu lieu"
                    : "Figé une fois le transport lancé"
                }
              />
              <div className="p-4">
                {op.status === "planifiee" ? (
                  <Field label="Transporteur">
                    <Select
                      value={op.carrier}
                      onChange={(e) => assignCarrier(op.id, e.target.value)}
                    >
                      {op.carrier &&
                        !(CARRIERS as readonly string[]).includes(op.carrier) && (
                          <option value={op.carrier}>{op.carrier}</option>
                        )}
                      {CARRIERS.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <p className="text-sm text-foreground">{op.carrier || "Non assigné"}</p>
                )}
              </div>
            </Panel>
          )}

          {/* Capacity */}
          <Panel>
            <PanelHeader title="Chargement" hint={`Capacité véhicule ${op.vehicleCapacityKg.toLocaleString("fr-FR")} kg`} />
            <div className="p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="tnum text-2xl font-semibold text-primary">{volume.toLocaleString("fr-FR")} kg</div>
                  <div className="text-xs text-muted">{opLots.length} lots regroupés</div>
                </div>
                <div className={`tnum text-sm font-medium ${overCapacity ? "text-alerte" : "text-muted"}`}>{fill}% rempli</div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${overCapacity ? "bg-alerte" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, fill)}%` }}
                />
              </div>
              {overCapacity && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-alerte">
                  <AlertTriangle className="size-3.5" /> Capacité dépassée — répartir sur un second véhicule.
                </p>
              )}
              {savings.lotCount >= 2 && (
                <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider text-faint">Économie estimée</div>
                      <p className="mt-0.5 text-xs text-muted">{savingsHint(savings)}</p>
                    </div>
                    <div className="tnum text-lg font-semibold text-primary">{formatFcfa(savings.savedFcfa)}</div>
                  </div>
                  <p className="mt-1.5 text-xs text-faint">
                    {formatFcfa(savings.soloFcfa)} en courses seules − {formatFcfa(savings.sharedFcfa)} la tournée.
                  </p>
                </div>
              )}
            </div>
          </Panel>

          {/* Lots */}
          <Panel>
            <PanelHeader title="Lots de l'opération" />
            <ul className="divide-y divide-border/50">
              {opLots.map((l) => (
                <li key={l.id}>
                  <Link to={`/passeport/${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/50">
                    <Package className="size-4 shrink-0 text-faint" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-info">{l.id}</span>
                        <span className="text-sm text-foreground">{l.product}</span>
                      </div>
                      <div className="text-xs text-faint">{l.producer} · {l.origin.name}</div>
                    </div>
                    <span className="tnum text-xs text-muted">{l.quantityKg} kg</span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          {/* Log event */}
          {perms.canLogEvent && (
          <Panel>
            <PanelHeader title="Enregistrer un événement" hint="Reporté sur tous les lots de la tournée" />
            <form onSubmit={submit} className="space-y-4 p-4">
              <Field label="Type d'événement">
                <Select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
                  {EVENT_OPTIONS.map((t) => <option key={t} value={t}>{EVENT_LABELS[t]}</option>)}
                </Select>
              </Field>
              <Field label="Note (optionnelle)">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. Contrôle à Bambey, tout est conforme" />
              </Field>
              <div className="flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 text-xs">
                <span className="text-faint">Vigilance appliquée :</span>
                <VigilanceBadge level={DEFAULT_VIGILANCE[eventType]} />
              </div>
              <Button type="submit" variant="outline" className="w-full">
                <Truck className="size-4" /> Enregistrer l'événement
              </Button>
              <p className="text-xs text-faint">
                L'événement est ajouté à l'historique de chaque lot de {op.id}.
              </p>
            </form>
          </Panel>
          )}

          <Panel>
            <PanelHeader
              title="Chronologie de route"
              hint={
                routeEvents.length
                  ? `${routeEvents.length} événement(s) · lecture seule`
                  : "Aucun événement déclaré pour l'instant"
              }
            />
            {routeEvents.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-faint">
                {perms.canLogEvent
                  ? "Déclarez un contrôle, un retard ou un incident avec le formulaire."
                  : "Le transporteur assigné déclarera les événements après le départ."}
              </div>
            ) : (
              <ol className="p-5">
                {routeEvents.map((e: LotEvent, i) => (
                  <li key={`${e.type}-${e.at}-${e.note}`} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < routeEvents.length - 1 && (
                      <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
                    )}
                    <span className={`relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 ${eventDot[e.vigilance]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{EVENT_LABELS[e.type]}</span>
                        {e.vigilance !== "ok" && <VigilanceBadge level={e.vigilance} />}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">{e.note}</p>
                      <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-faint">
                        <Clock className="size-2.5" /> {fmtDateTime(e.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {/* Alerts */}
          <Panel>
            <PanelHeader title="Alertes de l'opération" />
            {alerts.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-primary">Aucune alerte · situation nominale</div>
            ) : (
              <ul className="divide-y divide-border/50">
                {alerts.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3">
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${a.level === "alerte" ? "text-alerte" : "text-vigilance"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-info">{op.id}</span>
                        <VigilanceBadge level={a.level} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{a.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <OperationStatusConfirm
        open={pendingStatus !== null}
        status={pendingStatus}
        lotCount={op.lotIds.length}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => {
          if (!pendingStatus) return;
          setOperationStatus(op.id, pendingStatus);
          setPendingStatus(null);
        }}
      />
    </div>
  );
}
