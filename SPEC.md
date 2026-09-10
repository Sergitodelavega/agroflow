# Spec: UX claire et guidage par rôle

## Objective

Rendre le prototype AgroFlow utilisable par ses vrais utilisateurs — producteur, transporteur, acheteur, opérateur — sans qu’on leur explique l’interface.

Le proto Figma Make est déjà fonctionnel (lots, compatibilité, opération, passeport, alertes, carte, 4 rôles, seed + `localStorage`). Le thème sombre data-dense et l’absence d’un prochain pas visible rendent le parcours peu évident.

**User stories**

- En tant que **producteur**, je vois clairement comment enregistrer un lot, puis comment lancer une analyse de compatibilité.
- En tant que **transporteur**, je vois l’opération à prendre en charge et comment déclarer un événement.
- En tant que **acheteur**, j’arrive sur les lots et je sais ouvrir un passeport / confirmer une réception.
- En tant qu’**opérateur**, j’enchaîne le flux complet (créer → regrouper → suivre → consulter) avec une action principale évidente à chaque écran.

**Authentification (ajout validé)**

- Parcours complet **inscription → vérification → connexion**.
- Inscription : rôle (producteur, transporteur, opérateur logistique), nom, organisation, e-mail, mot de passe.
- Vérification par code à six chiffres. Supabase Auth l’envoie par e-mail quand il est configuré ; sinon le code s’affiche à l’écran pour que la démonstration tourne sans backend.
- Connexion par e-mail + mot de passe. Les trois comptes de démo continuent de fonctionner et restent préremplissables depuis l’écran de connexion.
- **Un compte créé démarre sur un espace vide.** Les données de seed restent réservées aux comptes de démo ; chaque écran a un état vide avec son action principale.
- Après connexion, l’acteur arrive sur **son** tableau de bord (permissions déjà existantes).
- Persistance : Supabase Auth si `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` sont renseignés, sinon `localStorage`. Aucun secret en dur.
- L’acheteur n’a pas de compte. Le passeport `/passeport/:id` reste consultable sans session (QR).
- Le sélecteur de rôle dans le header est remplacé par le profil connecté + déconnexion.

**Ce que ça n’est pas :** un mode jury, de nouvelles features métier, ni le remplacement des tableaux par des cartes.

## Tech Stack

Inchangé, déjà en place :

- React 19 + React DOM 19
- Vite 8, TypeScript 5.7
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `react-router-dom` 7 (HashRouter)
- `lucide-react`, `qrcode`, `motion` (transitions de page, 250ms)
- État : Context + `localStorage` (`agroflow.state.v5`, `agroflow.role`, `agroflow.theme`)
- Pas de runner de tests dans le scaffold

## Commands

```
Dev:     pnpm dev          # déjà lancé dans Figma Make ($PORT, défaut 8443)
Build:   pnpm build
Preview: pnpm preview
Format:  pnpm format
```

Vérification manuelle : panneau preview / navigateur, 4 rôles, scénario ci-dessous.

## Project Structure

On étend le projet existant. Pas de nouveau package, pas de backend.

```
SPEC.md                      → ce document (source de vérité)
src/index.css                → tokens : light par défaut, dark optionnel
src/lib/theme.ts             → défaut `light` (aujourd’hui `dark`)
src/lib/accounts.ts          → rôles et comptes de démo (source unique)
src/lib/auth.tsx             → session, inscription / vérification / connexion
src/lib/api/auth*.ts         → Supabase Auth si configuré, sinon équivalent localStorage
supabase/seed.sql            → données de démonstration, séparées du schéma
src/lib/role.tsx             → rôle dérivé de la session (plus de sélecteur)
src/pages/Login.tsx          → connexion, inscription, vérification + préremplissage démo
src/lib/guidance.ts          → nouveau : prochain pas (rôle + route + état)
src/components/AppShell.tsx  → chrome clair, zone de guidage
src/components/ui.tsx        → cartes / boutons plus aérés (tables hors scope)
src/components/NextStep.tsx  → nouveau : bandeau / carte « prochain pas »
src/pages/*.tsx              → CTA principal aligné sur le guidage ; tables conservées
src/lib/store.tsx            → ne pas modifier le modèle sauf besoin de guidage (demander d’abord)
```

## Code Style

Conventions actuelles : exports default des pages, Tailwind v4, français UI, apostrophes dans des doubles quotes.

Le guidage est une fonction pure, pas de logique métier dupliquée dans chaque page :

```tsx
export type NextStep = {
  title: string;
  body: string;
  actionLabel: string;
  to: string;
};

export function getNextStep(input: {
  role: Role;
  path: string;
  lots: Lot[];
  operations: Operation[];
  perms: Permissions;
}): NextStep | null {
  // Une action principale, formulée pour le rôle, pas un tutoriel générique.
}
```

Règles UI :

