# Tableau PATCH 014 — Commandes Plant 3D / AutoCAD vers PD&I

| Commande | Alias | Domaine | Statut | Entité 3D future | Catégorie BOM |
|---|---|---|---|---|---|
| PLANTPIPEADD | PPA | Piping 3D | future_3d | pipeRoute | pipe |
| PLANTCONNECT | - | Piping 3D | prepared | connector | - |
| PLANTSPECVIEWER | SV | Spec | prepared | spec | - |
| PLANTCONVERTLINE | PCL | Piping 3D | future_3d | pipeRoute | pipe |
| PLANTFITTINGMOVE | - | Fitting | implemented | connector | fitting |
| PLANTFLIPFITTING | - | Fitting | implemented | connector | fitting |
| PLANTEQUIPMENTCREATE | PEC | Equipment | future_3d | equipment | equipment |
| PLANTNOZZLEADD | - | Nozzle | future_3d | nozzle | fitting |
| PLANTSUPPORTADD | PSA | Support | future_3d | support | support |
| PLANTSTEELMEMBER | - | Structure | future_3d | steel | structure |
| PLANTORTHOCREATE | - | Ortho | future_3d | ortho | document |
| PLANTISOPRODUCTION | - | ISO fabrication | bom_export | iso | document |
| PROJECTMANAGER | PM | Projet | prepared | project | - |
| DATAMANAGER | DM | Données/BOM | bom_export | project | document |
| PLANTAUDIT | - | Audit | prepared | project | - |
| PLANTVALIDATE | - | Validation | prepared | project | - |
| MOVE | M | Édition | implemented | - | - |
| COPY | CO/CP | Édition | implemented | - | - |
| ROTATE | RO | Édition | implemented | - | - |
| ERASE | E | Édition | implemented | - | - |
| FILLET | F | Édition | prepared | connector | fitting |
| COPYBASE | CTRL+SHIFT+C | Clipboard | implemented | - | - |
| PASTECLIP | CTRL+V | Clipboard | implemented | - | - |
| ZOOM | Z | Navigation | implemented | view | - |
| PAN | P | Navigation | implemented | view | - |
| 3DORBIT | 3DO | Navigation 3D | future_3d | view | - |
| REGEN | RE | Navigation | implemented | view | - |
| BOM | METRE | Export | bom_export | project | document |

## Colonnes BOM préparées

`itemNo, category, lineNumber, service, spec, dn, nps, description, material, rating, schedule, quantity, unit, lengthM, weightKg, weldCount, tag, fromNode, toNode, sourceCommand, future3dEntity`
