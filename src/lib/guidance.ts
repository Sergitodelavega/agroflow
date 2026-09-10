import type { Lot, Operation } from "./types";
import type { Permissions, Role } from "./role";

export type NextStep = {
  title: string;
  body: string;
  actionLabel: string;
  to: string;
};

function pathName(path: string): string {
  return path.split("?")[0] || "/";
}

function ungrouped(lots: Lot[]): Lot[] {
  return lots.filter((l) => !l.operationId && l.status === "enregistre");
}

function alreadyOn(path: string, to: string): boolean {
  return pathName(path) === pathName(to);
}

function refine(path: string, step: NextStep, perms: Permissions): NextStep {
  const here = pathName(path);

  if (here.startsWith("/operation/")) {
    if (alreadyOn(path, step.to) && (perms.canManageOperation || perms.canLogEvent)) {
      return {
        ...step,
        body: "Pilotez le statut ou déclarez un événement avec le formulaire de cette page.",
      };
    }
    if (
      alreadyOn(path, step.to) &&
      !perms.canManageOperation &&
      !perms.canLogEvent
    ) {
      return {
        ...step,
        body: perms.canGroup
          ? "Consultez la chronologie de route et les alertes. Le transporteur assigné pilote le statut."
          : "Consultez le regroupement de vos lots. Le transporteur pilote le statut.",
      };
    }
  }

  if (!alreadyOn(path, step.to)) return step;
  if (here === "/creer") {
    return {
      ...step,
      body: "Renseignez le formulaire puis enregistrez le lot.",
    };
  }
  if (here === "/compatibilite") {
    return {
      ...step,
      body: perms.canGroup
        ? "Cochez les lots compatibles, puis validez le regroupement."
        : "Consultez les lots compatibles. L'opérateur créera l'opération.",
    };
  }
  if (here.startsWith("/passeport/")) {
    return {
      ...step,
      body: "Vérifiez l'identité, le QR et l'historique de ce lot.",
    };
  }
  return step;
}

function forProducteur(lots: Lot[], perms: Permissions, path: string): NextStep | null {
  const here = pathName(path);
  if (here.startsWith("/operation/")) {
    const opId = here.slice("/operation/".length);
    const ownInOp = lots.find((l) => l.operationId === opId);
    if (ownInOp) {
      return {
        title: "Prochain pas",
        body: "Votre lot fait partie de ce regroupement. Ouvrez son passeport pour le suivi.",
        actionLabel: "Ouvrir le passeport",
        to: `/passeport/${ownInOp.id}`,
      };
    }
    return {
      title: "Prochain pas",
      body: "Cette opération ne contient pas vos lots. Retrouvez-les dans l'inventaire.",
      actionLabel: "Voir mes lots",
      to: "/lots",
    };
  }

  const pending = ungrouped(lots);
  if (here === "/compatibilite") {
    const lotId =
      new URLSearchParams(path.split("?")[1] || "").get("lot") || pending[0]?.id;
    if (lotId) {
      return {
        title: "Prochain pas",
        body: path.includes("nouveau=1")
          ? "Votre lot est chez l'opérateur. Ouvrez le passeport pour le suivre."
          : "L'opérateur créera l'opération. Vous pouvez déjà ouvrir le passeport de ce lot.",
        actionLabel: "Ouvrir le passeport",
        to: `/passeport/${lotId}`,
      };
    }
  }
  if (pending.length && perms.nav.includes("compatibilite")) {
    return {
      title: "Prochain pas",
      body:
        pending.length === 1
          ? "Un de vos lots peut être rapproché d'autres besoins."
          : `${pending.length} de vos lots peuvent être rapprochés d'autres besoins.`,
      actionLabel: "Voir la compatibilité",
      to: `/compatibilite?lot=${pending[0].id}`,
    };
  }
  if (perms.canCreateLot) {
    return {
      title: "Prochain pas",
      body: "Enregistrez un lot pour le rapprocher d'autres besoins.",
      actionLabel: "Créer un lot",
      to: "/creer",
    };
  }
  return null;
}

function opHasRouteIssue(op: Operation, lots: Lot[]): boolean {
  return lots.some(
    (l) =>
      op.lotIds.includes(l.id) &&
      l.events.some((e) => e.type === "incident" || e.type === "retard"),
  );
}

