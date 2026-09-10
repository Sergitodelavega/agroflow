# Implementation Plan: Reste AgroFlow (spec UX + auth)

## Overview

Le proto a déjà le métier (lots, compatibilité, opérations, passeport, alertes, carte), l’auth à trois cartes, le thème clair par défaut, et le bandeau « Prochain pas ». Ce plan ne reprend **que ce qui manque** pour coller au spec : UI encore trop « cockpit », carte illisible en light, CTA de page parfois en contradiction avec le guidage, parcours acheteur injouable.

## Déjà livré (hors scope)

- Connexion producteur / transporteur / opérateur + « Remplir la démo » + déconnexion
- Session `localStorage`, routes protégées, passeport public sans session
- `getNextStep` + bandeau `NextStep` dans `AppShell`
- Tableaux conservés, pas de backend, pas de runner de tests

## Architecture Decisions

- **Pas de nouvelle feature métier.** Pas d’inscription, pas de 4ᵉ écran d’auth sauf décision explicite (le spec dit : pas de carte acheteur pour l’instant).
- **Acheteur = parcours public.** On rend la user story acheteur jouable via le passeport (QR / URL), pas via une 4ᵉ carte login.
- **Un CTA primaire par écran.** Le bandeau reste la source ; les boutons de page (dashboard, liste des lots) doivent pointer la même action ou disparaître s’ils la contredisent.
- **Tables inchangées.** On n’aère que les primitives (`Panel`, `KPIStat`, `Button`) et le chrome.
- **Carte des flux.** Remplacer les couleurs hardcodées dark (`#1a221f`, `#4ade80`) par des tokens / teintes light.

## Dependency graph

```
Primitives UI (padding, rayons)
    │
    └── Chrome AppShell (coins, densité)     ← peut suivre tout de suite
Carte des flux light                         ← indépendant, parallélisable
CTA pages alignés sur getNextStep            ← indépendant du visuel
Parcours acheteur (passeport public)         ← indépendant
    │
    └── Vérification manuelle 3 rôles + QR
```

Ordre : fondations visuelles → carte → CTA → acheteur → checkpoint humain.

## Task List

### Phase 1: Visuel restant

- [x] Task 1: Aérer les primitives UI
- [x] Task 2: Rendre la carte des flux lisible en light

### Checkpoint: Visuel

- [ ] Build `pnpm build`
- [ ] Login + dashboard + lots : cartes plus aérées, tableaux toujours des tableaux
- [ ] Carte des flux : grille et labels visibles sur fond clair

### Phase 2: Parcours

- [x] Task 3: Aligner les CTA de page sur le guidage
- [x] Task 4: Rendre le parcours acheteur jouable sans session

### Checkpoint: Complete

- [ ] Producteur / transporteur / opérateur : un prochain pas + un CTA cohérent
- [ ] Passeport public : consultation + confirmation de réception possible
- [ ] Réinitialiser la démo : guidage encore juste
- [ ] Revue humaine avant d’ajouter quoi que ce soit d’autre

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| « Aérer » dérive vers un redesign de toutes les pages | Med | Toucher `ui.tsx` + `AppShell` seulement ; pages inchangées sauf CTA |
| Ajouter une 4ᵉ carte login « pour faire 4 rôles » | Med | Interdit par le spec actuel ; acheteur = passeport public |
| Deux primaires (bandeau + « + Nouveau lot ») | High | Task 3 : une seule action évidente |
| Couleurs hardcodées oubliées ailleurs | Low | Grep `#1a` / `#4ade` après Task 2 |

## Open Questions

- **Toggle sombre** — le spec propose de le garder. On le garde (aucune tâche pour le retirer).
- **4ᵉ carte acheteur** — non, sauf si tu changes le spec. Task 4 = passeport public.
- **Palette** — on enrichit les tokens existants, on ne redessine pas.

Valide ce plan avant implémentation.
