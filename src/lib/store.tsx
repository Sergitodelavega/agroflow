import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  EventType,
  Lot,
  LotEvent,
  Operation,
  Vigilance,
} from "./types";
import { createSeed } from "./seed";

const STORAGE_KEY = "agroflow.state.v5";

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // ignore corrupted storage
  }
  return createSeed();
}

interface StoreValue extends AppState {
  createLot: (input: NewLotInput) => Lot;
  updateLot: (id: string, input: NewLotInput) => Lot | null;
  cancelLot: (id: string) => boolean;
  createOperation: (base: Lot, lotIds: string[], corridor: string, carrier: string) => Operation;
  addEvent: (lotId: string, type: EventType, note: string, vigilance: Vigilance) => void;
  addOperationEvent: (opId: string, type: EventType, note: string, vigilance: Vigilance) => void;
  getLot: (id: string) => Lot | undefined;
  getOperation: (id: string) => Operation | undefined;
  setOperationStatus: (opId: string, status: Operation["status"]) => void;
  assignCarrier: (opId: string, carrier: string) => boolean;
  resetDemo: () => void;
}

export interface NewLotInput {
  producer: string;
  product: string;
  category: Lot["category"];
  quantityKg: number;
  origin: Lot["origin"];
  destination: Lot["destination"];
  availableFrom: string;
  availableTo: string;
  constraints: Lot["constraints"];
}

// Keep a single Context instance across Vite HMR module reloads. Without this,
// a hot update can leave the mounted Provider and a consumer bound to two
// different context objects, making useStore read null.
const globalStore = globalThis as unknown as {
  __agroflowStoreContext?: React.Context<StoreValue | null>;
};
const StoreContext =
  globalStore.__agroflowStoreContext ??
  (globalStore.__agroflowStoreContext = createContext<StoreValue | null>(null));

