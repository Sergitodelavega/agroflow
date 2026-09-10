-- AgroFlow — données de démonstration.
-- Miroir SQL de `src/lib/seed.ts` : 22 lots, 4 opérations, leurs événements et
-- les profils des trois comptes de démo.
--
-- Appliquer après `supabase/migrations/0001_init.sql` :
--   psql "$DATABASE_URL" -f supabase/seed.sql      (ou coller dans le SQL Editor)
--
-- Rejouable : les lignes de démo (`AGF-2026-*`, `OP-2026-*`) sont supprimées puis
-- réinsérées. Les paiements sandbox rattachés à ces opérations partent avec elles.
-- Ne jamais l'exécuter sur une base contenant des données réelles.

begin;

-- ---------------------------------------------------------------------------
-- Profils des comptes de démo
-- ---------------------------------------------------------------------------
-- `profiles.id` référence `auth.users`. Créez d'abord les trois utilisateurs
-- (Dashboard > Authentication > Add user, mot de passe `demo`, e-mail confirmé),
-- puis ce bloc rattache leur profil. Les utilisateurs absents sont ignorés.

do $$
declare
  demo record;
begin
  for demo in
    select *
    from (
      values
        ('adjovi@seme.coop', 'producteur', 'Adjovi H.', 'Coopérative Maraîchère de Sèmè'),
        ('karim@borgou-express.bj', 'transporteur', 'Karim B.', 'Transport Borgou Express'),
        ('rachid@agroflow.bj', 'operateur', 'Rachid S.', 'AgroFlow — Coordination')
    ) as t (email, role, display_name, org)
  loop
    insert into public.profiles (id, role, email, display_name, org)
    select u.id, demo.role::public.auth_role, demo.email, demo.display_name, demo.org
    from auth.users u
    where lower(u.email) = demo.email
    on conflict (id) do update
      set role = excluded.role,
          email = excluded.email,
          display_name = excluded.display_name,
          org = excluded.org;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Remise à zéro des lignes de démonstration
-- ---------------------------------------------------------------------------

delete from public.lot_events where lot_id like 'AGF-2026-%';
delete from public.operation_lots where lot_id like 'AGF-2026-%';
delete from public.lots where id like 'AGF-2026-%';
delete from public.operations where id like 'OP-2026-%';

-- ---------------------------------------------------------------------------
-- Opérations (insérées avant les lots : `lots.operation_id` les référence)
-- ---------------------------------------------------------------------------

insert into public.operations (id, corridor, carrier, vehicle_capacity_kg, status, created_at) values
  ('OP-2026-011', 'Parakou / Djougou → Porto-Novo',              'Transport Borgou Express',         400, 'en_cours',  now() - interval '4 days'),
  ('OP-2026-014', 'Bohicon / Dassa → Cotonou',                   'Transport Borgou Express',         200, 'planifiee', now() - interval '1 day'),
  ('OP-2026-015', 'Malanville / Kandi → Parakou',                'Transport Atlantique Logistique',  450, 'planifiee', now() - interval '2 days'),
  ('OP-2026-016', 'Bohicon / Kandi → Cotonou / Parakou (frais)', 'Express Collines',                 200, 'en_cours',  now() - interval '2 days');

-- ---------------------------------------------------------------------------
-- Lots
-- ---------------------------------------------------------------------------
-- Coordonnées normalisées (0-100) de la carte des flux : petit y = nord, grand y = côte.

