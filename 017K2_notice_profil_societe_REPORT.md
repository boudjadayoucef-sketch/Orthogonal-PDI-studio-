# PATCH 017K2 - fenetres d information PD&I et ecran Profil & societe

## Operations
- APPLIQUE : src/pdi/ui/PdiNotice.tsx
- APPLIQUE : 42 alert() converties en fenetres PD&I -> GuideLegacyApp.tsx (2), IsometrieModuleV48d.tsx (5), PdiUnifiedApp.tsx (1), ProjectManagement.tsx (33), Forms.tsx (1)
- APPLIQUE : src/pdi/ui/PdiCompanyPanel.tsx
- APPLIQUE : import PdiCompanyPanel
- APPLIQUE : panneau societe branche sur l ecran Profil

## Verifications : 5/5
- [x] composant d information present
- [x] plus aucune alert() du navigateur
- [x] panneau societe present
- [x] panneau societe branche
- [x] import du panneau

## Tests
1. Declencher une action en erreur : fenetre PD&I sombre, sans URL de serveur.
2. Echap ou Entree ferme la fenetre d information.
3. Menu compte, Voir profil : section Profil & societe visible.
4. Saisir une societe, Enregistrer, puis ouvrir Planche ISO : le cartouche affiche cette societe.
5. Recharger la page : la valeur saisie est conservee.

## Hors perimetre assume
- 8 window.confirm restants : patch 017K3, chaque appelant doit passer en async.
- Refonte visuelle bento de la landing : patch 017K3.
- Precision geometrique (snap, rotation, alignement, parallele) : patch 017P.
