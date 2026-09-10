# Ce qu’il reste (après le proto jouable)

Priorisé. Le flux producteur → opérateur → transporteur est en place. Ce fichier note ce qui manque encore pour le pitch.

## À traiter en premier

### 1. L’acheteur n’est pas jouable pour un jury

Le brief et l’accueil promettent : scan QR, voir le parcours, confirmer la réception.

Aujourd’hui :

- Pas de lien démo vers un passeport depuis l’accueil. Il faut connaître une URL (`#/passeport/AGF-2026-014` ou `019`).
- « ← Connexion » sort l’acheteur du passeport (il n’a pas de compte).
- Un lien vers l’opération ouvre l’écran de login (`RequireAuth`).
- « Confirmer la réception » n’est qu’un bandeau : événement `controle` avec une note, le lot reste `livre`.
- Le bandeau dit parfois « Confirmer » même si le lot n’est pas arrivé, ou déjà confirmé.
- On peut confirmer un lot encore `en_transport`.

Détail déjà listé : `tasks/acheteur.md` (points 1–4, 8, décisions 9–10).

**Minimum utile avant le pitch :** un bouton « Voir un passeport » sur l’accueil + un passeport public propre (retour qui reste public, pas de lien cassé vers l’opération, confirmation alignée sur `livre`).

### 2. Le regroupement est trop large

Les lots sont maintenant entre 25 et 200 kg, mais l’algo accepte encore oignon + igname + ananas + poisson dès que la destination est Dantokpa (score ≥ 55, peu de blockers).

Neuf petits lots dans un pickup raconte l’inverse de « rapprochement intelligent pour petits volumes ».

Fichier : `src/lib/compatibility.ts`.

### 3. Réinitialiser la démo avant de montrer

Les nouveaux volumes sont dans le seed. Sans **Réinitialiser la démo**, `localStorage` (`agroflow.state.v5`) garde les anciens tonnes. Le bouton est dans la sidebar desktop uniquement.

## Secondaire (déjà tranché ou moins urgent)

- Carte des flux : Karim voit encore tout le réseau (reporté).
- Pas de 4ᵉ carte Fatou (spec actuel = QR only). Rouvrir seulement si on change le spec.
- Réception : seulement `livre`, ou aussi `en_transport` ? → décision 10 dans `tasks/acheteur.md`.
- Confirmation de réception plus « vraie » (type d’événement / statut visible) → point 8.
- Toggle sombre : question ouverte du spec, pas un oubli.

## Déjà en place (ne pas recasser)

- Trois comptes démo, mot de passe `demo`.
- Lots 25–200 kg, véhicules 200–450 kg, création de lot bornée 25–200.
- Confirmations : créer l’opération (Rachid), démarrer / marquer livrée (Karim).
- Adjovi lecture seule sur la compatibilité ; Rachid ne pilote pas le transport.
- Passeport consultable sans session.
