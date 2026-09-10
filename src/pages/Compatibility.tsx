import { useMemo, useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Check, CheckCircle2, X, GitMerge, Truck } from "lucide-react";
import { useStore } from "../lib/store";
import { useRole } from "../lib/role";
import { proposeGrouping } from "../lib/compatibility";
import { CARRIERS } from "../lib/seed";
import { CATEGORY_LABELS } from "../lib/types";
import { estimateGroup, formatFcfa, savingsHint } from "../lib/savings";
import {
  Button,
  ConfirmDialog,
  Field,
  Panel,
  PanelHeader,
  Select,
  EmptyState,
  EmptyStateLink,
} from "../components/ui";

export default function Compatibility() {
  const { lots, createOperation } = useStore();
  const { perms, profile } = useRole();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const availableBases = lots.filter(
    (l) => !l.operationId && (!perms.scopeOwn || l.producer === profile.org),
  );
  const initial = params.get("lot") || availableBases[0]?.id || "";
  const [baseId, setBaseId] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [carrier, setCarrier] = useState<string>(CARRIERS[0]);
  const [askCreate, setAskCreate] = useState(false);
  const justCreated = params.get("nouveau") === "1" && !perms.canGroup;

  const base = lots.find((l) => l.id === baseId);
  const proposal = useMemo(
    () => (base ? proposeGrouping(base, lots) : null),
    [base, lots],
  );

  // Pre-select compatible lots whenever the base changes.
  useEffect(() => {
    if (proposal) setSelected(new Set(proposal.compatibleLots.map((l) => l.id)));
  }, [baseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canOpen = perms.nav.includes("compatibilite") || perms.canGroup;
  if (!canOpen) return <Navigate to="/lots" replace />;

  if (availableBases.length === 0) {
    const nothingYet = lots.length === 0;
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight">Analyse de compatibilité</h1>
        <Panel>
          <EmptyState
            title={nothingYet ? "Rien à comparer pour l'instant" : "Tous les lots sont regroupés"}
            action={
              perms.canCreateLot ? (
                <EmptyStateLink to="/creer">Créer un lot</EmptyStateLink>
              ) : undefined
            }
          >
            {nothingYet
              ? perms.canCreateLot
                ? "L'analyse compare un lot de référence aux autres besoins disponibles : même destination, même zone, période et contraintes compatibles. Enregistrez un premier lot pour la lancer."
                : "L'analyse compare un lot de référence aux autres besoins disponibles. Elle sera disponible dès qu'un producteur aura enregistré un lot."
              : perms.scopeOwn
                ? "Tous vos lots sont déjà rattachés à une opération. Enregistrez un nouveau lot pour lancer une nouvelle analyse."
                : "Tous les lots enregistrés sont déjà rattachés à une opération."}
          </EmptyState>
        </Panel>
      </div>
    );
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectedLots = perms.canGroup
    ? lots.filter((l) => selected.has(l.id))
    : proposal?.compatibleLots ?? [];
  const totalVolume = (base?.quantityKg || 0) + selectedLots.reduce((s, l) => s + l.quantityKg, 0);
  const groupLots = base ? [base, ...selectedLots] : selectedLots;
  const savings = estimateGroup(groupLots);

  const corridor = base ? `${base.origin.name} → ${base.destination.name}` : "";

  const create = () => {
    if (!perms.canGroup || !base || !carrier) return;
    const op = createOperation(base, Array.from(selected), corridor, carrier);
    setAskCreate(false);
    navigate(`/operation/${op.id}`);
  };

  return (
    <div className="space-y-6">
      {justCreated && base ? (
        <Panel className="border-primary/30">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Lot enregistré — en attente de l'opérateur
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {base.id} · {base.product} · {base.quantityKg.toLocaleString("fr-FR")} kg
                  est chez l'opérateur logistique. Vous n'avez plus rien à valider ici.
                  Voici les autres besoins qui pourraient voyager avec.
                </p>
              </div>
            </div>
            <Link
              to="/lots"
              className="inline-flex shrink-0 items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
            >
              Mes lots
            </Link>
          </div>
        </Panel>
      ) : (
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analyse de compatibilité</h1>
          <p className="mt-1 text-sm text-muted">
            {perms.canGroup
              ? "Le lot de référence est comparé aux besoins disponibles selon la catégorie, la destination, la zone, la période et les contraintes."
              : "Comparez votre lot aux autres besoins. L'opérateur logistique crée l'opération et lance le regroupement."}
          </p>
        </div>
      )}

      <Panel>
        <PanelHeader title="Lot de référence" />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <span className="mb-1.5 block font-mono text-xs uppercase tracking-[0.12em] text-muted">Sélectionner un lot</span>
            <Select value={baseId} onChange={(e) => setBaseId(e.target.value)}>
              {availableBases.map((l) => (
                <option key={l.id} value={l.id}>{l.id} — {l.product} ({l.quantityKg} kg → {l.destination.name})</option>
              ))}
            </Select>
          </div>
          {base && (
            <div className="grid grid-cols-3 gap-4 text-sm sm:text-right">
              <div>
                <div className="font-mono text-xs uppercase text-faint">Catégorie</div>
                <div className="text-foreground">{CATEGORY_LABELS[base.category]}</div>
              </div>
              <div>
                <div className="font-mono text-xs uppercase text-faint">Volume</div>
                <div className="tnum text-foreground">{base.quantityKg} kg</div>
              </div>
              <div>
                <div className="font-mono text-xs uppercase text-faint">Destination</div>
                <div className="text-foreground">{base.destination.name}</div>
              </div>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Panel>
          <PanelHeader title="Candidats au regroupement" hint="Triés par score de compatibilité" />
          {proposal && proposal.candidates.length > 0 ? (
            <ul className="divide-y divide-border/50">
              {proposal.candidates.map(({ lot, result }) => {
                const isSelected = selected.has(lot.id);
                const scoreColor = result.compatible ? "text-primary" : result.blockers.length ? "text-alerte" : "text-vigilance";
                return (
                  <li key={lot.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {perms.canGroup && (
                        <button
                          type="button"
                          onClick={() => toggle(lot.id)}
                          disabled={!result.compatible}
                          aria-pressed={isSelected}
                          aria-label={isSelected ? "Retirer du regroupement" : "Ajouter au regroupement"}
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : result.compatible
                                ? "border-border-strong hover:border-primary"
                                : "cursor-not-allowed border-border opacity-40"
                          }`}
                        >
                          {isSelected && <Check className="size-3.5" />}
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-info">{lot.id}</span>
                          <span className="text-sm text-foreground">{lot.product}</span>
                          <span className="tnum text-xs text-faint">· {lot.quantityKg} kg · {lot.producer}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {result.reasons.map((r, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-sm border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-xs text-primary/90">
                              <Check className="size-3" /> {r}
                            </span>
                          ))}
                          {result.blockers.map((b, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-sm border border-alerte/30 bg-alerte/5 px-1.5 py-0.5 text-xs text-alerte">
                              <X className="size-3" /> {b}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`tnum text-lg font-semibold ${scoreColor}`}>{result.score}</div>
                        <div className="font-mono text-xs uppercase text-faint">score</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState>Aucun autre lot disponible à comparer.</EmptyState>
          )}
        </Panel>

        <div>
          <Panel className="sticky top-5">
            <PanelHeader
              title={perms.canGroup ? "Proposition de regroupement" : "Lots qui pourraient voyager avec"}
            />
            <div className="space-y-4 p-4">
              <div className="rounded-md border border-border bg-surface px-4 py-3">
                <div className="font-mono text-xs uppercase tracking-wider text-faint">Volume total regroupé</div>
                <div className="tnum mt-1 text-3xl font-semibold text-primary">{totalVolume.toLocaleString("fr-FR")} <span className="text-base text-muted">kg</span></div>
                <div className="mt-1 text-xs text-muted">{groupLots.length} lot(s) · référence incluse</div>
              </div>

              <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="font-mono text-xs uppercase tracking-wider text-faint">Économie estimée</div>
                <div className="tnum mt-1 text-2xl font-semibold text-primary">
                  {savings.lotCount >= 2 ? formatFcfa(savings.savedFcfa) : "—"}
                </div>
                <div className="mt-1 text-xs text-muted">{savingsHint(savings)}</div>
              </div>

              <ul className="space-y-1.5 text-sm">
                {base && (
                  <li className="flex justify-between text-muted">
                    <span className="font-mono text-xs text-foreground">{base.id}</span>
                    <span className="tnum text-xs">{base.quantityKg} kg</span>
                  </li>
                )}
                {selectedLots.map((l) => (
                  <li key={l.id} className="flex justify-between text-muted">
                    <span className="font-mono text-xs">{l.id}</span>
                    <span className="tnum text-xs">{l.quantityKg} kg</span>
                  </li>
                ))}
              </ul>

              {perms.canGroup ? (
                <>
                  <Field label="Transporteur assigné">
                    <Select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                      {CARRIERS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setAskCreate(true)}
                    disabled={selected.size === 0 || !carrier}
                  >
                    <Truck className="size-4" />
                    Créer l'opération
                  </Button>
                  <p className="flex items-center gap-1.5 text-xs text-faint">
                    <GitMerge className="size-3" />
                    Les lots sélectionnés seront marqués « regroupés ».
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-start gap-1.5 text-xs text-muted">
                    <GitMerge className="mt-0.5 size-3.5 shrink-0" />
                    Lecture seule. L'opérateur logistique créera l'opération à partir de cette analyse.
                  </p>
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={askCreate}
        title="Confirmer le regroupement"
        confirmLabel="Créer l'opération"
        onClose={() => setAskCreate(false)}
        onConfirm={create}
      >
        <p>
          {1 + selectedLots.length} lot{(1 + selectedLots.length) > 1 ? "s" : ""} ·{" "}
          {totalVolume.toLocaleString("fr-FR")} kg · {corridor}
        </p>
        <p>Transporteur : {carrier}</p>
        <ul className="font-mono text-xs text-foreground">
          {base && <li>{base.id} · {base.product}</li>}
          {selectedLots.map((l) => (
            <li key={l.id}>{l.id} · {l.product}</li>
          ))}
        </ul>
        <p>
          Ces lots ne seront plus modifiables. Le transporteur assigné pourra ensuite
          démarrer la tournée.
        </p>
        {savings.lotCount >= 2 && (
          <p>
            Économie estimée : {formatFcfa(savings.savedFcfa)} ({savingsHint(savings)}).
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
