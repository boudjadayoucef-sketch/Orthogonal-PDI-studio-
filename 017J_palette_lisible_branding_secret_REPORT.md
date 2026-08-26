# PATCH 017J - palette Ctrl+K lisible, debranding categorie A, secret supprime

## Operations
- BACKUP : IsometrieModuleV48d.tsx.before017J
- BACKUP : GuideLegacyApp.tsx.before017J
- APPLIQUE : palette Ctrl+K et modale Raccourcis, 22 classes claires remplacees
- APPLIQUE : module src/pdi/branding/pdiBranding.ts
- APPLIQUE : import du module de branding
- APPLIQUE : cartouche, entete et pied de planche debrandes (3/3)
- APPLIQUE : lecture de profil migree avec repli (moteur)
- APPLIQUE : mot de passe en dur supprime (R18)
- APPLIQUE : message d aide sans identifiants
- APPLIQUE : domaine de messagerie parametrable
- APPLIQUE : cle de profil migree vers pdi.userProfile.v1

## Verifications
- [x] palette en theme sombre
- [x] plus de pastille claire dans la palette
- [x] module de branding present
- [x] import branding
- [x] cartouche debrandee
- [x] entete de planche debrandee
- [x] pied de planche normatif
- [x] profil migre (moteur)
- [x] secret supprime
- [x] profil migre (plateforme)
- [x] domaine parametrable

## A. Palette Ctrl+K
La palette etait un panneau **blanc** herite de la V4.6, avec des pastilles
`bg-slate-50`, `bg-cyan-50`, `bg-amber-50`, `bg-emerald-50` et `bg-red-50` :
du texte sombre sur fond quasi blanc, dans une application desormais sombre.
Ces pastilles n etaient pas desactivees, seulement **illisibles**. Tout est
passe en theme sombre avec bordures explicites, y compris la modale Raccourcis
et ses touches clavier.

## B, C. Identite parametrable
`src/pdi/branding/pdiBranding.ts` centralise l identite sous `pdi.branding.v1` :
nom de societe, logo, maitre d ouvrage, libelle d approbation, prefixe de
document, note normative. Repli **ISO 7200** : un cartouche ne peut pas etre
vide, il affiche `Societe non renseignee` tant que rien n est saisi.
Les trois mentions en dur de l impression ISO passent par ce module.

## D. Secret retire
`password === "Sonelgaz2026!"` etait un mot de passe super-administrateur en
clair dans le source livre au navigateur : n importe qui pouvait le lire dans
le bundle. Il est remplace par `VITE_PDI_ADMIN_PASSWORD`, exigee a 12
caracteres minimum, **absente par defaut** : sans variable, aucun compte de
secours n existe. Le message d aide qui affichait l adresse et le mot de passe
est neutralise, et le domaine `@sonelgaz.dz` devient `VITE_PDI_EMAIL_DOMAIN`.

## E. Migration de profil
`sonelgaz_user_profile` devient `pdi.userProfile.v1`. La lecture tente la
nouvelle cle puis **retombe sur l ancienne** : aucune session existante n est
perdue. L ecriture n utilise plus que la nouvelle cle, la suppression nettoie
les deux.

## Hors perimetre, assume
L ecran de saisie *Identite et cartouche* n est pas inclus : construire un
formulaire maintenant, puis le redeplacer dans le ruban en 017M, serait faire
le travail deux fois. Les valeurs sont deja lues et respectees ; seule la
saisie graphique arrive avec le ruban. Categorie B (134 occurrences metier)
reste traitee en 017K selon R22 : debrander sans desactiver.

## Tests
1. `Ctrl+K` : toutes les pastilles sont lisibles, fond sombre et texte clair.
   Verifier notamment `M - Cotation 2 ancrages`, `AT - Equipement sur tube`,
   `// - Rendre parallele`, `ISO - Redresser ISO` et `Suppr. derniere cote`.
2. `?` ou le bouton Raccourcis : la modale est sombre, les touches lisibles.
3. Chaque bouton de la palette declenche toujours son action.
4. `P` ou Impression : le cartouche affiche `Societe non renseignee` au lieu
   d une marque, et le pied de page la note normative ASME / EN / ISO.
5. Console : `localStorage.setItem("pdi.branding.v1", JSON.stringify({companyName:
   "Ma Societe"}))` puis reimprimer : le cartouche affiche Ma Societe.
6. Deconnexion / reconnexion : la session est conservee, la cle
   `pdi.userProfile.v1` apparait dans le stockage local.
7. Recherche `Sonelgaz2026` dans les sources : plus aucun resultat.
