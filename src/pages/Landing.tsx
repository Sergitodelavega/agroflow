import { useRef } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import {
  FeatureCard,
  ImageTile,
  LandingAnchor,
  LandingLink,
  SectionLink,
} from "../components/landing";
import { useLandingMotion } from "../hooks/useLandingMotion";

const TILES = [
  {
    src: "/landing/agroflow-tomates.jpg",
    alt: "",
    rotate: -4,
    className:
      "left-[4%] top-[16%] size-[72px] sm:left-[7%] sm:top-[18%] md:size-[110px] lg:left-[8%]",
  },
  {
    src: "/landing/agroflow-oignons.jpg",
    alt: "",
    rotate: 3,
    className:
      "right-[5%] top-[14%] size-[64px] sm:right-[8%] sm:top-[16%] md:size-[100px] lg:right-[10%]",
  },
  {
    src: "/landing/agroflow-paniers.jpg",
    alt: "",
    rotate: 3,
    className:
      "hidden left-[2%] top-[46%] size-[80px] sm:block md:size-[104px] lg:left-[3%]",
  },
  {
    src: "/landing/agroflow-mangues.jpg",
    alt: "",
    rotate: -4,
    className:
      "hidden right-[3%] top-[44%] size-[80px] sm:block md:size-[100px] lg:right-[4%]",
  },
  {
    src: "/landing/agroflow-ignames.jpg",
    alt: "",
    rotate: -3,
    className:
      "hidden left-[10%] bottom-[10%] size-[72px] sm:block sm:left-[14%] sm:bottom-[12%] md:size-[96px] lg:left-[16%]",
  },
  {
    src: "/landing/agroflow-parasols.jpg",
    alt: "",
    rotate: 4,
    className:
      "hidden right-[8%] bottom-[9%] size-[72px] sm:block sm:right-[13%] sm:bottom-[11%] md:size-[108px] lg:right-[15%]",
  },
  {
    src: "/landing/agroflow-mains.jpg",
    alt: "",
    rotate: 2,
    className: "hidden left-[22%] top-[12%] size-[68px] lg:block lg:size-[100px]",
  },
  {
    src: "/landing/agroflow-sacs.jpg",
    alt: "",
    rotate: -2,
    className: "hidden right-[22%] top-[11%] size-[72px] lg:block lg:size-[92px]",
  },
];

const FEATURES = [
  {
    src: "/landing/agroflow-chargement.jpg",
    alt: "Chargement collectif de caisses de mangues dans un camion",
    label: "Regrouper les besoins",
  },
  {
    src: "/landing/agroflow-mains.jpg",
    alt: "Mains posant des oignons violets dans un panier tressé",
    label: "Garder l'origine visible",
  },
  {
    src: "/landing/agroflow-marche.jpg",
    alt: "Étal de tomates et d'oignons dans un marché ouest-africain",
    label: "Livrer en confiance",
  },
];

const ACTORS = [
  {
    src: "/landing/agroflow-mains.jpg",
    alt: "Mains d'un producteur avec un panier d'oignons",
    label: "Producteur",
    text: "Déclare un besoin de transport et suit ses lots.",
  },
  {
    src: "/landing/agroflow-chargement.jpg",
    alt: "Équipe chargeant ensemble un véhicule",
    label: "Opérateur",
    text: "Construit l'opération et assigne un transporteur.",
  },
  {
    src: "/landing/agroflow-route.jpg",
    alt: "Camion chargé sur une piste latérite",
    label: "Transporteur",
    text: "Prend en charge la tournée et déclare les événements.",
  },
  {
    src: "/landing/agroflow-marche.jpg",
    alt: "Marché à l'arrivée des produits",
    label: "Acheteur",
    text: "Consulte le passeport à l'arrivée et confirme la réception.",
  },
];

function LandingNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-4 sm:px-4">
      <nav
        aria-label="Navigation principale"
        className="pointer-events-auto grid w-full max-w-[1280px] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-ink-black/10 bg-paper-white px-3 py-1.5 md:grid-cols-[1fr_auto_1fr] md:gap-4 md:px-5 md:py-2"
      >
        <SectionLink
          to="accueil"
          className="flex min-w-0 items-center gap-2 landing-nav-link md:gap-2.5"
        >
          <BrandMark variant="black" className="size-7 md:size-8" decorative />
          <span className="landing-wordmark landing-caption truncate font-medium">AgroFlow</span>
        </SectionLink>
        <div className="hidden items-center justify-center gap-8 md:flex">
          <SectionLink to="produit" className="landing-nav-link">
            Produit
          </SectionLink>
          <SectionLink to="parcours" className="landing-nav-link">
            Parcours
          </SectionLink>
          <SectionLink to="acteurs" className="landing-nav-link">
            Acteurs
          </SectionLink>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <LandingAnchor href="#produit" variant="outline" className="hidden !px-5 !py-3 md:inline-flex">
            Découvrir
          </LandingAnchor>
          <LandingLink
            to="/connexion"
            className="!px-3.5 !py-2.5 whitespace-nowrap text-[15px] md:!px-5 md:!py-3 md:text-[16px]"
          >
            Connexion
          </LandingLink>
        </div>
      </nav>
    </header>
  );
}

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);

  return (
    <div ref={rootRef} className="landing min-h-svh">
      <SectionLink
        to="accueil"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[16px] focus:bg-ink-black focus:px-4 focus:py-2 focus:text-paper-white"
      >
        Aller au contenu
      </SectionLink>
      <LandingNav />

      <main>
        <section
          id="accueil"
          className="relative flex min-h-[100svh] items-center justify-center overflow-x-hidden overflow-y-hidden px-5 pb-24 pt-28 md:min-h-[max(100svh,72rem)] md:pb-32"
        >
          {TILES.map((tile) => (
            <ImageTile key={tile.src} {...tile} />
          ))}

          <div
            data-landing-orbit-origin
            data-landing-orbit-keepout
            className="relative z-10 mx-auto w-fit max-w-[720px] text-center"
          >
            <p className="landing-eyebrow text-ink-black">AgroFlow</p>
            <h1 className="landing-display mx-auto mt-5 max-w-[14ch] text-ink-black">
              Des lots qui voyagent ensemble.
            </h1>
            <p className="landing-sub mx-auto mt-6 max-w-[38ch] text-stone">
              Plateforme de mutualisation logistique pour les filières agricoles.
              On rapproche les petits volumes compatibles et on suit chaque lot
              jusqu'au marché.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <LandingLink to="/inscription">Créer un compte</LandingLink>
              <LandingAnchor href="#produit">Voir le produit</LandingAnchor>
            </div>
            <p className="landing-caption mx-auto mt-5 max-w-[40ch] text-pebble">
              Inscription ouverte aux producteurs, transporteurs et opérateurs
              logistiques. L'acheteur consulte le passeport sans compte.
            </p>
          </div>
        </section>

        <div className="landing-hero-break" aria-hidden="true">
          <span className="landing-hero-rule" />
        </div>

        <section
          id="produit"
          data-landing-reveal
          className="mx-auto w-full max-w-[1280px] px-5"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.label} {...feature} />
            ))}
          </div>
        </section>

        <section
          id="parcours"
          data-landing-reveal
          className="mx-auto w-full max-w-[1280px] px-5 pt-[80px]"
        >
          <figure className="relative overflow-hidden rounded-[16px]">
            <img
              src="/landing/agroflow-route.jpg"
              alt="Camion chargé de sacs et de caisses sur une piste latérite, au soleil couchant"
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="absolute inset-0 bg-ink-black/40" aria-hidden />
            <figcaption className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 text-paper-white sm:p-10">
              <div className="flex items-center justify-between gap-4">
                <span className="landing-heading-lg">Suivre</span>
                <span
                  className="hidden size-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-paper-white sm:block"
                  aria-hidden
                />
                <span className="landing-heading-lg text-right">le parcours</span>
              </div>
              <p className="landing-caption mx-auto max-w-[42ch] text-center text-paper-white/80">
                Un seul trajet peut porter plusieurs lots — s'ils sont
                compatibles, et s'ils sont suivis.
              </p>
            </figcaption>
          </figure>
        </section>

        <section
          id="pourquoi"
          data-landing-reveal
          className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-5 pt-[80px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16"
        >
          <figure className="overflow-hidden rounded-[16px]">
            <img
              src="/landing/agroflow-parasols.jpg"
              alt="Allée de parasols et d'étals dans un marché au petit matin"
              className="aspect-[3/4] w-full object-cover lg:aspect-[4/5]"
            />
          </figure>
          <div>
            <p className="landing-eyebrow text-stone">Pourquoi ça compte</p>
            <h2 className="landing-heading mt-4 text-ink-black">
              Derrière chaque kilogramme, un producteur a déjà fait sa part.
            </h2>
            <p className="landing-body mt-5 max-w-[46ch] text-stone">
              Quand les volumes sont trop petits pour remplir un véhicule, le
              transport coûte cher et le parcours se perd. AgroFlow ne remplace
              pas le camion : il rend visible ce qui peut voyager ensemble, et
              ce qui arrive au marché.
            </p>
            <p className="landing-body mt-4 max-w-[46ch] text-stone">
              Enregistrez un lot, rapprochez les besoins compatibles, pilotez
              l'opération, consultez le passeport. Quatre gestes, une continuité
              du départ à la livraison.
            </p>
          </div>
        </section>

        <section
          id="acteurs"
          data-landing-reveal
          className="mx-auto w-full max-w-[1280px] px-5 pt-[80px]"
        >
          <p className="landing-eyebrow text-stone">Pour qui</p>
          <h2 className="landing-heading mt-4 max-w-[18ch] text-ink-black">
            Quatre rôles, un même parcours.
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ACTORS.map((actor) => (
              <li key={actor.label}>
                <figure>
                  <div className="overflow-hidden rounded-[16px]">
                    <img
                      src={actor.src}
                      alt={actor.alt}
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-4">
                    <h3 className="landing-sub text-ink-black">{actor.label}</h3>
                    <p className="landing-caption mt-1 text-stone">{actor.text}</p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="acces"
          data-landing-reveal
          className="mx-auto w-full max-w-[1280px] px-5 pt-[80px]"
        >
          <figure className="overflow-hidden rounded-[16px]">
            <img
              src="/landing/agroflow-piste.jpg"
              alt="Piste latérite au soleil couchant, entre palmiers et baobabs"
              className="aspect-[16/9] w-full object-cover"
            />
          </figure>
          <div className="mt-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-[36ch]">
              <h2 className="landing-heading text-ink-black">
                Prêt à ouvrir une opération.
              </h2>
              <p className="landing-body mt-3 text-stone">
                Créez votre compte avec le rôle qui vous correspond, vérifiez votre
                adresse, et vous êtes sur votre tableau de bord. L'acheteur consulte
                le passeport sans compte, à l'arrivée.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LandingLink to="/inscription">Créer un compte</LandingLink>
              <LandingLink to="/connexion" variant="outline">
                Se connecter
              </LandingLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-[80px] flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 border-t border-ink-black/10 px-5 py-8">
        <div className="flex items-center gap-2.5">
          <BrandMark variant="black" className="size-8" decorative />
          <div>
            <p className="landing-wordmark landing-caption font-medium text-ink-black">AgroFlow</p>
            <p className="landing-caption text-pebble">
              Mutualisation logistique agricole
            </p>
          </div>
        </div>
        <Link to="/connexion" className="landing-nav-link landing-caption">
          Connexion
        </Link>
      </footer>
    </div>
  );
}
