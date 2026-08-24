# PATCH 017H - CSS embarque dans le bundle JS

## Cause racine

Les requetes `/assets/*.css` reviennent en **403 Forbidden** (`net::ERR_ABORTED 403`) alors que les bundles `.js` du meme dossier sont servis. Le bundle CSS est donc bien genere : c'est son acces HTTP qui est refuse. La sonde 017D basculait alors en affichage de secours et 017G ne pouvait rien recuperer (les liens injectes reprenaient 403).

## Correctif

| # | Fichier | Effet |
|---|---|---|
| A | `src/pdiInlineStyles.ts` (nouveau) | Imports `?inline` + injection `<style>` |
| B | `src/main.tsx` | Import unique de `pdiInlineStyles` |
| C | `src/pdi/landing/PdiLandingV4.tsx` | CSS landing centralise |
| D | `src/components/ProjectMapViewer.tsx` | CSS leaflet embarque |
| E | `src/vite-env.d.ts` | Type `*.css?inline` |
| F | `vite.config.ts` | `cssCodeSplit: false` |
| G | `server.ts` | Route `GET /api/style/main.css` (text/css) |
| H | `src/main.tsx` | 017G tente `/api/style/main.css` en dernier recours |

## Identifiants

`pdiInstallInlineStyles()`, `pdiInjectInlineCss(id, css)`, `data-pdi-inline-css="017H"`, `pdi-inline-base-017h`, `pdi-inline-precision-017h`, `pdi-inline-landing-017h`, `pdi-inline-leaflet-017h`, `/api/style/main.css`, log `[PD&I 017H] Feuilles de styles embarquees : `

## Resultat

Appliques : 9 | Deja presents : 0 | Echecs : 0

[APPLIQ] A. src/pdiInlineStyles.ts (injection des CSS embarques)
[APPLIQ] B1. main.tsx : import de pdiInlineStyles
[APPLIQ] B2. main.tsx : retrait de l import direct de index.css
[APPLIQ] C. PdiLandingV4.tsx : CSS landing centralise
[APPLIQ] D. ProjectMapViewer.tsx : CSS leaflet embarque
[APPLIQ] E. vite-env.d.ts : declaration *.css?inline
[APPLIQ] F. vite.config.ts : cssCodeSplit desactive
[APPLIQ] G. server.ts : route de secours /api/style/main.css
[APPLIQ] H. main.tsx : recuperation via /api/style/main.css