function nextId(prefix: string, existing: string[]): string {
  const nums = existing
    .map((id) => parseInt(id.split("-").pop() || "0", 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const createLot = useCallback((input: NewLotInput): Lot => {
    const now = new Date().toISOString();
    let created!: Lot;
    setState((s) => {
      const id = nextId("AGF-2026", s.lots.map((l) => l.id));
      const creationEvent: LotEvent = {
        id: `EVT-${Math.random().toString(36).slice(2, 8)}`,
        type: "creation",
        at: now,
        note: "Lot enregistré via la plateforme",
        vigilance: "ok",
      };
      created = {
        id,
        ...input,
        status: "enregistre",
        events: [creationEvent],
        createdAt: now,
      };
      return { ...s, lots: [created, ...s.lots] };
    });
    return created;
  }, []);

  const updateLot = useCallback((id: string, input: NewLotInput): Lot | null => {
    let updated: Lot | null = null;
    setState((s) => {
      const current = s.lots.find((l) => l.id === id);
      if (!current || current.status !== "enregistre" || current.operationId) return s;
      updated = { ...current, ...input };
      return { ...s, lots: s.lots.map((l) => (l.id === id ? updated! : l)) };
    });
    return updated;
  }, []);

  const cancelLot = useCallback((id: string): boolean => {
    let removed = false;
    setState((s) => {
      const current = s.lots.find((l) => l.id === id);
      if (!current || current.status !== "enregistre" || current.operationId) return s;
      removed = true;
      return { ...s, lots: s.lots.filter((l) => l.id !== id) };
    });
    return removed;
  }, []);

  const createOperation = useCallback(
    (base: Lot, lotIds: string[], corridor: string, carrier: string): Operation => {
      const now = new Date().toISOString();
      let created!: Operation;
      setState((s) => {
        const id = nextId("OP-2026", s.operations.map((o) => o.id));
        const allIds = Array.from(new Set([base.id, ...lotIds]));
        const volume = s.lots
          .filter((l) => allIds.includes(l.id))
          .reduce((sum, l) => sum + l.quantityKg, 0);
        created = {
          id,
          lotIds: allIds,
          corridor,
          carrier,
          vehicleCapacityKg: Math.max(200, Math.ceil(volume / 50) * 50 + 50),
          status: "planifiee",
          createdAt: now,
        };
        const lots = s.lots.map((l) =>
          allIds.includes(l.id)
            ? {
                ...l,
                status: "regroupe" as const,
                operationId: id,
                events: [
                  ...l.events,
                  {
                    id: `EVT-${Math.random().toString(36).slice(2, 8)}`,
                    type: "regroupement" as const,
                    at: now,
                    note: `Associé à l'opération ${id}`,
                    vigilance: "ok" as const,
                  },
                ],
              }
            : l,
        );
        return { lots, operations: [created, ...s.operations] };
      });
      return created;
    },
    [],
  );

  const addEvent = useCallback(
    (lotId: string, type: EventType, note: string, vigilance: Vigilance) => {
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        lots: s.lots.map((l) => {
          if (l.id !== lotId) return l;
          let status = l.status;
          if (type === "depart") status = "en_transport";
          if (type === "livraison") status = "livre";
          return {
            ...l,
            status,
            events: [
              ...l.events,
              {
                id: `EVT-${Math.random().toString(36).slice(2, 8)}`,
                type,
                at: now,
                note,
                vigilance,
              },
            ],
          };
        }),
      }));
    },
    [],
  );

  const addOperationEvent = useCallback(
    (opId: string, type: EventType, note: string, vigilance: Vigilance) => {
      const now = new Date().toISOString();
      setState((s) => {
        const op = s.operations.find((o) => o.id === opId);
        if (!op) return s;
        const lots = s.lots.map((l) => {
          if (!op.lotIds.includes(l.id)) return l;
          let status = l.status;
          if (type === "depart") status = "en_transport";
          if (type === "livraison") status = "livre";
          return {
            ...l,
            status,
            events: [
              ...l.events,
              {
                id: `EVT-${Math.random().toString(36).slice(2, 8)}`,
                type,
                at: now,
                note,
                vigilance,
              },
            ],
          };
        });
        let operations = s.operations;
        if (type === "depart" && op.status === "planifiee") {
          operations = operations.map((o) =>
            o.id === opId ? { ...o, status: "en_cours" as const } : o,
          );
        }
        if (type === "livraison" && op.status !== "livree") {
          operations = operations.map((o) =>
            o.id === opId ? { ...o, status: "livree" as const } : o,
          );
        }
        return { lots, operations };
      });
    },
    [],
  );

  const setOperationStatus = useCallback(
    (opId: string, status: Operation["status"]) => {
      const now = new Date().toISOString();
      setState((s) => {
        const op = s.operations.find((o) => o.id === opId);
        if (!op) return s;
        const operations = s.operations.map((o) =>
          o.id === opId ? { ...o, status } : o,
        );
        // Propager le statut aux lots de l'opération.
        const lots = s.lots.map((l) => {
          if (!op.lotIds.includes(l.id)) return l;
          if (status === "livree" && l.status !== "livre") {
            return {
              ...l,
              status: "livre" as const,
              events: [
                ...l.events,
                {
                  id: `EVT-${Math.random().toString(36).slice(2, 8)}`,
                  type: "livraison" as const,
                  at: now,
                  note: `Livraison de l'opération ${opId}`,
                  vigilance: "ok" as const,
                },
              ],
            };
          }
          if (status === "en_cours" && l.status === "regroupe") {
            return {
              ...l,
              status: "en_transport" as const,
              events: [
                ...l.events,
                {
                  id: `EVT-${Math.random().toString(36).slice(2, 8)}`,
                  type: "depart" as const,
                  at: now,
                  note: `Départ — opération ${opId}`,
                  vigilance: "ok" as const,
                },
              ],
            };
          }
          return l;
        });
        return { lots, operations };
      });
    },
    [],
  );

  const assignCarrier = useCallback((opId: string, carrier: string): boolean => {
    let updated = false;
    setState((s) => {
      const op = s.operations.find((o) => o.id === opId);
      if (!op || op.status !== "planifiee" || !carrier.trim()) return s;
      updated = true;
      return {
        ...s,
        operations: s.operations.map((o) =>
          o.id === opId ? { ...o, carrier: carrier.trim() } : o,
        ),
      };
    });
    return updated;
  }, []);

  const getLot = useCallback((id: string) => state.lots.find((l) => l.id === id), [state.lots]);
  const getOperation = useCallback(
    (id: string) => state.operations.find((o) => o.id === id),
    [state.operations],
  );
  const resetDemo = useCallback(() => setState(createSeed()), []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      createLot,
      updateLot,
      cancelLot,
      createOperation,
      addEvent,
      addOperationEvent,
      getLot,
      getOperation,
      setOperationStatus,
      assignCarrier,
      resetDemo,
    }),
    [state, createLot, updateLot, cancelLot, createOperation, addEvent, addOperationEvent, getLot, getOperation, setOperationStatus, assignCarrier, resetDemo],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
