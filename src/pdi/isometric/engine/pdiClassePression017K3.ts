// PATCH 017K3 : la classe de pression est une propriete de la SPEC.
//
// POURQUOI CE FICHIER EXISTE
// Le formulaire de creation de troncon proposait "Class 600" en dur, alors
// que la spec active du projet etait CS150, donc Class 150. Les deux ne
// peuvent pas etre vrais en meme temps, et c est la spec qui fait foi.
//
// CE QUE DISENT LES NORMES
//   ASME B16.5 : sept classes de pression normalisees. La classe requise se
//     determine en entrant dans la table pression-temperature du groupe de
//     materiau avec la pression et la temperature de calcul, en partant de
//     Class 150 et en allant vers la droite jusqu a une valeur admissible
//     superieure ou egale au besoin.
//   ASME B31.3 par. 302.2(a) : un composant conforme a une norme listee est
//     apte a la pression que cette norme lui attribue.
//   Specification de tuyauterie : la classe de ligne s applique a tous les
//     composants de la ligne. Elle n est pas un champ libre.
//
// Ce module ne calcule PAS la classe a partir d une pression de calcul :
// le projet ne saisit pas encore pression et temperature de calcul. Il fait
// la seule chose defendable en attendant : il lit la classe dans la spec
// declaree du projet, au lieu de l inventer.

import { PDI_DEFAULT_SPECS, pdiFindSpec } from "./pdiTagging";
import type { PdiProjectSetup } from "./pdiTagging";

/** Les sept classes de l ASME B16.5, dans l ordre croissant. */
export const PDI_CLASSES_B165_017K3: string[] = [
  "Class 150",
  "Class 300",
  "Class 400",
  "Class 600",
  "Class 900",
  "Class 1500",
  "Class 2500",
];

/**
 * Designations PN, conservees pour les specs non metalliques deja declarees
 * dans le projet (GRE, PE100). Ce ne sont pas des classes ASME B16.5.
 */
export const PDI_DESIGNATIONS_PN_017K3: string[] = ["PN16", "PN40"];

/** Classe de repli quand aucun projet n est encore charge. */
export const PDI_CLASSE_PAR_DEFAUT_017K3: string =
  PDI_DEFAULT_SPECS[0]?.pressureClass ?? "Class 150";

/** Materiau de repli, lu dans la meme spec que la classe. */
export const PDI_MATERIAU_PAR_DEFAUT_017K3: string =
  PDI_DEFAULT_SPECS[0]?.material ?? "Acier carbone";

/** Spec active du projet : celle qui est explicitement demandee, sinon la premiere declaree. */
function specActive017K3(setup?: PdiProjectSetup, code?: string) {
  if (!setup) return undefined;
  if (code) {
    const trouvee = pdiFindSpec(setup, code);
    if (trouvee) return trouvee;
  }
  return setup.specs && setup.specs.length > 0 ? setup.specs[0] : undefined;
}

/** Classe de pression imposee par la spec du projet. */
export function pdiClasseDeSpec017K3(
  setup?: PdiProjectSetup,
  code?: string,
): string {
  const spec = specActive017K3(setup, code);
  return spec?.pressureClass || PDI_CLASSE_PAR_DEFAUT_017K3;
}

/** Materiau impose par la spec du projet. */
export function pdiMateriauDeSpec017K3(
  setup?: PdiProjectSetup,
  code?: string,
): string {
  const spec = specActive017K3(setup, code);
  return spec?.material || PDI_MATERIAU_PAR_DEFAUT_017K3;
}

/** Vrai si la classe choisie est bien celle de la spec. */
export function pdiClasseConforme017K3(
  classe: string,
  setup?: PdiProjectSetup,
  code?: string,
): boolean {
  return classe === pdiClasseDeSpec017K3(setup, code);
}

/**
 * Message de derogation. On n interdit pas : un projet reel comporte des
 * ruptures de spec. On rend la derogation visible au lieu de la subir.
 */
export function pdiMessageDerogation017K3(
  classe: string,
  attendue: string,
): string {
  return (
    "Classe " +
    classe +
    " differente de la spec du projet (" +
    attendue +
    "). La specification de tuyauterie fixe la classe de la ligne : la classe " +
    "se determine a partir de la pression et de la temperature de calcul " +
    "(table pression-temperature ASME B16.5). Verifiez la rupture de spec."
  );
}
