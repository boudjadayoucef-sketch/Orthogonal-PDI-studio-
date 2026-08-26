# -*- coding: utf-8 -*-
# PATCH 017I - PD&I
# 1. Molette : ecoute native non passive ({ passive: false }) -> preventDefault
#    reellement pris en compte, disparition de l avertissement console.
# 2. Badge de sauvegarde VISIBLE sur le plan de travail (l ancien badge etait
#    dans la barre d etat marquee "hidden", donc jamais affiche).
# 3. Commandes SAVE et RESTORE : declarees dans le registre ET dispatchees (R8).
# Idempotent (R1). Sauvegardes .before017I. Rapport genere.
import io, os, sys, shutil

ROOT = os.getcwd()
ENG = os.path.join(ROOT, "src/pdi/isometric/engine/IsometrieModuleV48d.tsx")
REG = os.path.join(ROOT, "src/pdi/isometric/engine/CadAutocadEngine.ts")
REPORT = os.path.join(ROOT, "017I_wheel_passif_badge_sauvegarde_REPORT.md")

for p in (ENG, REG):
    if not os.path.exists(p):
        print("ECHEC : fichier absent " + p)
        sys.exit(1)

log = []
checks = []


def backup(path):
    b = path + ".before017I"
    if not os.path.exists(b):
        shutil.copy2(path, b)
        log.append("BACKUP : " + os.path.basename(b))
    else:
        log.append("DEJA : backup " + os.path.basename(b))


def read(p):
    return io.open(p, "r", encoding="utf-8").read()


def write(p, s):
    io.open(p, "w", encoding="utf-8").write(s)


backup(ENG)
backup(REG)

# =======================================================================
# 1. REGISTRE : commandes SAVE et RESTORE
# =======================================================================
reg = read(REG)

ANCHOR_REG = (
    '    description: "Active ou desactive les raccourcis clavier a une touche",\n'
    '    category: "Affichage",\n'
    '    shortcut: "?",\n'
    '    icon: "LayoutGrid",\n'
    "  },\n"
    "];"
)

NEW_REG = (
    '    description: "Active ou desactive les raccourcis clavier a une touche",\n'
    '    category: "Affichage",\n'
    '    shortcut: "?",\n'
    '    icon: "LayoutGrid",\n'
    "  },\n"
    "  // PATCH 017I : sauvegarde et restauration explicites.\n"
    "  {\n"
    '    id: "save",\n'
    '    name: "SAUVER",\n'
    '    aliases: ["SAVE", "SAUVER", "SAUVEGARDER", "QSAVE", "SV"],\n'
    '    description: "Force une sauvegarde locale immediate du projet actif",\n'
    '    category: "Données",\n'
    '    shortcut: "Ctrl+S",\n'
    '    icon: "Save",\n'
    "  },\n"
    "  {\n"
    '    id: "restore",\n'
    '    name: "RESTAURER",\n'
    '    aliases: ["RESTORE", "RESTAURER", "RECUPERER", "RECOVER"],\n'
    '    description: "Ouvre la derniere sauvegarde locale pour restauration",\n'
    '    category: "Données",\n'
    '    shortcut: "RESTORE",\n'
    '    icon: "History",\n'
    "  },\n"
    "];"
)

if 'id: "save"' in reg and 'id: "restore"' in reg:
    log.append("DEJA : registre SAVE/RESTORE")
    checks.append(("registre SAVE declare", True))
    checks.append(("registre RESTORE declare", True))
elif ANCHOR_REG in reg:
    reg = reg.replace(ANCHOR_REG, NEW_REG, 1)
    write(REG, reg)
    log.append("APPLIQUE : registre SAVE/RESTORE (2 commandes)")
    checks.append(("registre SAVE declare", 'id: "save"' in reg))
    checks.append(("registre RESTORE declare", 'id: "restore"' in reg))
else:
    print("ECHEC : ancre registre introuvable")
    sys.exit(1)

# =======================================================================
# 2. MOTEUR
# =======================================================================
eng = read(ENG)

# --- 2a. Ecoute molette native non passive -----------------------------
ANCHOR_WHEEL = "  const wheel = (e: React.WheelEvent<SVGSVGElement>) => {"

EFFECT = (
    "  // PATCH 017I : la molette est ecoutee en natif avec { passive: false }.\n"
    "  // React enregistre \"wheel\" en passif : preventDefault y est ignore et\n"
    "  // declenche l avertissement console. L ecoute native corrige les deux.\n"
    "  useEffect(() => {\n"
    "    const el = svgRef.current;\n"
    "    if (!el) return;\n"
    "    const onWheelNative017I = (ev: WheelEvent) => {\n"
    "      ev.preventDefault();\n"
    "      wheel(ev as unknown as React.WheelEvent<SVGSVGElement>);\n"
    "    };\n"
    '    el.addEventListener("wheel", onWheelNative017I, { passive: false });\n'
    '    return () => el.removeEventListener("wheel", onWheelNative017I);\n'
    + "    // eslint-disable-next-line react-hooks/exhaustive-deps\n"
    "  }, []);\n\n"
)

