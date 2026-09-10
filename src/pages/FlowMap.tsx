import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useRole, visibleLots } from "../lib/role";
import { ZONES, DESTINATIONS } from "../lib/seed";
import { Panel, PanelHeader } from "../components/ui";

type Flow = {
  key: string;
  from: (typeof ZONES)[0];
  to: (typeof DESTINATIONS)[0];
  kg: number;
  ids: string[];
};

export default function FlowMap() {
  const { lots: allLots } = useStore();
  const { perms, profile } = useRole();
  const lots = visibleLots(allLots, perms, profile.org);
  const [focus, setFocus] = useState<string | null>(null);

  const flows = new Map<string, Flow>();
  for (const lot of lots) {
    const key = `${lot.origin.name}__${lot.destination.name}`;
    const cur = flows.get(key) || {
      key,
      from: lot.origin,
      to: lot.destination,
      kg: 0,
      ids: [],
    };
    cur.kg += lot.quantityKg;
    cur.ids.push(lot.id);
    flows.set(key, cur);
  }
  const flowList = Array.from(flows.values()).sort((a, b) => b.kg - a.kg);
  const maxKg = Math.max(...flowList.map((f) => f.kg), 1);
  const active = flowList.find((f) => f.key === focus) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Carte des flux</h1>
        <p className="mt-1 text-sm text-muted">
          {perms.scopeOwn
            ? "Le Nord en haut, la côte en bas. Seuls vos lots sont tracés — cliquez un trait ou un corridor."
            : "Le Nord en haut, la côte en bas. L'épaisseur d'un trait = le volume. Cliquez un corridor pour le lire."}
        </p>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Schéma du Bénin"
          hint="Nord → Sud · collecte en vert · marchés en bleu"
        />
        <div className="bg-surface px-2 py-3 sm:px-4">
          <svg
            viewBox="-10 -8 120 120"
            className="mx-auto h-auto w-full max-h-[min(70vh,36rem)]"
            role="img"
            aria-label="Carte schématique des zones de collecte et des marchés au Bénin"
          >
            <path
              d="M20 2 L76 3 L86 22 L82 50 L72 80 L62 103 L36 106 L20 90 L14 54 L16 24 Z"
              fill="var(--surface-2)"
              stroke="var(--border-strong)"
              strokeWidth={0.6}
            />
            <text x={50} y={-2} fontSize={3} fill="var(--faint)" textAnchor="middle" className="font-mono">
              Nord
            </text>
            <text x={50} y={110} fontSize={3} fill="var(--faint)" textAnchor="middle" className="font-mono">
              Côte
            </text>

            {flowList.map((f) => {
              const on = !focus || focus === f.key;
              const width = 0.7 + (f.kg / maxKg) * 2.4;
              return (
                <g key={f.key}>
                  <line
                    x1={f.from.x}
                    y1={f.from.y}
                    x2={f.to.x}
                    y2={f.to.y}
                    stroke="transparent"
                    strokeWidth={5}
                    strokeLinecap="round"
                    className="cursor-pointer"
                    onClick={() => setFocus(focus === f.key ? null : f.key)}
                  />
                  <line
                    x1={f.from.x}
                    y1={f.from.y}
                    x2={f.to.x}
                    y2={f.to.y}
                    stroke="var(--primary)"
                    strokeWidth={width}
                    strokeLinecap="round"
                    opacity={on ? 0.8 : 0.14}
                    className="pointer-events-none"
                  />
                </g>
              );
            })}

            {DESTINATIONS.map((d) => (
              <g key={d.name}>
                <circle cx={d.x} cy={d.y} r={2.2} fill="var(--info)" />
                <circle cx={d.x} cy={d.y} r={3.6} fill="none" stroke="var(--info)" strokeWidth={0.35} opacity={0.55} />
                <text
                  x={d.x}
                  y={d.y + 6}
                  fontSize={2.6}
                  fill="var(--foreground)"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {d.name.split(" — ")[0]}
                </text>
              </g>
            ))}

            {ZONES.map((z) => {
              const destHere = DESTINATIONS.some((d) => d.x === z.x && d.y === z.y);
              if (destHere) return null;
              const has = lots.some((l) => l.origin.name === z.name);
              return (
                <g key={z.name}>
                  <circle cx={z.x} cy={z.y} r={1.6} fill={has ? "var(--primary)" : "var(--border-strong)"} />
                  <text
                    x={z.x}
                    y={z.y - 3}
                    fontSize={2.4}
                    fill={has ? "var(--foreground)" : "var(--faint)"}
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {z.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              Zone de collecte
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-info" />
              Marché
            </span>
          </div>
          {active ? (
            <p className="text-sm text-foreground">
              {active.from.name} → {active.to.name.split(" — ")[0]}
              <span className="tnum text-muted"> · {active.kg.toLocaleString("fr-FR")} kg</span>
            </p>
          ) : (
            <p className="text-xs text-faint">Cliquez un trait ou un corridor ci-dessous.</p>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Corridors" hint="Du plus chargé au plus léger" />
        {flowList.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-faint">Aucun flux à afficher pour ce rôle.</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {flowList.map((f) => {
              const on = focus === f.key;
              return (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => setFocus(on ? null : f.key)}
                    className={`flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors ${
                      on ? "bg-primary/8" : "hover:bg-surface-2/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm text-foreground">
                        {f.from.name} <span className="text-faint">→</span> {f.to.name.split(" — ")[0]}
                      </span>
                      <span className="tnum text-sm font-medium text-primary">
                        {f.kg.toLocaleString("fr-FR")} kg
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(8, Math.round((f.kg / maxKg) * 100))}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {f.ids.map((id) => (
                        <Link
                          key={id}
                          to={`/passeport/${id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs text-info hover:underline"
                        >
                          {id}
                        </Link>
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
