# Backend — préparation Supabase + paiements

AgroFlow reste un proto front. L’état métier vit dans `localStorage` (`agroflow.state.v5`) via `StoreProvider`. Cette note décrit le socle pour un backend Supabase cloud, sans migration des données dans ce passage.

## Environnement

Copier `.env.example` vers `.env.local` (gitignoré).

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase. Vide = pas de client. |
| `VITE_SUPABASE_ANON_KEY` | Clé anon publique. Jamais la service role. |
| `VITE_PAYMENTS` | `sandbox` pour afficher le paiement test. Sinon le flux démo est inchangé. |
| `VITE_KKIAPAY_PUBLIC_KEY` | Clé publique widget Kkiapay. Vide = simulation locale. |
| `VITE_KKIAPAY_SANDBOX` | `true` (défaut). Ne jamais encaisser en live depuis le front. |

Sans URL / clé Supabase, `src/lib/supabase.ts` exporte `supabase = null` et `isSupabaseConfigured = false`. L’app démarre comme aujourd’hui.

## Client et adaptateur

- `src/lib/supabase.ts` — `createClient` si les deux variables sont remplies.
- `src/lib/api/` — seam de persistance derrière `StoreProvider` :
  - `local.ts` : lecture / écriture `localStorage` (implémentation actuelle).
  - `supabase.ts` : **TODO** — même contrat, encore branché sur le miroir local.
  - `index.ts` : choisit Supabase seulement si le client est configuré ; les pages ne changent pas.
- `src/lib/api/auth*.ts` — même principe pour l'authentification :
  - `authTypes.ts` : contrat `AuthRepository`, `AccountSession`, `AuthError`.
  - `authLocal.ts` : comptes dans `localStorage` (`agroflow.accounts.v1`), code de vérification affiché à l'écran.
  - `authSupabase.ts` : Supabase Auth (`signUp` / `verifyOtp` / `signInWithPassword`).
  - `auth.ts` : bascule sur Supabase dès que `isSupabaseConfigured` est vrai.

Les mutations (`createLot`, `createOperation`, événements…) restent dans `store.tsx`. Plus tard, remplacer `repo.save(state)` par des upserts table par table.

## Espaces de données par compte

`StoreProvider` est monté **sous** `AuthProvider` et charge l'espace du compte connecté (`workspaceFor` dans `src/lib/api/types.ts`) :

| Compte | Espace | Contenu de départ |
|---|---|---|
| Comptes de démo (`isDemoEmail`) | `agroflow.state.v5` | Seed complet (`src/lib/seed.ts`) |
| Compte créé via l'inscription | `agroflow.state.v5.user.<id>` | Vide — aucun lot, aucune opération |
| Visiteur non connecté | `agroflow.state.v5` | Seed — le passeport public reste lisible via QR |

Les données de démonstration ne fuient donc jamais dans un compte fraîchement créé : chaque écran affiche un état vide avec son action principale.

## Modèle actuel → tables prévues

Source : `src/lib/types.ts` + comptes démo `src/lib/auth.tsx` / `src/lib/role.tsx`.

| Concept front | Table / vue | Notes |
|---|---|---|
| Session / rôle | `profiles` | `id` (auth.users), `role` (`producteur` \| `transporteur` \| `operateur`), `org`, `display_name`. L’acheteur reste un visiteur passeport. |
| `Lot` | `lots` | Producteur, produit, catégorie, kg, origine / destination (nom + x/y), fenêtres, contraintes[], statut, `operation_id`. |
| `LotEvent` | `lot_events` | `lot_id`, type, `at`, note, vigilance. |
| `Operation` | `operations` | Corridor, transporteur, capacité kg, statut, `created_at`. |
| Lots d’une tournée | `operation_lots` | `operation_id`, `lot_id` — aujourd’hui `Operation.lotIds`. |
| Passeport | vue `passports` | Lot + événements + QR (l’URL reste `/#/passeport/:id`). |
| Paiement sandbox | `transport_payments` | Part FCFA, `operation_id`, org payeur, provider, `transaction_id`. Front : `agroflow.payments.v1`. |

Brouillon SQL : `supabase/migrations/0001_init.sql`. Ne pas l’appliquer en destructif sur une base déjà peuplée.

## Données de démonstration

Le schéma et les données sont séparés. Après la migration, appliquer le seed :

```bash
psql "$DATABASE_URL" -f supabase/seed.sql   # ou coller le fichier dans le SQL Editor
```

`supabase/seed.sql` reprend `src/lib/seed.ts` (22 lots, 4 opérations, leurs événements) et rattache les profils des trois comptes de démo aux utilisateurs `auth.users` correspondants — créez-les d’abord dans Authentication (mot de passe `demo`, e-mail confirmé), sinon le bloc les ignore. Le script est rejouable : il purge les lignes `AGF-2026-*` / `OP-2026-*` avant de réinsérer.

## Authentification

Parcours unique **inscription → vérification → connexion**, quel que soit le backend :

| Étape | Sans Supabase (`VITE_SUPABASE_URL` vide) | Avec Supabase |
|---|---|---|
| Inscription | Compte dans `agroflow.accounts.v1`, mot de passe salé + SHA-256 (WebCrypto) | `auth.signUp` + métadonnées `role`, `display_name`, `org` |
| Vérification | Code à 6 chiffres, valable 15 min, **affiché à l’écran** (aucun e-mail envoyé) | Code envoyé par e-mail, `auth.verifyOtp` |
| Connexion | Comparaison de l’empreinte, session `agroflow.session.v2` | `auth.signInWithPassword` |
| Rôle / profil | Champs du compte local | `user_metadata`, écrasé par `profiles` si la table répond |

Les trois comptes de démo (mot de passe `demo`) sont recréés à la volée côté local. En mode Supabase, si le projet branché ne les contient pas, la connexion de ces adresses retombe sur le compte local — la démonstration ne casse jamais.

Le mot de passe local n’est jamais stocké en clair, mais l’équivalent local reste un artefact de démonstration : la sécurité réelle vient de Supabase Auth.

## Paiement sandbox (Kkiapay)

- Drapeau : `VITE_PAYMENTS=sandbox`.
- Bouton : fiche opération `/operation/:id` (producteur = sa part au prorata ; opérateur = tarif de la tournée).
- Si `VITE_KKIAPAY_PUBLIC_KEY` est présent : SDK React `kkiapay-react` (`KkiapayProvider` + `useKkiapay` / `openKkiapayWidget`), `sandbox: true`.
- Sinon : succès / échec simulés dans le modal, sans encaissement.
- Libellé UI : « Paiement test (sandbox) ».

Vérification serveur (clé privée Kkiapay) : hors scope. À faire dans une Edge Function Supabase plus tard.

## Prochaine étape — migrer les données

1. Créer un projet Supabase, coller URL + anon dans `.env.local`.
2. Appliquer `0001_init.sql` (SQL Editor ou CLI), puis RLS par rôle.
3. Créer les 3 utilisateurs de démo dans Authentication, puis appliquer `supabase/seed.sql` pour remplir `profiles` et les données.
4. Implémenter le mapping dans `src/lib/api/supabase.ts` (select / upsert lots, events, operations).
5. Quand le round-trip est fiable, faire de `getRepository()` le vrai remote et retirer le miroir `localStorage`.
6. Vérifier les paiements sandbox contre `transport_payments` (webhook / Edge Function).