if "onWheelNative017I" in eng:
    log.append("DEJA : ecoute molette native")
elif ANCHOR_WHEEL in eng:
    eng = eng.replace(ANCHOR_WHEEL, EFFECT + ANCHOR_WHEEL, 1)
    log.append("APPLIQUE : ecoute molette native { passive: false }")
else:
    print("ECHEC : ancre wheel introuvable")
    sys.exit(1)
checks.append(("ecoute native passive:false", "{ passive: false }" in eng))

# --- 2b. Retrait du onWheel React --------------------------------------
OLD_JSX = "              onWheel={wheel} onPointerDown={pointerDown}"
NEW_JSX = "              onPointerDown={pointerDown}"
if OLD_JSX in eng:
    eng = eng.replace(OLD_JSX, NEW_JSX, 1)
    log.append("APPLIQUE : retrait de onWheel={wheel} (double traitement evite)")
else:
    log.append("DEJA : onWheel React retire")
checks.append(("onWheel React retire", "onWheel={wheel}" not in eng))

# --- 2c. Badge de sauvegarde visible -----------------------------------
ANCHOR_SVG = '            <svg ref={svgRef} viewBox="0 0 620 400"'

BADGE = (
    "            <div\n"
    '              className={"pdi-save-badge-017i absolute top-2 right-2 z-[60] pointer-events-none select-none rounded-lg border px-2 py-1 text-[10px] font-black shadow-lg bg-slate-900/85 " + (saveState === "error" ? "border-red-600 text-red-300" : saveState === "modified" ? "border-amber-500 text-amber-300" : saveState === "autosaved" ? "border-emerald-600 text-emerald-300" : "border-slate-700 text-slate-400")}\n'
    '              title="Etat de la sauvegarde locale du projet actif"\n'
    "            >\n"
    "              {saveState === \"modified\"\n"
    '                ? "\u25cf Modifications non sauvegardees"\n'
    '                : saveState === "autosaved"\n'
    '                  ? "\u25cf Autosauvegarde" + (lastSavedAt ? " a " + lastSavedAt : "")\n'
    '                  : saveState === "error"\n'
    '                    ? "\u25cf Erreur de sauvegarde"\n'
    '                    : "\u25cb Pret"}\n'
    "            </div>\n"
)

if "pdi-save-badge-017i" in eng:
    log.append("DEJA : badge de sauvegarde")
elif ANCHOR_SVG in eng:
    eng = eng.replace(ANCHOR_SVG, BADGE + ANCHOR_SVG, 1)
    log.append("APPLIQUE : badge de sauvegarde visible sur le plan")
else:
    print("ECHEC : ancre svg introuvable")
    sys.exit(1)
checks.append(("badge visible", "pdi-save-badge-017i" in eng))

# --- 2d. Dispatch SAVE / RESTORE ---------------------------------------
ANCHOR_DISP = (
    "    } else {\n"
    "      const plant3dCommand = PDI_PLANT3D_COMMAND_TABLE?.find((item) =>"
)

DISPATCH = (
    "    } else if (cmdId === \"save\") {\n"
    "      // PATCH 017I : sauvegarde locale immediate, sans attendre l autosauvegarde.\n"
    "      try {\n"
    "        const snapshot017I = buildProjectFileV474();\n"
    "        if (AUTOSAVE_CURRENT_KEY) {\n"
    "          const previous017I = localStorage.getItem(AUTOSAVE_CURRENT_KEY);\n"
    "          if (previous017I && AUTOSAVE_PREVIOUS_KEY) localStorage.setItem(AUTOSAVE_PREVIOUS_KEY, previous017I);\n"
    "          localStorage.setItem(AUTOSAVE_CURRENT_KEY, JSON.stringify(snapshot017I));\n"
    "        }\n"
    "        autosaveBaselineRef.current = persistenceFingerprint(snapshot017I);\n"
    "        const hh017I = new Date().toLocaleTimeString([], { hour: \"2-digit\", minute: \"2-digit\" });\n"
    "        setLastSavedAt(hh017I);\n"
    "        setSaveState(\"autosaved\");\n"
    "        setAutocadPrompt(\"COMMANDE [SAUVER] : projet enregistre localement a \" + hh017I + \".\");\n"
    "        setStatusMessage(\"Sauvegarde locale effectuee a \" + hh017I);\n"
    "      } catch (err017I) {\n"
    "        setSaveState(\"error\");\n"
    "        setAutocadPrompt(\"COMMANDE [SAUVER] : echec de la sauvegarde locale. Espace de stockage sature ?\");\n"
    "      }\n"
    "    } else if (cmdId === \"restore\") {\n"
    "      // PATCH 017I : reutilise la modale de recuperation existante.\n"
    "      try {\n"
    "        const raw017I = AUTOSAVE_CURRENT_KEY ? localStorage.getItem(AUTOSAVE_CURRENT_KEY) : null;\n"
    "        const fallback017I = AUTOSAVE_PREVIOUS_KEY ? localStorage.getItem(AUTOSAVE_PREVIOUS_KEY) : null;\n"
    "        const chosen017I = raw017I || fallback017I;\n"
    "        if (!chosen017I) {\n"
    "          setAutocadPrompt(\"COMMANDE [RESTAURER] : aucune sauvegarde locale disponible pour ce projet.\");\n"
    "        } else {\n"
    "          setRecoveryCandidate(JSON.parse(chosen017I));\n"
    "          setRecoverySource(raw017I ? \"current\" : \"previous\");\n"
    "          setAutocadPrompt(\"COMMANDE [RESTAURER] : sauvegarde trouvee, confirmez la restauration.\");\n"
    "        }\n"
    "      } catch (err017I) {\n"
    "        setAutocadPrompt(\"COMMANDE [RESTAURER] : sauvegarde locale illisible.\");\n"
    "      }\n"
    + ANCHOR_DISP
)

