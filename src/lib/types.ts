export type ProductCategory =
  | "cereales"
  | "fruits"
  | "legumes"
  | "tubercules"
  | "oleagineux"
  | "elevage";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cereales: "Céréales",
  fruits: "Fruits",
  legumes: "Légumes",
  tubercules: "Tubercules",
  oleagineux: "Oléagineux",
  elevage: "Produits d'élevage",
};

export type Constraint = "perissable" | "refrigere" | "fragile" | "sec";

export const CONSTRAINT_LABELS: Record<Constraint, string> = {
  perissable: "Périssable",
  refrigere: "Réfrigéré",
  fragile: "Fragile",
  sec: "Stockage sec",
};

export type LotStatus = "enregistre" | "regroupe" | "en_transport" | "livre";

export const STATUS_LABELS: Record<LotStatus, string> = {
  enregistre: "Enregistré",
  regroupe: "Regroupé",
  en_transport: "En transport",
  livre: "Livré",
};

export type Vigilance = "ok" | "vigilance" | "alerte";

export const VIGILANCE_LABELS: Record<Vigilance, string> = {
  ok: "Nominal",
  vigilance: "Vigilance",
  alerte: "Alerte",
};

export type EventType =
  | "creation"
  | "regroupement"
  | "depart"
  | "controle"
  | "retard"
  | "incident"
  | "livraison";

export const EVENT_LABELS: Record<EventType, string> = {
  creation: "Création du lot",
  regroupement: "Regroupement",
  depart: "Départ",
  controle: "Contrôle",
  retard: "Retard déclaré",
  incident: "Incident signalé",
  livraison: "Livraison",
};

export interface LotEvent {
  id: string;
  type: EventType;
  at: string; // ISO date
  note: string;
  vigilance: Vigilance;
}

/** Zones with approximate normalized coordinates (0-100) for the flow map. */
export interface GeoPoint {
  name: string;
  x: number;
  y: number;
}

export interface Lot {
  id: string;
  producer: string;
  product: string;
  category: ProductCategory;
  quantityKg: number;
  origin: GeoPoint;
  destination: GeoPoint;
  availableFrom: string; // ISO date
  availableTo: string; // ISO date
  constraints: Constraint[];
  status: LotStatus;
  operationId?: string;
  events: LotEvent[];
  createdAt: string;
}

export type OperationStatus = "planifiee" | "en_cours" | "livree";

export const OPERATION_STATUS_LABELS: Record<OperationStatus, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  livree: "Livrée",
};

export interface Operation {
  id: string;
  lotIds: string[];
  corridor: string;
  carrier: string;
  vehicleCapacityKg: number;
  status: OperationStatus;
  createdAt: string;
}

export interface AppState {
  lots: Lot[];
  operations: Operation[];
}
