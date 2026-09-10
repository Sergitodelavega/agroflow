# AgroFlow — Prototype fonctionnel (Hackathon)

## Context

Le projet **AgroFlow** (brief : `src/imports/pasted_text/agroflow-projet.md`) est une plateforme de
mutualisation logistique agricole présentée au Hackathon Cursor × Devs Days 2026. Le besoin : coordonner
des petits volumes de produits agricoles dispersés en identifiant des regroupements de cargaisons compatibles,
en organisant des opérations de transport, et en assurant une traçabilité numérique de chaque lot
(passeport, QR code, historique d'événements, alertes de vigilance).

Le scaffold actuel est **vierge** : `src/App.tsx` ne rend rien, aucune dépendance (routing, QR, icônes,
charts) n'est installée. Nous construisons donc l'application depuis zéro.

Décision produit validée : **front-end seul**, données en mémoire + `localStorage`, seedées avec un
scénario de démo réaliste reproductible (section 11 du brief). UI en **français**.

**Objectif** : un prototype démontrant le parcours complet de bout en bout :
Création de lot → Analyse de compatibilité → Proposition de regroupement → Opération → Passeport numérique
(QR) → Événement de transport → Alerte → Consultation.

## Direction esthétique

Stance **data-dense** (type terminal logistique / FlightRadar), **dark mode**, commit total sur toutes les
sections. Typo : neo-grotesque sans pour l'UI + une mono (JetBrains Mono) pour données, identifiants de lots,
statuts et labels tabulaires. Accent fonctionnel (vert agricole/ambre) réservé aux états interactifs et aux
niveaux de vigilance (ok / vigilance / alerte). Tables denses, hairlines basse opacité, KPI compacts,
whitespace maîtrisé.

## Dépendances à installer

- `react-router-dom` — navigation + deep-link du passeport (`/passport/:id`) pour que le QR pointe vers une URL réelle (HashRouter).
- `qrcode` — génération du QR code du passeport.
- `lucide-react` — jeu d'icônes cohérent.

(`recharts` optionnel, seulement si une petite viz de flux est ajoutée ; sinon SVG maison léger.)

## Architecture

Point d'entrée inchangé (`src/main.tsx` → `src/App.tsx`). Fonts + tokens dans `src/index.css`
(Tailwind v4 `@theme`, dark par défaut, `@import` Google Fonts en tête de fichier).

```
src/
  App.tsx                    # HashRouter + shell applicatif (nav latérale data-dense)
  index.css                  # @import fonts, @theme tokens dark, scrollbars, base
  lib/
    types.ts                 # Lot, Operation, LotEvent, Alert, enums (produit, statut, vigilance)
    store.tsx                # Context + reducer, persistance localStorage, seed du scénario démo
    seed.ts                  # Données seedées : ~6-8 lots (producteurs, zones, destinations), 1 opération
    compatibility.ts         # Moteur de compatibilité (scoring multi-critères) + génération de propositions
    alerts.ts                # Règles de vigilance (retard, incident, rupture période) → niveau ok/vigilance/alerte
  components/
    AppShell.tsx             # Layout : sidebar nav + header, réutilisé par toutes les vues
    KPIStat.tsx, StatusBadge.tsx, VigilanceBadge.tsx, DataTable.tsx  # primitives data-dense
  pages/
    Dashboard.tsx            # Vue d'ensemble : KPIs, lots récents, opérations, alertes actives
    LotCreate.tsx            # Formulaire création de lot (produit, quantité, zone, destination, période, contraintes)
    LotsList.tsx             # Liste/table filtrable des lots
    Compatibility.tsx        # Analyse : sélection lot → lots compatibles scorés → proposition de regroupement
    OperationDetail.tsx      # Opération regroupée : lots inclus, volume total, corridor, étapes, ajout d'événement
    Passport.tsx             # Passeport numérique : identité lot + QR + timeline événements + vigilance (accessible /passport/:id)
    FlowMap.tsx              # Visualisation spatiale simplifiée (SVG : zones de départ → destinations, flux)
```

### Modèle de données (`lib/types.ts`)
- **Lot** : `id` (ex. `AGF-2026-001`), producteur, produit + catégorie, quantité (kg), zone/localisation de départ (coord approx), destination/corridor, période de disponibilité (début/fin), contraintes déclarées (ex. périssable, réfrigéré, fragile), statut (`enregistré | regroupé | en transport | livré`), `operationId?`, `events[]`.
- **Operation** : `id`, lots regroupés, volume total, corridor, capacité véhicule, statut, étapes/jalons.
- **LotEvent** : `id`, type (`création | regroupement | départ | contrôle | retard | incident | livraison`), horodatage, note, `vigilance`.
- **Alert** : dérivée des règles, niveau `ok | vigilance | alerte`.

### Moteur de compatibilité (`lib/compatibility.ts`)
Fonction pure `scoreCompatibility(lotA, lotB)` combinant les critères du brief §7 :
catégorie produit, proximité zone de collecte, destination/corridor commun, chevauchement de période de
disponibilité, quantité vs capacité de regroupement, compatibilité des contraintes déclarées
(ex. périssable + non-réfrigéré → pénalité/incompatible). Retourne un score 0-100 + raisons lisibles.
`proposeGrouping(lot, allLots)` retourne les lots compatibles triés + le volume total cumulé.
Logique transparente et démontrable (affichage des raisons du matching).

### Règles de vigilance (`lib/alerts.ts`)
Ex. : événement `retard` → vigilance ; `incident` → alerte ; produit périssable dont la période de
disponibilité est dépassée → alerte ; capacité dépassée sur une opération → vigilance. Affichées sur le
dashboard, le passeport et l'opération, signalées par couleur **+ icône/texte** (pas la couleur seule).

## Parcours de démonstration (câblé end-to-end)
1. Dashboard seedé : plusieurs lots de producteurs, une alerte, KPIs.
2. « Créer un lot » : formulaire → nouveau lot enregistré (persisté).
3. « Analyse de compatibilité » : sélection d'un lot → lots compatibles scorés avec raisons → « Proposer un regroupement ».
4. Création de l'opération regroupée → volume total, corridor, statut.
5. Ouverture du passeport d'un lot → QR code (scannable, deep-link `/passport/:id`) + identité + timeline.
6. Ajout d'un événement de transport (ex. retard) → mise à jour timeline + déclenchement d'une alerte de vigilance.
7. Consultation « acheteur » du passeport via l'URL/QR.

## Fichiers clés à créer/modifier
- `src/index.css` — fonts + tokens dark data-dense (à étendre, pas réécrire le reset existant).
- `src/App.tsx` — remplacer le placeholder par le HashRouter + AppShell + routes.
- Tous les fichiers `lib/`, `components/`, `pages/` listés ci-dessus (nouveaux).

## Vérification
- `pnpm install` des nouvelles dépendances, build Vite déjà en cours (hot reload).
- Utiliser `/run` ou le panneau preview pour dérouler manuellement les 7 étapes du scénario.
- Vérifier : persistance après reload (localStorage), QR pointe vers `/passport/:id` et affiche le bon lot,
  déclenchement d'alerte après ajout d'un événement retard/incident, responsive au breakpoint ~1000px
  (collapse sidebar/tables), contraste AA du texte.
- Un bouton « Réinitialiser la démo » pour re-seeder proprement pendant la présentation.