if 'cmdId === "save"' in eng and 'cmdId === "restore"' in eng:
    log.append("DEJA : dispatch SAVE/RESTORE")
elif ANCHOR_DISP in eng:
    eng = eng.replace(ANCHOR_DISP, DISPATCH, 1)
    log.append("APPLIQUE : dispatch SAVE/RESTORE (R8 respectee)")
else:
    print("ECHEC : ancre dispatcher introuvable")
    sys.exit(1)
checks.append(("dispatch SAVE", 'cmdId === "save"' in eng))
checks.append(("dispatch RESTORE", 'cmdId === "restore"' in eng))

write(ENG, eng)

# =======================================================================
# RAPPORT
# =======================================================================
R = []
R.append("# PATCH 017I - molette non passive, badge de sauvegarde, SAVE/RESTORE")
R.append("")
R.append("## Operations")
for line in log:
    R.append("- " + line)
R.append("")
R.append("## Verifications")
for name, okv in checks:
    R.append("- [%s] %s" % ("x" if okv else " ", name))
R.append("")
R.append("## Contenu")
R.append("1. **Molette** : ecoute native `wheel` avec `{ passive: false }` sur `svgRef`,")
R.append("   et retrait de `onWheel={wheel}`. React enregistre `wheel` en passif, donc")
R.append("   `preventDefault()` y etait ignore : la page pouvait defiler pendant le zoom")
R.append("   et la console affichait `Unable to preventDefault inside passive event")
R.append("   listener invocation`. Les deux disparaissent.")
R.append("2. **Badge de sauvegarde** : l ancien badge vivait dans la barre d etat portant")
R.append("   la classe `hidden`, il n a donc jamais ete visible. Nouveau badge ancre en")
R.append("   haut a droite du plan, 4 etats : Pret / Modifications non sauvegardees /")
R.append("   Autosauvegarde a hh:mm / Erreur de sauvegarde.")
R.append("3. **SAVE et RESTORE** : declarees dans `AUTOCAD_COMMANDS` **et** dispatchees")
R.append("   (R8). SAUVER decale l archive courante vers `.previous` avant d ecrire,")
R.append("   met a jour l empreinte de reference et l horodatage. RESTAURER reutilise la")
R.append("   modale de recuperation existante, avec repli sur `.previous`.")
R.append("")
R.append("## Hors perimetre, reporte en 017I2")
R.append("Les tableaux typees `Float32Array` ne sont **pas** inclus. Les introduire sans")
R.append("consommateur reel serait du code mort, et les brancher sur la projection exige")
R.append("de toucher la boucle de rendu : c est un patch de performance a part entiere,")
R.append("a mesurer avant et apres. Il sera traite en **017I2**, apres 017M.")
R.append("")
R.append("## Tests")
R.append("1. Molette sur le plan : le zoom fonctionne et **la page ne defile plus**.")
R.append("   Console : plus aucun message `Unable to preventDefault`.")
R.append("2. Ctrl + molette (pincement pave tactile) : zoom fin toujours operationnel.")
R.append("   Maj + molette : panoramique horizontal.")
R.append("3. Badge visible en haut a droite du plan. Deplacez un noeud : il passe en")
R.append("   ambre `Modifications non sauvegardees`, puis en vert `Autosauvegarde a hh:mm`.")
R.append("4. Tapez `SAUVER` (ou `SAVE`, `SV`) : badge vert immediat a l heure courante,")
R.append("   message `Sauvegarde locale effectuee a hh:mm`.")
R.append("5. Tapez `RESTAURER` (ou `RESTORE`) : la modale de recuperation s ouvre avec le")
R.append("   nom du projet et le nombre de noeuds et de troncons.")
R.append("6. `Ctrl+K` puis `SAU` : les deux commandes apparaissent dans la palette.")
write(REPORT, "\n".join(R) + "\n")

print("=== PATCH 017I ===")
for line in log:
    print("  " + line)
nb = sum(1 for _, v in checks if v)
print("VERIFICATIONS : %d/%d" % (nb, len(checks)))
for name, okv in checks:
    print("  [%s] %s" % ("x" if okv else " ", name))
print("RAPPORT : " + REPORT)
if nb != len(checks):
    sys.exit(1)
