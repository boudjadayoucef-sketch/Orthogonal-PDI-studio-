# PATCH 017K - confirmation PD&I, navigation, landing

## Operations
- BACKUP : PdiUnifiedApp.tsx.before017K
- BACKUP : PdiLandingV4.tsx.before017K
- APPLIQUE : src/pdi/ui/PdiConfirm.tsx
- APPLIQUE : import pdiConfirm
- APPLIQUE : suppression de projet en fenetre PD&I
- APPLIQUE : pile de navigation
- APPLIQUE : fonction de retour
- APPLIQUE : fil d Ariane
- APPLIQUE : onglets projet masques hors contexte projet
- APPLIQUE : entrees Vision retirees (2)
- APPLIQUE : landing, 6 libelles mis a jour
- APPLIQUE : bande nomenclature & metre

## Verifications : 10/10
- [x] composant de confirmation present
- [x] import pdiConfirm
- [x] plus de window.confirm sur la suppression
- [x] fonction de retour presente
- [x] fil d Ariane present
- [x] onglets conditionnels
- [x] plus de carte Vision
- [x] Sketch to ISO en landing
- [x] impression mise en avant
- [x] bande nomenclature

## Tests
1. Mes projets PD&I, bouton Supprimer : fenetre PD&I sombre, sans URL du serveur.
2. Echap annule, Entree confirme, clic sur le fond annule.
3. Ouvrir un module : fil d Ariane visible, Accueil : fil d Ariane absent.
4. Bouton Retour : revient au module precedent reel, puis a l accueil.
5. Ecran Mes projets et Profil : barre d onglets masquee.
6. Editeur ISO : barre d onglets presente.
7. Landing : plus de Vision ni de V4.8d, Sketch to ISO et Impression & export presents.

## Hors perimetre assume
- 8 window.confirm restants et 41 alert() : patch 017K2.
- Ecran Profil & societe : patch 017K2.
