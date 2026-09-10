# Tasks: Reste AgroFlow

## Task 1: Aérer les primitives UI

**Description:** Le light est le défaut, mais `Panel`, `KPIStat`, `Button` et le chrome restent en `rounded-md` / `rounded-sm` avec peu d’air — encore un look cockpit. On aligne les primitives et le shell sur les cartes de login (plus de padding, coins plus ronds). Les tableaux ne changent pas.

**Acceptance criteria:**
- [x] `Panel`, `KPIStat` et `Button` ont plus de padding et des coins plus ronds (`rounded-lg` / `rounded-xl`), tokens light existants
- [x] `AppShell` (sidebar, header) utilise les mêmes rayons ; pas de nouveau composant
- [x] Aucun `<table>` n’est remplacé par des cartes

**Verification:**
- [ ] Tests pass: N/A (pas de runner)
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: login + dashboard + liste des lots — cartes aérées, tables intactes

**Dependencies:** None

**Files likely touched:**
- `src/components/ui.tsx`
- `src/components/AppShell.tsx`

**Estimated scope:** Small: 1-2 files

---

## Task 2: Rendre la carte des flux lisible en light

**Description:** `FlowMap` hardcode une grille `#1a221f`, des traits `#4ade80` et des labels `#8a978f` — pensés pour le dark. En light, la carte est illisible ou flashy. Remplacer par des couleurs adaptées au thème (tokens ou `currentColor` / classes).

**Acceptance criteria:**
- [x] Grille, corridors et labels contrastent sur fond clair (et restent lisibles si on bascule en dark)
- [x] Plus de hex dark-only (`#1a221f`, `#4ade80`) dans le SVG
- [x] La carte reste un SVG simplifié, pas une vraie carte

**Verification:**
- [ ] Tests pass: N/A
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: `/carte` en light (et un coup d’œil dark) — zones et flux visibles

**Dependencies:** None (parallélisable avec Task 1)

**Files likely touched:**
- `src/pages/FlowMap.tsx`

**Estimated scope:** Small: 1-2 files

---

## Checkpoint: Visuel (après Tasks 1–2)

- [x] `pnpm build` réussit
- [x] Cartes / KPI / boutons aérés ; tableaux inchangés
- [x] Carte des flux lisible en light
- [x] Revue visuelle avant d’enchaîner les CTA

---

## Task 3: Aligner les CTA de page sur le guidage

**Description:** Le bandeau dit « Analyser la compatibilité » mais le dashboard n’a pas de primaire, et `/lots` affiche « + Nouveau lot » — deux actions concurrentes. Un seul CTA primaire par écran, le même que `getNextStep` (ou pas de bouton page si le bandeau suffit et qu’un second primaire contredirait).

**Acceptance criteria:**
- [x] Dashboard : un primaire visible qui reprend `getNextStep` (libellé + destination), ou aucun primaire concurrent
- [x] `/lots` : pas de « + Nouveau lot » si le prochain pas est la compatibilité ; le créer un lot reste possible via le nav
- [x] Transporteur : aucun bouton « Créer un lot » / « Regrouper » hors bandeau (déjà vrai pour le nav)

**Verification:**
- [ ] Tests pass: N/A
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: login producteur (seed) → bandeau et bouton page disent la même chose ; transporteur → pas de créer/regrouper

**Dependencies:** None (guidage déjà en place)

**Files likely touched:**
- `src/pages/Dashboard.tsx`
- `src/pages/LotsList.tsx`

**Estimated scope:** Small: 1-2 files

---

## Task 4: Rendre le parcours acheteur jouable sans session

**Description:** La user story acheteur (consulter un passeport, confirmer une réception) n’est pas jouable : pas de carte login (volontaire) et le passeport public a `canConfirmReception: false`. Sans ajouter de 4ᵉ carte, le visiteur QR doit pouvoir confirmer la réception d’un lot éligible, avec un prochain pas visible sur cette page.

**Acceptance criteria:**
- [x] Sur `/passeport/:id` sans session : consultation inchangée + bouton « Confirmer la réception » si le lot est `en_transport` ou `livre`
- [x] Après confirmation : état persisté (store), bouton remplacé par l’état confirmé
- [x] Un prochain pas est visible sur le passeport public (pas seulement dans `AppShell` connecté)
- [x] Toujours pas de 4ᵉ carte login

**Verification:**
- [ ] Tests pass: N/A
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: déconnecté → `#/passeport/AGF-2026-004` (ou lot `en_transport`) → confirmer réception → reload : toujours confirmé

**Dependencies:** None

**Files likely touched:**
- `src/pages/Passport.tsx`
- `src/lib/role.tsx` (guest perms **ou** logique locale au passeport — pas les deux)

**Estimated scope:** Small: 1-2 files

---

## Checkpoint: Complete (après Tasks 3–4)

- [x] Producteur : seed → « Analyser la compatibilité » partout où un primaire existe
- [x] Transporteur : « Ouvrir l’opération » / événement, jamais créer/regrouper
- [x] Opérateur : flux créer → regrouper → opération encore possible
- [x] Acheteur : passeport public + confirmation sans login
- [ ] « Réinitialiser la démo » puis revérifier le bandeau
- [x] `pnpm build`
- [ ] Revue humaine — rien d’autre (pas de backend, pas de runner de tests, pas de 4ᵉ carte)
