# AgroFlow

Plateforme de mutualisation logistique agricole au Bénin : lots, transport partagé, passeport produit et 4 rôles (producteur, transporteur, opérateur, acheteur). React + Vite, Supabase optionnel, repli `localStorage`.

Spécification UX : [SPEC.md](./SPEC.md).

## Prérequis

- Node.js 22
- pnpm 12.3.4 (déclaré dans `package.json`)

Si `pnpm` n’est pas disponible localement :

```bash
npx pnpm@12.3.4 install
npx pnpm@12.3.4 dev
```

## Démarrer

```bash
git clone https://github.com/Sergitodelavega/agroflow.git
cd agroflow
pnpm install
pnpm dev
```

L’app s’ouvre sur `http://127.0.0.1:5173/` (ou le port `$PORT`, défaut 8443 dans Figma Make).

## Créer un compte

L’inscription est ouverte : `#/inscription`, ou le bouton **Créer un compte** de l’accueil.

1. Choisir un rôle — producteur, transporteur ou opérateur logistique.
2. Renseigner nom, organisation, e-mail et mot de passe (8 caractères minimum).
3. Confirmer avec le code à six chiffres.

Sans Supabase configuré, aucun e-mail n’est envoyé : le code s’affiche directement à l’étape de vérification. Avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` renseignés, Supabase Auth prend le relais et envoie un vrai e-mail. Détail du parcours : [docs/BACKEND.md](./docs/BACKEND.md).

**Un compte créé démarre sur un espace vide** — aucune donnée de démonstration. Chaque écran indique alors l’action qui débloque la suite.

## Comptes de démo

Ces trois comptes ouvrent un espace déjà rempli (22 lots, 4 opérations). Mot de passe commun : `demo`

| Rôle | Compte |
| --- | --- |
| Producteur | Adjovi H. — `adjovi@seme.coop` |
| Transporteur | Karim B. — `karim@borgou-express.bj` |
| Opérateur | Rachid S. — `rachid@agroflow.bj` |

L’acheteur n’a pas de compte : le passeport QR (`#/passeport/:id`) est public.

Après un changement de seed ou de modèle, utiliser **Réinitialiser la démo** dans l’app (**Vider mon espace** sur un compte créé). Le seed SQL équivalent vit dans [`supabase/seed.sql`](./supabase/seed.sql).
