import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { GitMerge, Ban, Check } from "lucide-react";
import { useStore } from "../lib/store";
import { useRole, canEditLot } from "../lib/role";
import { ZONES, DESTINATIONS, PRODUCERS } from "../lib/seed";
import {
  CATEGORY_LABELS,
  CONSTRAINT_LABELS,
  type Constraint,
  type ProductCategory,
} from "../lib/types";
import { Button, Field, Input, Panel, PanelHeader, Select } from "../components/ui";

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function asDateInput(value: string): string {
  return value.slice(0, 10);
}

export default function LotCreate() {
  const { createLot, updateLot, cancelLot, getLot } = useStore();
  const { role, perms, profile } = useRole();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("lot");
  const existing = editId ? getLot(editId) : undefined;
  const editing = Boolean(editId);

  const lockProducer = perms.scopeOwn;
  const [producer, setProducer] = useState(lockProducer ? profile.org : "");
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<ProductCategory>("legumes");
  const [quantityKg, setQuantityKg] = useState(80);
  const [originName, setOriginName] = useState(ZONES[0].name);
  const [destName, setDestName] = useState(DESTINATIONS[0].name);
  const [availableFrom, setAvailableFrom] = useState(todayPlus(0));
  const [availableTo, setAvailableTo] = useState(todayPlus(5));
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setProducer(existing.producer);
    setProduct(existing.product);
    setCategory(existing.category);
    setQuantityKg(existing.quantityKg);
    setOriginName(existing.origin.name);
    setDestName(existing.destination.name);
    setAvailableFrom(asDateInput(existing.availableFrom));
    setAvailableTo(asDateInput(existing.availableTo));
    setConstraints(existing.constraints);
    setConfirmCancel(false);
  }, [existing]);

  const toggle = (c: Constraint) =>
    setConstraints((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const payload = () => ({
    producer,
    product,
    category,
    quantityKg,
    origin: ZONES.find((z) => z.name === originName)!,
    destination: DESTINATIONS.find((z) => z.name === destName)!,
    availableFrom,
    availableTo,
    constraints,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing && existing) {
      const lot = updateLot(existing.id, payload());
      if (lot) navigate(`/passeport/${lot.id}`);
      return;
    }
    const lot = createLot(payload());
    navigate(
      perms.canGroup
        ? `/compatibilite?lot=${lot.id}`
        : `/compatibilite?lot=${lot.id}&nouveau=1`,
    );
  };

  const valid = producer.trim() && product.trim() && quantityKg >= 25 && quantityKg <= 200;

  if (editing && !existing) return <Navigate to="/lots" replace />;
  if (existing && !canEditLot(existing, perms, profile.org)) {
    return <Navigate to={`/passeport/${existing.id}`} replace />;
  }
  if (!editing && !perms.canCreateLot) return <Navigate to="/lots" replace />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {editing ? `Modifier ${existing?.id}` : "Créer un lot"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {editing
            ? role === "operateur"
              ? "Tant que le lot n'est pas regroupé, vous pouvez corriger les informations ou l'annuler."
              : "Tant que l'opérateur n'a pas regroupé ce lot, vous pouvez corriger les informations ou l'annuler."
            : role === "operateur"
              ? "Enregistrez un besoin au nom d'une coopérative, puis analysez la compatibilité pour créer l'opération."
              : "Renseignez le besoin de transport. Vous pourrez ensuite consulter les lots compatibles — l'opérateur validera le regroupement."}
        </p>
      </div>

      <form onSubmit={submit}>
        <Panel>
          <PanelHeader title="Identification du lot" />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Field label="Producteur">
              {lockProducer ? (
                <Input value={producer} required disabled />
              ) : (
                <Select value={producer} onChange={(e) => setProducer(e.target.value)} required>
                  <option value="">Choisir une coopérative</option>
                  {(producer && !(PRODUCERS as readonly string[]).includes(producer)
                    ? [producer, ...PRODUCERS]
                    : [...PRODUCERS]
                  ).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Produit">
              <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ex. Oignon violet" required />
            </Field>
            <Field label="Catégorie">
              <Select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Quantité (kg)">
              <Input type="number" min={25} max={200} value={quantityKg} onChange={(e) => setQuantityKg(Number(e.target.value))} className="tnum" required />
            </Field>
          </div>

          <div className="border-t border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-faint">
            Besoin de transport
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Field label="Zone de départ">
              <Select value={originName} onChange={(e) => setOriginName(e.target.value)}>
                {ZONES.map((z) => <option key={z.name} value={z.name}>{z.name}</option>)}
              </Select>
            </Field>
            <Field label="Destination">
              <Select value={destName} onChange={(e) => setDestName(e.target.value)}>
                {DESTINATIONS.map((z) => <option key={z.name} value={z.name}>{z.name}</option>)}
              </Select>
            </Field>
            <Field label="Disponible à partir du">
              <Input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
            </Field>
            <Field label="Disponible jusqu'au">
              <Input type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
            </Field>
          </div>

          <div className="border-t border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-faint">
            Contraintes déclarées
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {(Object.keys(CONSTRAINT_LABELS) as Constraint[]).map((c) => {
              const active = constraints.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(c)}
                  className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border-strong text-muted hover:border-primary/40"
                  }`}
                >
                  {CONSTRAINT_LABELS[c]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border p-4">
            {editing && existing && (
              confirmCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  title="Confirmer l'annulation"
                  className="mr-auto text-alerte hover:border-alerte/50 hover:text-alerte"
                  onClick={() => {
                    if (cancelLot(existing.id)) navigate("/lots");
                  }}
                >
                  <Check className="size-4" aria-hidden />
                  Confirmer
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  title="Annuler le lot"
                  className="mr-auto"
                  onClick={() => setConfirmCancel(true)}
                >
                  <Ban className="size-4" aria-hidden />
                  Annuler
                </Button>
              )
            )}
            <Button type="button" variant="ghost" onClick={() => navigate("/lots")}>
              Retour
            </Button>
            <Button type="submit" variant="primary" disabled={!valid}>
              <GitMerge className="size-4" />
              {editing
                ? "Enregistrer les modifications"
                : perms.canGroup
                  ? "Enregistrer et analyser"
                  : "Enregistrer le lot"}
            </Button>
          </div>
        </Panel>
      </form>
    </div>
  );
}