function forTransporteur(lots: Lot[], operations: Operation[], perms: Permissions): NextStep | null {
  const running = operations.filter((o) => o.status === "en_cours");
  const urgent = running.find((o) => opHasRouteIssue(o, lots));
  if (urgent && perms.canLogEvent) {
    return {
      title: "Prochain pas",
      body: `L'opération ${urgent.id} signale un retard ou un incident.`,
      actionLabel: "Ouvrir l'opération",
      to: `/operation/${urgent.id}`,
    };
  }
  const runningFirst = running[0];
  if (runningFirst && perms.canLogEvent) {
    return {
      title: "Prochain pas",
      body: `Déclarez un événement sur l'opération ${runningFirst.id}.`,
      actionLabel: "Déclarer un événement",
      to: `/operation/${runningFirst.id}`,
    };
  }
  const planned = operations.find((o) => o.status === "planifiee");
  if (planned && perms.canManageOperation) {
    return {
      title: "Prochain pas",
      body: `L'opération ${planned.id} est planifiée et attend le départ.`,
      actionLabel: "Ouvrir l'opération",
      to: `/operation/${planned.id}`,
    };
  }
  const inTransit = lots.find((l) => l.status === "en_transport");
  if (inTransit) {
    return {
      title: "Prochain pas",
      body: "Consultez le parcours d'un lot en transport.",
      actionLabel: "Ouvrir le passeport",
      to: `/passeport/${inTransit.id}`,
    };
  }
  if (operations.length === 0) {
    return {
      title: "Prochain pas",
      body: "Aucune tournée ne vous est encore assignée. L'opérateur logistique vous attribuera une opération dès qu'un regroupement sera prêt.",
      actionLabel: "Voir les opérations",
      to: "/operations",
    };
  }
  return null;
}

function forAcheteur(lots: Lot[]): NextStep | null {
  const incoming = lots.find((l) => l.status === "livre" || l.status === "en_transport");
  const target = incoming ?? lots[0];
  if (!target) return null;
  return {
    title: "Prochain pas",
    body: "Vérifiez l'identité et le parcours déclaré du lot.",
    actionLabel: "Ouvrir le passeport",
    to: `/passeport/${target.id}`,
  };
}

function forOperateur(lots: Lot[], operations: Operation[], perms: Permissions): NextStep | null {
  const running = operations.filter((o) => o.status === "en_cours");
  const urgent = running.find((o) => opHasRouteIssue(o, lots));
  if (urgent) {
    return {
      title: "Prochain pas",
      body: `L'opération ${urgent.id} signale un retard ou un incident.`,
      actionLabel: "Suivre l'alerte",
      to: `/operation/${urgent.id}`,
    };
  }

  const pending = ungrouped(lots);
  if (pending.length && perms.canGroup) {
    return {
      title: "Prochain pas",
      body:
        pending.length === 1
          ? "Un lot peut être regroupé."
          : `${pending.length} lots peuvent être regroupés.`,
      actionLabel: "Analyser la compatibilité",
      to: `/compatibilite?lot=${pending[0].id}`,
    };
  }

  const planned = operations.find((o) => o.status === "planifiee");
  if (planned) {
    return {
      title: "Prochain pas",
      body: `L'opération ${planned.id} est planifiée — suivez l'assignation.`,
      actionLabel: "Ouvrir l'opération",
      to: `/operation/${planned.id}`,
    };
  }

  const runningFirst = running[0];
  if (runningFirst) {
    return {
      title: "Prochain pas",
      body: `Suivez la tournée ${runningFirst.id} en cours.`,
      actionLabel: "Ouvrir l'opération",
      to: `/operation/${runningFirst.id}`,
    };
  }

  if (perms.canCreateLot) {
    return {
      title: "Prochain pas",
      body: "Aucun lot en attente. Enregistrez un besoin au nom d'une coopérative.",
      actionLabel: "Créer un lot",
      to: "/creer",
    };
  }
  if (lots.length === 0) {
    return {
      title: "Prochain pas",
      body: "Aucun lot n'est encore enregistré sur votre réseau. Les besoins déclarés par les producteurs apparaîtront dans l'inventaire.",
      actionLabel: "Ouvrir l'inventaire",
      to: "/lots",
    };
  }
  return null;
}

export function getNextStep(input: {
  role: Role;
  path: string;
  lots: Lot[];
  operations: Operation[];
  perms: Permissions;
}): NextStep | null {
  const { role, path, lots, operations, perms } = input;

  let step: NextStep | null = null;
  if (role === "producteur") step = forProducteur(lots, perms, path);
  else if (role === "transporteur") step = forTransporteur(lots, operations, perms);
  else if (role === "acheteur") step = forAcheteur(lots);
  else if (role === "operateur") step = forOperateur(lots, operations, perms);

  if (!step) return null;
  return refine(path, step, perms);
}

export function isCurrentStep(path: string, to: string): boolean {
  return alreadyOn(path, to);
}
