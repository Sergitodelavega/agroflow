# AgroFlow

Prototype de groupage agricole au Bénin (hackathon) : lots, transport partagé, passeport produit et 4 rôles (producteur, transporteur, opérateur, acheteur). Front-only (React + Vite), état dans `localStorage`.

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

## Comptes de démo

Mot de passe commun : `demo`

| Rôle | Compte |
| --- | --- |
| Producteur | Adjovi H. — `adjovi@seme.coop` |
| Transporteur | Karim B. — `karim@borgou-express.bj` |
| Opérateur | Rachid S. — `rachid@agroflow.bj` |

L’acheteur n’a pas de carte de connexion : le passeport QR (`#/passeport/:id`) est public.

Après un changement de seed ou de modèle, utiliser **Réinitialiser la démo** dans l’app.
