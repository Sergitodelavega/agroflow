# Tâches : acteur Acheteur

Le rôle jouable aujourd’hui est le **visiteur QR**, pas Fatou connectée. Fatou D. / Grossiste Dantokpa existe dans le code (`PERMISSIONS.acheteur`, home `/lots`) mais **aucune carte de connexion** — contrainte spec actuelle. Sans session : label **Visiteur**, nav vide, seul `/passeport/:id` est ouvert.

Rien n’est encore corrigé. Cocher au fur et à mesure.

## Écran / guidage

- [ ] **1. Retour = Connexion** — Un scan QR propose « ← Connexion » (lot introuvable et lien sous le titre). L’acheteur n’a pas de compte ; ça le sort du passeport. Remplacer par un retour qui reste dans le parcours public (ou retirer le lien).

- [ ] **2. Bandeau toujours « Confirmer la réception »** — `publicStep` dans `src/pages/Passport.tsx` garde ce libellé même si le lot est `enregistré` (`AGF-2026-003`) ou déjà confirmé. Aligner le bandeau sur l’état : consulter / confirmer / déjà fait.

- [ ] **3. Confirmation trop tôt** — `canReceive` accepte `en_transport` (`AGF-2026-004` encore sur la route, avec incident). Le brief parle d’une consultation **à l’arrivée**. À croiser avec la décision **10**.

- [ ] **4. Lien opération cassé** — Le passeport public lie `OP-2026-011` vers `/operation/…`, protégé par `RequireAuth` → écran de connexion. Afficher l’opération en texte, ou une vue lecture seule publique.

- [ ] **5. Pas d’inventaire acheteur** — Le spec dit « j’arrive sur les lots ». Sans session : `/passeport/:id` et `/connexion` seulement. Pas de liste « lots à réceptionner ». Dépend de la décision **9**.

## Périmètre

- [ ] **6. Toute la plateforme** — Si session acheteur un jour : `scopeOwn: false`, aucun filtre destination. Fatou verrait Ouando et Parakou, pas seulement Dantokpa. Filtrer par marché (ex. lots → `Cotonou — Marché Dantokpa`). Seed utile : `AGF-2026-014` (œufs → Dantokpa, en transport), `AGF-2026-019` (oranges → Parakou, livré).

- [ ] **7. N’importe quel QR confirme n’importe quel lot** — Pas de marché, pas d’identité acheteur. Trancher le niveau de réalisme du proto (visiteur vs réceptionnaire).

- [ ] **8. Réception bricolée** — `addEvent(lot.id, "controle", "Réception confirmée par l'acheteur", "ok")`. Le statut du lot ne change pas ; seul un bandeau apparaît. Envisager un type d’événement dédié et/ou un statut visible.

## Métier (à trancher avant de coder)

- [ ] **9. 4ᵉ carte Fatou, ou 100 % QR ?** — Une carte de connexion contredit le spec auth actuel (« pas de 4ᵉ carte »). Rester QR = corriger surtout 1–4 et 8. Carte Fatou = ouvre 5 et 6.

- [ ] **10. Confirmer seulement `livre`, ou aussi `en_transport` ?** — Décide le périmètre de la tâche **3**.

## Déjà en place (ne pas casser)

- Passeport public sans session (`#/passeport/AGF-2026-004` ou `019`)
- QR, identité, historique
- Bouton **Confirmer la réception** qui persiste après reload
- Adjovi et Rachid ne confirment plus (`canConfirmReception: false`)

## Fichiers utiles

- `src/pages/Passport.tsx` — bandeau public, bouton réception, liens retour / opération
- `src/App.tsx` — `/passeport/:id` hors `RequireAuth` ; le reste exige une session
- `src/lib/role.tsx` — `PERMISSIONS.acheteur`, `GUEST_PROFILE` / `GUEST_PERMS`
- `src/lib/auth.tsx` — 3 comptes démo seulement (pas d’acheteur)
- `src/lib/guidance.ts` — `forAcheteur` (ne tourne que si session `acheteur`, aujourd’hui inatteignable)
- `src/pages/LotsList.tsx` — inventaire si Fatou existait
- `SPEC.md` — acheteur sans carte ; passeport QR public
