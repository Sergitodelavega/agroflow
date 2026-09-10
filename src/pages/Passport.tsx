import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  BadgeCheck,
  CalendarRange,
  MapPin,
  Package,
  ScanLine,
  Truck,
  Clock,
  CheckCircle2,
  Pencil,
  Ban,
  Check,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useRole, canEditLot } from "../lib/role";
import { lotVigilance } from "../lib/alerts";
import {
  CATEGORY_LABELS,
  CONSTRAINT_LABELS,
  EVENT_LABELS,
  type LotEvent,
} from "../lib/types";
import { Button, Panel, PanelHeader } from "../components/ui";
import { StatusBadge, VigilanceBadge } from "../components/badges";
import NextStep from "../components/NextStep";

const RECEPTION_NOTE = "Réception confirmée par l'acheteur";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const eventDot: Record<string, string> = {
  ok: "border-primary bg-primary/20",
  vigilance: "border-vigilance bg-vigilance/20",
  alerte: "border-alerte bg-alerte/20",
};

export default function Passport() {
  const { id } = useParams();
  const { getLot, addEvent, cancelLot } = useStore();
  const { perms, profile, authenticated } = useRole();
  const navigate = useNavigate();
  const lot = getLot(id || "");
  const [qr, setQr] = useState<string>("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
      color: { dark: "#0a0e0d", light: "#ffffff" },
    }).then(setQr).catch(() => setQr(""));
  }, [id]);

  if (!lot) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Passeport introuvable</h1>
        <Link to={perms.nav.includes("lots") ? "/lots" : "/connexion"} className="text-sm text-primary hover:underline">
          {perms.nav.includes("lots") ? "← Retour aux lots" : "← Connexion"}
        </Link>
      </div>
    );
  }

  const vig = lotVigilance(lot);
  const events = [...lot.events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const received = lot.events.some((e) => e.note === RECEPTION_NOTE);
  const canReceive = lot.status === "livre" || lot.status === "en_transport";
  const canConfirm = !authenticated || perms.canConfirmReception;
  const canEdit = canEditLot(lot, perms, profile.org);
  const publicStep = !authenticated
    ? {
        title: "Prochain pas",
        body: received
          ? "La réception est enregistrée. Consultez l'identité et l'historique."
          : canReceive
            ? "Vérifiez le lot, puis confirmez la réception."
            : "Consultez l'identité et le parcours déclaré de ce lot.",
        actionLabel: "Confirmer la réception",
        to: `/passeport/${lot.id}`,
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {publicStep && <NextStep step={publicStep} path={`/passeport/${lot.id}`} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={perms.nav.includes("lots") ? "/lots" : "/connexion"}
            className="text-xs text-faint hover:text-muted"
          >
            {perms.nav.includes("lots") ? "← Lots" : "← Connexion"}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <BadgeCheck className="size-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Passeport numérique</h1>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/creer?lot=${lot.id}`}
              title="Modifier le lot"
              className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-3.5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary/50 hover:text-primary"
            >
              <Pencil className="size-4" aria-hidden />
              Modifier
            </Link>
            {confirmCancel ? (
              <Button
                variant="outline"
                title="Confirmer l'annulation"
                className="text-alerte hover:border-alerte/50 hover:text-alerte"
                onClick={() => {
                  if (cancelLot(lot.id)) navigate("/lots");
                }}
              >
                <Check className="size-4" aria-hidden />
                Confirmer
              </Button>
            ) : (
              <Button variant="ghost" title="Annuler le lot" onClick={() => setConfirmCancel(true)}>
                <Ban className="size-4" aria-hidden />
                Annuler
              </Button>
            )}
          </div>
        )}
        {canConfirm && (
          received ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary">
              <CheckCircle2 className="size-4" /> Réception confirmée
            </span>
          ) : (
            <Button
              variant="primary"
              disabled={!canReceive}
              title={canReceive ? undefined : "Le lot doit être en transport ou livré"}
              onClick={() => addEvent(lot.id, "controle", RECEPTION_NOTE, "ok")}
            >
              <CheckCircle2 className="size-4" /> Confirmer la réception
            </Button>
          )
        )}
      </div>

      <Panel className="overflow-hidden">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-[1fr_auto]">
          {/* Identity */}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold text-foreground">{lot.id}</span>
              <StatusBadge status={lot.status} />
              <VigilanceBadge level={vig} pulse />
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">{lot.product}</h2>
            <p className="text-sm text-muted">{CATEGORY_LABELS[lot.category]} · {lot.producer}</p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 font-mono text-xs uppercase text-faint"><Package className="size-3" /> Quantité</dt>
                <dd className="tnum mt-0.5 text-foreground">{lot.quantityKg.toLocaleString("fr-FR")} kg</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 font-mono text-xs uppercase text-faint"><MapPin className="size-3" /> Trajet</dt>
                <dd className="mt-0.5 text-foreground">{lot.origin.name} → {lot.destination.name}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 font-mono text-xs uppercase text-faint"><CalendarRange className="size-3" /> Disponibilité</dt>
                <dd className="mt-0.5 text-foreground">{fmtDate(lot.availableFrom)} — {fmtDate(lot.availableTo)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 font-mono text-xs uppercase text-faint"><Truck className="size-3" /> Opération</dt>
                <dd className="mt-0.5">
                  {lot.operationId ? (
                    <Link to={`/operation/${lot.operationId}`} className="font-mono text-xs text-info hover:underline">{lot.operationId}</Link>
                  ) : (
                    <span className="text-faint">Non regroupé</span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <div className="mb-1.5 font-mono text-xs uppercase text-faint">Contraintes déclarées</div>
              <div className="flex flex-wrap gap-1.5">
                {lot.constraints.length ? lot.constraints.map((c) => (
                  <span key={c} className="rounded-sm border border-border-strong px-2 py-0.5 text-xs text-muted">{CONSTRAINT_LABELS[c]}</span>
                )) : <span className="text-xs text-faint">Aucune</span>}
              </div>
            </div>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center justify-center gap-2 border-t border-border bg-surface p-5 sm:border-l sm:border-t-0">
            {qr && <img src={qr} alt={`QR code du passeport ${lot.id}`} className="size-40 rounded-md" />}
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-faint">
              <ScanLine className="size-3" /> Scanner pour consulter
            </div>
            <div className="font-mono text-xs text-faint">{lot.id}</div>
          </div>
        </div>
      </Panel>

      {/* Timeline */}
      <Panel>
        <PanelHeader title="Historique des événements" hint={`${events.length} événement(s) enregistré(s)`} />
        <ol className="p-5">
          {events.map((e: LotEvent, i) => (
            <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
              {i < events.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" />}
              <span className={`relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 ${eventDot[e.vigilance]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{EVENT_LABELS[e.type]}</span>
                  {e.vigilance !== "ok" && <VigilanceBadge level={e.vigilance} />}
                </div>
                <p className="mt-0.5 text-sm text-muted">{e.note}</p>
                <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-faint"><Clock className="size-2.5" /> {fmtDateTime(e.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