insert into public.lots (
  id, producer, product, category, quantity_kg,
  origin_name, origin_x, origin_y,
  destination_name, destination_x, destination_y,
  available_from, available_to, constraints, status, operation_id, created_at
) values
  ('AGF-2026-001', 'Coopérative Maraîchère de Sèmè', 'Tomate fraîche', 'legumes', 85,
   'Bohicon', 44, 74, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date - 1, current_date + 4, '{perissable}', 'regroupe', 'OP-2026-014', now() - interval '3 days'),

  ('AGF-2026-002', 'GIE Femmes de Dassa', 'Piment frais', 'legumes', 40,
   'Dassa-Zoumè', 50, 64, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date, current_date + 3, '{perissable}', 'regroupe', 'OP-2026-014', now() - interval '2 days'),

  ('AGF-2026-003', 'Coopérative Maraîchère de Sèmè', 'Igname Kokoro', 'tubercules', 120,
   'Glazoué', 48, 58, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date + 1, current_date + 10, '{sec}', 'enregistre', null, now() - interval '1 day'),

  ('AGF-2026-004', 'Union des Producteurs du Borgou', 'Maïs blanc', 'cereales', 160,
   'Parakou', 56, 42, 'Porto-Novo — Marché Ouando', 56, 92,
   current_date, current_date + 14, '{sec}', 'en_transport', 'OP-2026-011', now() - interval '6 days'),

  ('AGF-2026-005', 'Coopérative d''Anacarde de Djougou', 'Noix de cajou brute', 'oleagineux', 200,
   'Djougou', 34, 36, 'Porto-Novo — Marché Ouando', 56, 92,
   current_date - 2, current_date + 1, '{sec}', 'en_transport', 'OP-2026-011', now() - interval '5 days'),

  ('AGF-2026-006', 'Coopérative Maraîchère de Sèmè', 'Ananas Pain de Sucre', 'fruits', 75,
   'Bohicon', 44, 74, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date + 1, current_date + 5, '{perissable,fragile}', 'enregistre', null, now()),

  ('AGF-2026-007', 'GIE Soja du Zou', 'Soja grain', 'oleagineux', 150,
   'Glazoué', 48, 58, 'Porto-Novo — Marché Ouando', 56, 92,
   current_date + 2, current_date + 16, '{sec}', 'enregistre', null, now()),

  ('AGF-2026-008', 'Coopérative Maraîchère de Sèmè', 'Carotte', 'legumes', 45,
   'Bohicon', 44, 74, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date + 1, current_date + 6, '{perissable}', 'enregistre', null, now()),

  ('AGF-2026-009', 'Coopérative Vivrière d''Adjohoun', 'Manioc (gari)', 'tubercules', 110,
   'Glazoué', 48, 58, 'Porto-Novo — Marché Ouando', 56, 92,
   current_date, current_date + 20, '{sec}', 'enregistre', null, now() - interval '2 days'),

  ('AGF-2026-010', 'Groupement Rizicole de Malanville', 'Riz paddy', 'cereales', 180,
   'Malanville', 66, 8, 'Parakou — Marché central', 56, 42,
   current_date - 1, current_date + 12, '{sec}', 'regroupe', 'OP-2026-015', now() - interval '4 days'),

  ('AGF-2026-011', 'Union Cotonnière de Kandi', 'Coton graine', 'oleagineux', 200,
   'Kandi', 60, 18, 'Parakou — Marché central', 56, 42,
   current_date, current_date + 18, '{sec}', 'regroupe', 'OP-2026-015', now() - interval '3 days'),

  ('AGF-2026-012', 'GIE Femmes de Dassa', 'Gombo frais', 'legumes', 30,
   'Dassa-Zoumè', 50, 64, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date + 1, current_date + 4, '{perissable,fragile}', 'enregistre', null, now()),

  ('AGF-2026-013', 'Coopérative Ananas d''Allada', 'Ananas Cayenne lisse', 'fruits', 90,
   'Bohicon', 44, 74, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date + 2, current_date + 7, '{perissable,fragile}', 'enregistre', null, now() - interval '1 day'),

  ('AGF-2026-014', 'Ferme Avicole du Mono', 'Œufs de table', 'elevage', 60,
   'Bohicon', 44, 74, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date, current_date + 3, '{perissable,fragile,refrigere}', 'en_transport', 'OP-2026-016', now() - interval '3 days'),

  ('AGF-2026-015', 'Coopérative Laitière de Gogounou', 'Fromage peulh (wagashi)', 'elevage', 25,
   'Kandi', 60, 18, 'Parakou — Marché central', 56, 42,
   current_date - 1, current_date + 2, '{perissable,refrigere}', 'en_transport', 'OP-2026-016', now() - interval '3 days'),

  ('AGF-2026-016', 'Union des Producteurs du Borgou', 'Sorgho', 'cereales', 170,
   'Parakou', 56, 42, 'Porto-Novo — Marché Ouando', 56, 92,
   current_date + 3, current_date + 21, '{sec}', 'enregistre', null, now() - interval '1 day'),

  ('AGF-2026-017', 'Coopérative Vivrière d''Adjohoun', 'Patate douce', 'tubercules', 80,
   'Glazoué', 48, 58, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date + 1, current_date + 9, '{sec}', 'enregistre', null, now()),

  ('AGF-2026-018', 'GIE Karité de Natitingou', 'Amandes de karité', 'oleagineux', 140,
   'Natitingou', 30, 24, 'Parakou — Marché central', 56, 42,
   current_date - 3, current_date + 15, '{sec}', 'enregistre', null, now() - interval '2 days'),

  ('AGF-2026-019', 'Verger de Djougou', 'Orange', 'fruits', 95,
   'Djougou', 34, 36, 'Parakou — Marché central', 56, 42,
   current_date, current_date + 8, '{perissable}', 'livre', null, now() - interval '8 days'),

  ('AGF-2026-020', 'Coopérative Maraîchère de Sèmè', 'Aubergine africaine', 'legumes', 35,
   'Bohicon', 44, 74, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date + 1, current_date + 5, '{perissable}', 'enregistre', null, now()),

  ('AGF-2026-021', 'Groupement Rizicole de Malanville', 'Niébé (haricot)', 'cereales', 125,
   'Malanville', 66, 8, 'Porto-Novo — Marché Ouando', 56, 92,
   current_date + 2, current_date + 19, '{sec}', 'enregistre', null, now() - interval '1 day'),

  ('AGF-2026-022', 'Ferme Piscicole de la Vallée', 'Poisson fumé', 'elevage', 28,
   'Dassa-Zoumè', 50, 64, 'Cotonou — Marché Dantokpa', 46, 94,
   current_date, current_date + 6, '{fragile,sec}', 'enregistre', null, now());

