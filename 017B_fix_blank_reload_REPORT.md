# PATCH 017B - Correction page blanche + modal Project Setup

Date : 2026-08-24T09:35:52

## Cause racine de la page blanche
- La coquille restaurait le module enregistre dans pdi.activeModule.v1 sans verifier
  qu un ecran existe pour ce module. Les valeurs sans rendu (ex: projects) affichaient
  une zone de travail totalement vide apres rechargement.
- Aucun filet de securite n entourait l editeur ISO : toute erreur d execution
  produisait un ecran noir sans message.

## Modifications
- Liste blanche des modules affichables ajoutee
- Restauration du module actif securisee
- Filet de securite (error boundary) ajoute
- Editeur ISO protege par le filet de securite
- Ecran de repli ajoute pour tout module sans rendu
- Modal Project Setup sorti de la barre superieure et repositionne
- Couleur par service ajoutee
- Rendu des tuyauteries branche sur la couleur par service
- Commande COLORBYSERVICE ajoutee

## Tests
1. Recharger la page en etant connecte : l editeur ISO doit revenir directement.
2. Menu profil > Mes projets, puis recharger : ecran de repli avec boutons, jamais du vide.
3. Ouvrir PROJECTSETUP : le modal doit etre centre plein ecran, pas coince dans la barre du haut.
4. Taper COLORBYSERVICE : les tuyauteries prennent la couleur de leur service.
5. Taper COLORBYSERVICE OFF : retour aux couleurs de style.
6. npm run lint puis npm run build.
