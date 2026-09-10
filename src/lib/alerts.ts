import type { EventType, Lot, LotEvent, Operation, Vigilance } from "./types";

const ROUTE_EVENT_TYPES = new Set<EventType>([
  "depart",
  "controle",
  "retard",
  "incident",
  "livraison",
]);

/** Événements de route d'une opération, dédupliqués (copie sur chaque lot). */
export function operationRouteEvents(lots: Lot[]): LotEvent[] {
  const seen = new Set<string>();
  const events: LotEvent[] = [];
  for (const lot of lots) {
    for (const event of lot.events) {
      if (!ROUTE_EVENT_TYPES.has(event.type)) continue;
      const key = `${event.type}|${event.at}|${event.note}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push(event);
    }
  }
  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export interface Alert {
  level: Vigilance;
  lotId: string;
  lotLabel: string;
  message: string;
}

const rank: Record<Vigilance, number> = { ok: 0, vigilance: 1, alerte: 2 };

/** Highest vigilance recorded across a lot's events. */
export function lotVigilance(lot: Lot): Vigilance {
  return lot.events.reduce<Vigilance>(
    (max, e) => (rank[e.vigilance] > rank[max] ? e.vigilance : max),
    "ok",
  );
}

/**
 * Derive active alerts from declared rules (brief §7):
 * - incident → alerte
 * - retard → vigilance
 * - lot périssable dont la période de disponibilité est dépassée → alerte
 * - opération dont le volume dépasse la capacité véhicule → vigilance
 */
export function deriveAlerts(lots: Lot[], operations: Operation[]): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();

  for (const lot of lots) {
    const label = `${lot.id} · ${lot.product}`;

    if (lot.events.some((e) => e.type === "incident")) {
      alerts.push({
        level: "alerte",
        lotId: lot.id,
        lotLabel: label,
        message: "Incident signalé pendant le transport",
      });
    } else if (lot.events.some((e) => e.type === "retard")) {
      alerts.push({
        level: "vigilance",
        lotId: lot.id,
        lotLabel: label,
        message: "Retard déclaré sur le parcours",
      });
    }

    if (
      lot.constraints.includes("perissable") &&
      lot.status !== "livre" &&
      new Date(lot.availableTo).getTime() < now
    ) {
      alerts.push({
        level: "alerte",
        lotId: lot.id,
        lotLabel: label,
        message: "Produit périssable : période de disponibilité dépassée",
      });
    }
  }

  for (const op of operations) {
    const volume = lots
      .filter((l) => op.lotIds.includes(l.id))
      .reduce((s, l) => s + l.quantityKg, 0);
    if (volume > op.vehicleCapacityKg) {
      for (const id of op.lotIds) {
        const lot = lots.find((l) => l.id === id);
        if (!lot) continue;
        alerts.push({
          level: "vigilance",
          lotId: id,
          lotLabel: `${lot.id} · ${lot.product}`,
          message: `Capacité véhicule dépassée sur ${op.id} (${volume} / ${op.vehicleCapacityKg} kg)`,
        });
      }
    }
  }

  return alerts.sort((a, b) => rank[b.level] - rank[a.level]);
}

/** Un événement d'opération est recopié sur chaque lot : on n'affiche le message qu'une fois. */
export function dedupeAlerts(alerts: Alert[]): Alert[] {
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = `${a.level}|${a.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
