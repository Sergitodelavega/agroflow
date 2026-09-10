import type { Lot, Operation } from "./types";

/**
 * Estimation démo, volontairement simple :
 * chaque lot seul = une course au tarif du marché ;
 * une opération = une seule course (le tarif le plus élevé du groupe).
 * Économie = somme des courses seules − la tournée partagée.
 * Part d'un lot = au prorata du poids.
 */
const TRIP_FCFA: Record<string, number> = {
  "Cotonou — Marché Dantokpa": 25_000,
  "Porto-Novo — Marché Ouando": 22_000,
  "Parakou — Marché central": 18_000,
};

const DEFAULT_TRIP_FCFA = 20_000;

export function tripFcfa(destinationName: string): number {
  return TRIP_FCFA[destinationName] ?? DEFAULT_TRIP_FCFA;
}

export interface GroupSavings {
  lotCount: number;
  tripsAvoided: number;
  soloFcfa: number;
  sharedFcfa: number;
  savedFcfa: number;
}

export function estimateGroup(lots: Lot[]): GroupSavings {
  if (lots.length === 0) {
    return { lotCount: 0, tripsAvoided: 0, soloFcfa: 0, sharedFcfa: 0, savedFcfa: 0 };
  }
  const soloFcfa = lots.reduce((sum, lot) => sum + tripFcfa(lot.destination.name), 0);
  const sharedFcfa = Math.max(...lots.map((lot) => tripFcfa(lot.destination.name)));
  const tripsAvoided = Math.max(0, lots.length - 1);
  return {
    lotCount: lots.length,
    tripsAvoided,
    soloFcfa,
    sharedFcfa,
    savedFcfa: Math.max(0, soloFcfa - sharedFcfa),
  };
}

export function lotShareFcfa(lot: Lot, group: Lot[]): number {
  const { sharedFcfa } = estimateGroup(group);
  const volume = group.reduce((sum, item) => sum + item.quantityKg, 0);
  if (!volume) return sharedFcfa;
  return Math.round(sharedFcfa * (lot.quantityKg / volume));
}

export function lotSavedFcfa(lot: Lot, group: Lot[]): number {
  return Math.max(0, tripFcfa(lot.destination.name) - lotShareFcfa(lot, group));
}

export function estimateOperations(operations: Operation[], lots: Lot[]): GroupSavings {
  return operations.reduce<GroupSavings>(
    (acc, op) => {
      const grouped = lots.filter((lot) => op.lotIds.includes(lot.id));
      const next = estimateGroup(grouped);
      return {
        lotCount: acc.lotCount + next.lotCount,
        tripsAvoided: acc.tripsAvoided + next.tripsAvoided,
        soloFcfa: acc.soloFcfa + next.soloFcfa,
        sharedFcfa: acc.sharedFcfa + next.sharedFcfa,
        savedFcfa: acc.savedFcfa + next.savedFcfa,
      };
    },
    { lotCount: 0, tripsAvoided: 0, soloFcfa: 0, sharedFcfa: 0, savedFcfa: 0 },
  );
}

/** Économie du spectateur : sa part sur chaque opération, calculée sur tous les lots de la tournée. */
export function estimateViewerSavings(
  viewerLots: Lot[],
  operations: Operation[],
  allLots: Lot[],
): GroupSavings {
  let savedFcfa = 0;
  let tripsAvoided = 0;
  let soloFcfa = 0;
  let sharedFcfa = 0;
  let lotCount = 0;

  for (const op of operations) {
    const grouped = allLots.filter((lot) => op.lotIds.includes(lot.id));
    const mine = viewerLots.filter((lot) => op.lotIds.includes(lot.id));
    if (mine.length === 0 || grouped.length === 0) continue;
    const group = estimateGroup(grouped);
    tripsAvoided += group.tripsAvoided;
    for (const lot of mine) {
      lotCount += 1;
      soloFcfa += tripFcfa(lot.destination.name);
      sharedFcfa += lotShareFcfa(lot, grouped);
      savedFcfa += lotSavedFcfa(lot, grouped);
    }
  }

  return { lotCount, tripsAvoided, soloFcfa, sharedFcfa, savedFcfa };
}

export function formatFcfa(value: number): string {
  return `${value.toLocaleString("fr-FR")} F`;
}

export function savingsHint(s: GroupSavings): string {
  if (s.lotCount < 2) return "Regroupez au moins deux lots pour estimer une économie.";
  return `${s.lotCount} courses seules → 1 tournée · ${s.tripsAvoided} course${s.tripsAvoided > 1 ? "s" : ""} évitée${s.tripsAvoided > 1 ? "s" : ""}`;
}