- Light par défaut. Fond clair, cartes (`Panel`) avec plus de padding et coins plus ronds.
- Un seul CTA `variant="primary"` évident par écran (ou le bandeau `NextStep` pointe vers lui).
- Les **tableaux restent des tableaux** (markup, colonnes, densité tabulaire). On n’y touche que pour le contraste light.
- Animations : `motion` pour entrée/sortie de page et login (~250ms). Hover et thème restent en CSS. `prefers-reduced-motion` via `useReducedMotion`. Pas d’autre lib d’animation.
- Labels de guidage en français, phrase courte, verbe d’action (« Créer un lot », « Déclarer un retard »).

## Testing Strategy

Aucun test automatisé aujourd’hui ; on n’ajoute pas de runner sauf décision explicite.

**Niveaux**

1. **Build** — `pnpm build` passe (TypeScript + Vite).
2. **Manuel, par rôle** — changer le sélecteur de rôle, parcourir le flux du rôle, vérifier qu’un prochain pas est visible et juste.
3. **Régression métier** — créer un lot, proposer un regroupement, ouvrir un passeport, ajouter un événement, réinitialiser la démo. Les données et règles (`compatibility.ts`, `alerts.ts`, store) ne changent pas.
4. **Contraste** — texte et CTA lisibles sur fond clair (pas de vert fluo sur blanc, badges vigilance/alerte toujours avec icône + texte).

Pas d’exigence de couverture de code. Si un test runner est ajouté plus tard : tests unitaires de `getNextStep` (une cas par rôle × 2–3 états).

## Boundaries

- **Always :** light par défaut ; conserver les 4 rôles et leurs permissions ; conserver les tableaux ; conserver le modèle (lots, opérations, événements, alertes) ; UI en français ; vérifier les 4 rôles avant de dire « terminé ».
- **Ask first :** nouvelle dépendance ; changer le modèle de données ou la clé `localStorage` ; supprimer le toggle sombre ; ajouter un runner de tests ; changer les règles de compatibilité ou d’alertes.
- **Never :** injecter des données de seed dans un compte créé ; nouvelles features métier (notif, carte réelle, optimisation d’itinéraires) ; remplacer les tableaux par des listes de cartes ; remettre le dark data-dense comme look produit ; inventer un mode « jury » ; animations lourdes ou lib dédiée.

## Success Criteria

Visuel

- [ ] L’app s’ouvre en thème clair (pas de flash sombre, défaut `light` pour les nouveaux visiteurs).
- [ ] Fond, cartes et textes sont aérés : plus d’espace, cartes distinctes, CTA primaire lisible.
- [ ] Les tableaux (lots, compatibilité, etc.) sont toujours des tableaux, lisibles en light.
- [ ] Le dark n’est plus le langage visuel du produit. Un toggle optionnel peut rester s’il ne casse pas le défaut light.

Guidage (un prochain pas visible)

| Rôle | Écran d’entrée | Prochain pas attendu (seed par défaut) |
|---|---|---|
| Producteur | `/` | Créer un lot, ou analyser la compatibilité s’il a déjà un lot non regroupé |
| Transporteur | `/` | Ouvrir l’opération à prendre en charge / déclarer un événement |
| Acheteur | `/lots` | Ouvrir un passeport (et confirmer la réception si l’action existe) |
| Opérateur | `/` | Enchaîner le flux : lots → créer ou compatibilité → opération → événement |

- [x] Sur chaque écran du flux du rôle, un prochain pas est visible (bandeau ou carte) avec un libellé d’action et une destination.
- [x] Le prochain pas respecte les permissions : jamais « Créer un lot » pour un acheteur, jamais « Regrouper » pour un transporteur.
- [ ] Le jury / un membre de l’équipe peut jouer les 4 rôles sans qu’on lui dise où cliquer.
- [ ] Après « Réinitialiser la démo », le guidage redevient cohérent avec le seed.
- [ ] `pnpm build` réussit.

Authentification

- [x] `#/inscription` propose les trois rôles, puis le formulaire nom / organisation / e-mail / mot de passe.
- [x] L’inscription mène à l’étape de vérification ; le code est affiché sans Supabase, envoyé par e-mail avec.
- [x] Un compte fraîchement vérifié arrive connecté sur son tableau de bord, avec un espace vide.
- [x] Une connexion valide mène au dashboard du rôle ; une erreur affiche un message.
- [x] Les trois comptes de démo fonctionnent toujours et gardent les données de seed.
- [x] Déconnexion ramène à la connexion. Le passeport reste lisible sans être connecté.

## Open Questions

1. **Toggle sombre** — on le garde (light par défaut) ou on le retire ? Proposition : le garder, ce n’est pas le look produit.
2. **Bandeau vs CTA inline** — proposition : bandeau `NextStep` sous le header, plus le bouton primaire de la page aligné sur la même action (pas deux actions contradictoires).
3. **Palette** — réutiliser / enrichir les tokens light déjà dans `src/index.css` (`#f4f6f2`, vert `#1f9d57`) plutôt que tout redessiner.

Corriger ces points maintenant, ou valider le spec tel quel pour passer au plan.