-- ---------------------------------------------------------------------------
-- Lots rattachés à chaque tournée
-- ---------------------------------------------------------------------------

insert into public.operation_lots (operation_id, lot_id) values
  ('OP-2026-011', 'AGF-2026-004'),
  ('OP-2026-011', 'AGF-2026-005'),
  ('OP-2026-014', 'AGF-2026-001'),
  ('OP-2026-014', 'AGF-2026-002'),
  ('OP-2026-015', 'AGF-2026-010'),
  ('OP-2026-015', 'AGF-2026-011'),
  ('OP-2026-016', 'AGF-2026-014'),
  ('OP-2026-016', 'AGF-2026-015');

-- ---------------------------------------------------------------------------
-- Chronologie de chaque lot (alimente la vue `passports`)
-- ---------------------------------------------------------------------------

insert into public.lot_events (id, lot_id, type, at, note, vigilance) values
  ('EVT-001-1', 'AGF-2026-001', 'creation',     now() - interval '3 days', 'Lot enregistré par la coopérative', 'ok'),
  ('EVT-001-2', 'AGF-2026-001', 'regroupement', now() - interval '1 day',  'Associé à l''opération OP-2026-014', 'ok'),

  ('EVT-002-1', 'AGF-2026-002', 'creation',     now() - interval '2 days', 'Lot enregistré', 'ok'),
  ('EVT-002-2', 'AGF-2026-002', 'regroupement', now() - interval '1 day',  'Associé à l''opération OP-2026-014', 'ok'),

  ('EVT-003-1', 'AGF-2026-003', 'creation',     now() - interval '1 day',  'Lot enregistré, en attente de regroupement', 'ok'),

  ('EVT-004-1', 'AGF-2026-004', 'creation',     now() - interval '6 days', 'Lot enregistré', 'ok'),
  ('EVT-004-2', 'AGF-2026-004', 'regroupement', now() - interval '4 days', 'Associé à l''opération OP-2026-011', 'ok'),
  ('EVT-004-3', 'AGF-2026-004', 'depart',       now() - interval '2 days', 'Départ du magasin de groupage de Parakou', 'ok'),
  ('EVT-004-4', 'AGF-2026-004', 'retard',       now() - interval '1 day',  'Retard déclaré — pluies sur l''axe RNIE 2', 'vigilance'),

  ('EVT-005-1', 'AGF-2026-005', 'creation',     now() - interval '5 days', 'Lot enregistré', 'ok'),
  ('EVT-005-2', 'AGF-2026-005', 'regroupement', now() - interval '4 days', 'Associé à l''opération OP-2026-011', 'ok'),
  ('EVT-005-3', 'AGF-2026-005', 'depart',       now() - interval '2 days', 'Départ de Djougou', 'ok'),
  ('EVT-005-4', 'AGF-2026-005', 'incident',     now(),                     'Incident : bâche endommagée, exposition à l''humidité', 'alerte'),

  ('EVT-006-1', 'AGF-2026-006', 'creation',     now(),                     'Lot enregistré, recherche de regroupement', 'ok'),
  ('EVT-007-1', 'AGF-2026-007', 'creation',     now(),                     'Lot enregistré', 'ok'),
  ('EVT-008-1', 'AGF-2026-008', 'creation',     now(),                     'Lot enregistré', 'ok'),
  ('EVT-009-1', 'AGF-2026-009', 'creation',     now() - interval '2 days', 'Lot enregistré', 'ok'),

  ('EVT-010-1', 'AGF-2026-010', 'creation',     now() - interval '4 days', 'Lot enregistré', 'ok'),
  ('EVT-010-2', 'AGF-2026-010', 'regroupement', now() - interval '2 days', 'Associé à l''opération OP-2026-015', 'ok'),

  ('EVT-011-1', 'AGF-2026-011', 'creation',     now() - interval '3 days', 'Lot enregistré', 'ok'),
  ('EVT-011-2', 'AGF-2026-011', 'regroupement', now() - interval '2 days', 'Associé à l''opération OP-2026-015', 'ok'),

  ('EVT-012-1', 'AGF-2026-012', 'creation',     now(),                     'Lot enregistré', 'ok'),
  ('EVT-013-1', 'AGF-2026-013', 'creation',     now() - interval '1 day',  'Lot enregistré', 'ok'),

  ('EVT-014-1', 'AGF-2026-014', 'creation',     now() - interval '3 days', 'Lot enregistré', 'ok'),
  ('EVT-014-2', 'AGF-2026-014', 'regroupement', now() - interval '2 days', 'Associé à l''opération OP-2026-016', 'ok'),
  ('EVT-014-3', 'AGF-2026-014', 'depart',       now() - interval '1 day',  'Départ vers Cotonou', 'ok'),
  ('EVT-014-4', 'AGF-2026-014', 'controle',     now(),                     'Contrôle chaîne du froid conforme', 'ok'),

  ('EVT-015-1', 'AGF-2026-015', 'creation',     now() - interval '3 days', 'Lot enregistré', 'ok'),
  ('EVT-015-2', 'AGF-2026-015', 'regroupement', now() - interval '2 days', 'Associé à l''opération OP-2026-016', 'ok'),
  ('EVT-015-3', 'AGF-2026-015', 'depart',       now() - interval '1 day',  'Départ de Kandi', 'ok'),
  ('EVT-015-4', 'AGF-2026-015', 'retard',       now(),                     'Retard déclaré — attente au poste de contrôle', 'vigilance'),

  ('EVT-016-1', 'AGF-2026-016', 'creation',     now() - interval '1 day',  'Lot enregistré', 'ok'),
  ('EVT-017-1', 'AGF-2026-017', 'creation',     now(),                     'Lot enregistré', 'ok'),
  ('EVT-018-1', 'AGF-2026-018', 'creation',     now() - interval '2 days', 'Lot enregistré', 'ok'),

  ('EVT-019-1', 'AGF-2026-019', 'creation',     now() - interval '8 days', 'Lot enregistré', 'ok'),
  ('EVT-019-2', 'AGF-2026-019', 'depart',       now() - interval '5 days', 'Départ de Djougou', 'ok'),
  ('EVT-019-3', 'AGF-2026-019', 'livraison',    now() - interval '3 days', 'Livré au marché central de Parakou', 'ok'),

  ('EVT-020-1', 'AGF-2026-020', 'creation',     now(),                     'Lot enregistré', 'ok'),
  ('EVT-021-1', 'AGF-2026-021', 'creation',     now() - interval '1 day',  'Lot enregistré', 'ok'),
  ('EVT-022-1', 'AGF-2026-022', 'creation',     now(),                     'Lot enregistré', 'ok');

commit;
