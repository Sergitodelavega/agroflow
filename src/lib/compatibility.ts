import type { Lot } from "./types";
import { CATEGORY_LABELS, CONSTRAINT_LABELS } from "./types";

export interface CompatibilityResult {
  score: number; // 0-100
  reasons: string[]; // positive contributions
  blockers: string[]; // hard incompatibilities
  compatible: boolean;
}

function daysOverlap(a: Lot, b: Lot): number {
  const start = Math.max(
    new Date(a.availableFrom).getTime(),
    new Date(b.availableFrom).getTime(),
  );
  const end = Math.min(
    new Date(a.availableTo).getTime(),
    new Date(b.availableTo).getTime(),
  );
  if (end < start) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function distance(a: Lot, b: Lot): number {
  const dx = a.origin.x - b.origin.x;
  const dy = a.origin.y - b.origin.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Multi-criteria compatibility scoring between two lots, following brief §7:
 * product category, collection zone proximity, destination/corridor,
 * availability window overlap, quantity/capacity, declared constraints.
 */
export function scoreCompatibility(a: Lot, b: Lot): CompatibilityResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  // Product category — 25 pts
  if (a.category === b.category) {
    score += 25;
    reasons.push(`Même catégorie de produit (${CATEGORY_LABELS[a.category]})`);
  }

  // Destination / corridor — 25 pts
  if (a.destination.name === b.destination.name) {
    score += 25;
    reasons.push(`Destination commune (${a.destination.name})`);
  } else {
    blockers.push(
      `Destinations différentes (${a.destination.name} ≠ ${b.destination.name})`,
    );
  }

  // Collection zone proximity — 20 pts
  const d = distance(a, b);
  if (d < 8) {
    score += 20;
    reasons.push(`Zones de collecte très proches (${a.origin.name} / ${b.origin.name})`);
  } else if (d < 22) {
    score += 12;
    reasons.push(`Zones de collecte sur le même axe`);
  }

  // Availability window overlap — 20 pts
  const overlap = daysOverlap(a, b);
  if (overlap > 0) {
    score += Math.min(20, 8 + overlap * 2);
    reasons.push(`Périodes de disponibilité qui se chevauchent (${overlap} j)`);
  } else {
    blockers.push("Aucun chevauchement des périodes de disponibilité");
  }

  // Declared constraints compatibility — 10 pts / hard blocker
  const aPerissable = a.constraints.includes("perissable");
  const bRefrig = b.constraints.includes("refrigere");
  const bPerissable = b.constraints.includes("perissable");
  const aRefrig = a.constraints.includes("refrigere");
  if ((aPerissable && !aRefrig && bRefrig) || (bPerissable && !bRefrig && aRefrig)) {
    blockers.push("Contraintes incompatibles : périssable non réfrigéré + réfrigéré");
  } else {
    const shared = a.constraints.filter((c) => b.constraints.includes(c));
    if (shared.length > 0) {
      score += 10;
      reasons.push(
        `Contraintes compatibles (${shared.map((c) => CONSTRAINT_LABELS[c]).join(", ")})`,
      );
    } else {
      score += 6;
    }
  }

  const compatible = blockers.length === 0 && score >= 55;
  return { score: Math.min(100, score), reasons, blockers, compatible };
}

export interface GroupingCandidate {
  lot: Lot;
  result: CompatibilityResult;
}

export interface GroupingProposal {
  base: Lot;
  candidates: GroupingCandidate[];
  compatibleLots: Lot[];
  totalVolumeKg: number;
}

/** Build a grouping proposal around a base lot from the pool of available lots. */
export function proposeGrouping(base: Lot, pool: Lot[]): GroupingProposal {
  const candidates = pool
    .filter((l) => l.id !== base.id && !l.operationId)
    .map((lot) => ({ lot, result: scoreCompatibility(base, lot) }))
    .sort((a, b) => b.result.score - a.result.score);

  const compatibleLots = candidates
    .filter((c) => c.result.compatible)
    .map((c) => c.lot);

  const totalVolumeKg =
    base.quantityKg + compatibleLots.reduce((s, l) => s + l.quantityKg, 0);

  return { base, candidates, compatibleLots, totalVolumeKg };
}
