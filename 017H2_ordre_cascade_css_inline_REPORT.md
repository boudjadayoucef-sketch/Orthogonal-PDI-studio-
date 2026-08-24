# PATCH 017H2 - ordre de la cascade CSS inline

## Cause racine

017H a supprime les 403 sur `/assets/*.css` mais a inverse l ordre de la cascade : Tailwind (`index.css`) etait injecte en premier au lieu du dernier. Les feuilles maison ecrasaient donc les utilitaires (`z-index`, `position`, hauteurs, `overflow`), d ou la barre de commandes et le dock ONGLETS passant devant les modales et la page qui defile.

## Ordre retabli

1. `pdiIsoPrecisionUx.css`
2. `leaflet.css`
3. `pdiLandingV4.css`
4. `index.css` (Tailwind) **en dernier**

## Fichiers

| # | Fichier | Effet |
|---|---|---|
| A | `src/pdiInlineStyles.ts` | leaflet inline + ordre de cascade corrige |
| B | `src/components/ProjectMapViewer.tsx` | injection locale retiree |

## Resultat

Appliques : 3 | Deja presents : 0 | Echecs : 0

[APPLIQ] A1. pdiInlineStyles.ts : import leaflet inline
[APPLIQ] A2. pdiInlineStyles.ts : Tailwind injecte en dernier
[APPLIQ] B. ProjectMapViewer.tsx : injection leaflet centralisee
