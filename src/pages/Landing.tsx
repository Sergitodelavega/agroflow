import { Link } from "react-router-dom";
import { Leaf, GitMerge, Truck, BadgeCheck } from "lucide-react";
import { Button, Panel } from "../components/ui";

const STEPS = [
  {
    n: "01",
    title: "Enregistrer un lot",
    body: "Produit, quantité, zone de départ, destination, disponibilité et contraintes.",
    icon: Leaf,
  },
  {
    n: "02",
    title: "Rapprocher les besoins",
    body: "La compatibilité compare les lots pour proposer un regroupement réaliste.",
    icon: GitMerge,
  },
  {
    n: "03",
    title: "Piloter l'opération",
    body: "Un transporteur est assigné. Départ, événements de route et livraison sont suivis.",
    icon: Truck,
  },
  {
    n: "04",
    title: "Consulter le passeport",
    body: "Chaque lot a une identité numérique et un QR. L'acheteur vérifie le parcours déclaré.",
    icon: BadgeCheck,
  },
];

const ACTORS = [
  { label: "Producteur", text: "Déclare un besoin de transport et suit ses lots." },
  { label: "Opérateur", text: "Regroupe les cargaisons et assigne un transporteur." },
  { label: "Transporteur", text: "Prend en charge la tournée et déclare les événements." },
  { label: "Acheteur", text: "Scanne le passeport à l'arrivée et confirme la réception." },
];

export default function Landing() {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Leaf className="size-4.5" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold tracking-tight text-foreground">
                AGROFLOW
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
                Mutualisation logistique
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled title="L'inscription n'est pas encore ouverte">
              Inscription
            </Button>
            <Link
              to="/connexion"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-5 py-12 lg:py-16">
        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
              Hackathon Cursor × Devs Days 2026
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Moins de camions à moitié vides. Plus de visibilité sur chaque lot agricole.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              AgroFlow rapproche les petits volumes compatibles, construit une opération
              de transport partagée, et suit le parcours jusqu'au marché — du producteur
              à l'acheteur.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/connexion"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Connexion
              </Link>
              <Button variant="outline" disabled title="L'inscription n'est pas encore ouverte">
                Inscription
              </Button>
            </div>
            <p className="mt-3 text-xs text-faint">
              L'inscription n'est pas encore ouverte. La démo se joue avec la connexion
              (producteur, transporteur ou opérateur).
            </p>
          </div>
          <figure className="overflow-hidden rounded-xl border border-border bg-panel">
            <img
              src="/landing/agroflow-marche.jpg"
              alt="Étal de tomates, oignons et tubercules sur un marché ouest-africain, tôt le matin"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="px-4 py-3 text-xs text-muted">
              À l'arrivée, le marché doit pouvoir faire confiance à ce qui a voyagé.
            </figcaption>
          </figure>
        </section>

        <figure className="overflow-hidden rounded-xl border border-border">
          <img
            src="/landing/agroflow-route.jpg"
            alt="Petit camion chargé de sacs et de caisses sur une piste latérite, au soleil couchant"
            className="aspect-[16/9] w-full object-cover"
          />
          <figcaption className="bg-panel px-5 py-3.5 text-sm text-muted">
            Un seul trajet peut porter plusieurs lots — s'ils sont compatibles, et s'ils sont suivis.
          </figcaption>
        </figure>

        <section className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <figure className="overflow-hidden rounded-xl border border-border">
            <img
              src="/landing/agroflow-mains.jpg"
              alt="Mains triant des oignons violets dans un panier tressé, à la lumière du matin"
              className="aspect-[3/4] w-full object-cover"
            />
          </figure>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
              Pourquoi ça compte
            </h2>
            <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
              Derrière chaque kilogramme, il y a un producteur qui a déjà fait sa part.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Quand les volumes sont trop petits pour remplir un véhicule, le transport
              coûte cher et le parcours se perd. AgroFlow ne remplace pas le camion :
              il rend visible ce qui peut voyager ensemble, et ce qui arrive au marché.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            Ce que fait la plateforme
          </h2>
          <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.n}>
                  <Panel className="h-full p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="font-mono text-xs text-faint">{step.n}</div>
                        <h3 className="mt-0.5 text-sm font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-1 text-sm text-muted">{step.body}</p>
                      </div>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ol>
        </section>

        <figure className="overflow-hidden rounded-xl border border-border">
          <img
            src="/landing/agroflow-chargement.jpg"
            alt="Plusieurs personnes chargeant ensemble des caisses de produits sur un camion, dans une cour de coopérative"
            className="aspect-[16/9] w-full object-cover object-[50%_35%]"
          />
          <figcaption className="bg-panel px-5 py-3.5 text-sm text-muted">
            Le regroupement, c'est ce geste-là : plusieurs besoins, une même tournée.
          </figcaption>
        </figure>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            Pour qui
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-panel">
            {ACTORS.map((actor) => (
              <li key={actor.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3.5">
                <span className="w-32 shrink-0 text-sm font-medium text-foreground">{actor.label}</span>
                <span className="text-sm text-muted">{actor.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
