/**
 * Attribution automatique de contenu de test.
 *
 * L'export ERP ne porte qu'une référence et une désignation. Pour que le menu
 * des categorie et les facettes aient de la matière en local, on déduit des
 * attributs plausibles de la désignation. C'est du **contenu de test** : il ne
 * quitte jamais `.local-data/`, et les références décrites dans le classeur
 * gardent toujours leurs vraies valeurs.
 *
 * Toute valeur produite est un slug existant de la feuille VALEURS : rien n'est
 * inventé hors du référentiel. Une désignation qu'aucune règle ne reconnaît ne
 * reçoit aucun attribut — comme en production tant que le classeur n'est pas
 * rempli.
 */

const sansAccent = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

/**
 * categorie, dans l'ordre : la première règle qui accroche gagne. Les familles
 * étroites passent avant les larges — « ARCHE DE BALLONS » avant « BALLON ».
 */
const categorie = [
  [/\bARCHE\b/, 'arche de ballons'],
  [/\bKIT\b.*\bBALLON/, 'kit de ballons'],
  [/\bBALLON\S*\b.*\bETOILE|\bETOILE\b.*\bBALLON|BALLON.*\b3D\b/, 'ballons etoile 3d'],
  [/\bBALLON\S*\b.*\b(METAL\S*|ALU\S*)\b|\b(METAL\S*|ALU\S*)\b.*\bBALLON/, 'ballons metalliques'],
  [/\bBALLON/, 'ballons couleur unie'],
  [/\bBANNIERE/, 'bannieres'],
  [/\bCANON\b/, 'canons a confettis'],
  [/\bGUIR\S*\b.*\bFANION/, 'guirlandes fanions'],
  [/\bGUIR\S*\b.*\b(LETTRE|JOYEUX|HAPPY|ANNIVERSAIRE)/, 'guirlandes lettres'],
  [/\bGUIRLANDE/, 'guirlandes fanions'],
  [/\bRIDEAU/, 'rideaux franges'],
  [/\bSUSPENSION|\bPERLES DE (PLUIE|DIAMANT)|\bROSACE|\bEVENTAIL/, 'suspensions'],
  [/\bURNE/, 'urnes'],

  [/\bBOUGIE\S*\b.*\bPIC|\bPIC\S*\b.*\bBOUGIE/, 'bougies pics'],
  [/\bBOUGIE\S*\b.*(\bCHIFFRE\b|\b\d+ ANS\b|\bBLISTER\b)/, 'bougies chiffres'],
  [/\bBOUGIE/, 'bougies anniversaire'],
  [/\bCHEMIN DE TABLE/, 'chemin de table'],
  [/\bPIC\S*\b.*\bCOCKTAIL|\bCOCKTAIL\b.*\bPIC/, 'pics cocktail'],
  [/\bCONFETTI/, 'confettis papier'],
  [/\bMARQUE.?PLACE/, 'marques places'],
  [/\bORNEMENT|\bCENTRE DE TABLE|\bRONDS? DE SERVIETTE|\bDECO\S* DE TABLE/, 'ornements de table'],
  [/\bSERV(IETTE)?\b|\bSERVIETTES?\b/, 'serviettes en papier'],

  [/\bCASQUE\b/, 'casques anti soif'],
  [/\bDIADEME/, 'diademes'],
  [/\bLUNETTE/, 'lunettes humo'],
  [/\bPINCE\S*\b.*\bCHEVEU/, 'pinces a cheveux'],
  [/\bSERRE.?TETE/, 'serre tetes'],
  [/\bCHAPEAU|\bCASQUETTE|\bBOB\b|\bSOMBRERO/, 'chapeaux'],
  [/\bCHOPE\b/, 'chopes a biere'],
  [/\bACCESSOIRE\S*\b.*\bTETE|\bOREILLE|\bCOURONNE|\bOKTOBERFEST/, 'accessoires de tete'],

  [/\bPLAQUE|\bPANNEAU/, 'plaques humo'],
  [/\bTEE ?SHIRT|\bT.SHIRT|\bMUG\b|\bBROCHE|\bECHARPE|\bCULOTTE|\bBOXER|\bTONGS|\bJEU\b|\bCRAVATE|\bCHAUSSETTE|\bBIBERON|\bLIVRE\b|\bTABLIER|\bSLIP\b|\bNOEUD\b|\bBADGE|\bTROPHEE|\bMEDAILLE|\bDIPLOME/, 'objets divers'],

  [/\bCARTE\b|\bINVITATION|\bMENU\b/, 'cartes d invitation'],
  [/\bSTICKER|\bETIQUETTE/, 'stickers'],
  [/\bSAC\S*\b.*\b(CADEAU|CABAS|KRAFT)\b|\bPOCHETTE/, 'sacs'],
  [/\bCOLLIER|\bBOA\b|\bPAILLE\b|\bMENOTTE|\bGONFLABLE|\bBRACELET|\bBANDEAU/, 'objets divers'],
];

/** Mots de la désignation → slug du référentiel, par attribut. */
const MOTS = {
  couleur: [
    [/\bROSE ?GOLD\b|\bRG\b/, 'rose gold'],
    [/\bROSE\b|\bROSES\b/, 'rose poudre'],
    [/\bARGE\S*\b|\bSILVER\b/, 'argent'],
    [/\bOR\b|\bDORE|\bGOLD\b/, 'or'],
    [/\bNOIR/, 'noir'],
    [/\bBLANC/, 'blanc'],
    [/\bROUGE/, 'rouge cerise'],
    [/\bBLEU/, 'bleu touareg'],
    [/\bVERT\b|\bVERTE\b|\bMENTHE\b/, 'vert menthe'],
    [/\bVIOLET|\bPARME\b|\bMAUVE\b/, 'violet astral'],
    [/\bMULTIC\S*\b|\bARC EN CIEL\b|\bRAINBOW\b/, 'multicolore'],
  ],
  matiere: [
    [/\bLATEX\b/, 'latex'],
    [/\bALU\S*\b|\bMETAL\S*\b/, 'aluminium'],
    [/\bPVC\b/, 'pvc metallise'],
    [/\bPOLYESTER|\bTISSU\b|\bSATIN\b/, 'polyester'],
    [/\bPLASTIQUE|\bPLAST\b/, 'plastique'],
    [/\bBOIS\b/, 'bois'],
    [/\bCARTON/, 'carton'],
    [/\bPAPIER/, 'papier'],
  ],
  finition: [
    [/\bHOLO\S*\b/, 'holographique'],
    [/\bPAILLET/, 'paillete'],
    [/\bNACRE/, 'nacre'],
    [/\bMETAL\S*\b|\bCHROME\b/, 'metallique'],
    [/\bBRILLANT/, 'brillant'],
    [/\bMAT\b/, 'mat'],
  ],
  occasion: [
    [/\bANNIVERSAIRE|\bANNIV\b|\bJA\b|\b\d+ ANS\b|\bHAPPY BIRTHDAY\b/, 'anniversaire'],
    [/\bMARIAGE|\bMARIE\S*\b|\bJUST MARRIED\b/, 'mariage'],
    [/\bBAPTEME|\bCOMMUNION/, 'bapteme'],
    [/\bEID\b|\bRAMADAN|\bAID\b/, 'eid'],
    [/\bNOUVEL AN\b|\bNEW YEAR\b|\bREVEILLON/, 'nouvel an'],
    [/\bEVJF\b|\bEVG\b|\bENTERREMENT/, 'evjf evg'],
    [/\bHALLOWEEN|\bSORCIERE|\bCITROUILLE/, 'halloween'],
    [/\bNOEL\b|\bCHRISTMAS\b|\bSAPIN\b/, 'noel'],
    [/\bRETRAITE/, 'retraite'],
  ],
  univers: [
    [/\bSEXY\b|\bRESILLE\b|\bEVJF\b|\bEVG\b|\bCOQUIN/, 'sexy'],
    [/\bAPERO\b|\bBIERE\b|\bCHOPE\b|\bCOCKTAIL\b|\bOKTOBERFEST\b/, 'apero'],
    [/\bPLAGE\b|\bTONGS\b|\bTROPICAL|\bSUMMER\b|\bFLAMANT/, 'plage'],
    [/\bENFANT|\bLICORNE|\bPIRATE|\bDINOSAURE|\bPRINCESSE|\bFOOT\b|\bBEBE\b/, 'enfant'],
  ],
  theme: [
    [/\bLICORNE/, 'licorne'],
    [/\bPRINCESSE/, 'princesse'],
    [/\bSIRENE/, 'sirene'],
    [/\bLEOPARD/, 'leopard'],
    [/\bLEMON\b|\bCITRON/, 'lemon'],
    [/\bART DECO\b/, 'art deco'],
    [/\bTROPICAL|\bFLAMANT|\bANANAS/, 'tropical'],
    [/\bFLORAL|\bFLEUR/, 'floral'],
    [/\bCOEUR/, 'coeurs'],
    [/\bDINOSAURE|\bDINO\b/, 'dinosaure'],
    [/\bJUNGLE|\bSAFARI/, 'jungle'],
    [/\bPIRATE/, 'pirates'],
    [/\bFOOT\b|\bBALLON DE FOOT\b/, 'foot'],
    [/\bPAILLETTE/, 'paillettes'],
    [/\bRETRO\b|\bVINTAGE\b/, 'retro pop'],
    [/\bBOHEME|\bBOHO\b/, 'boheme'],
    [/\bANIMAUX|\bANIMAL\b/, 'animaux'],
  ],
  fixation: [
    [/\bADHESI|\bAUTOCOLLANT|\bSTICKER/, 'adhesive'],
    [/\bSUSPEN|\bGUIRLANDE|\bBANNIERE|\bRIDEAU|\bBALLON/, 'suspendre'],
    [/\bCENTRE DE TABLE|\bCHEMIN DE TABLE|\bBOUGIE|\bASSIETTE|\bGOBELET/, 'poser'],
  ],
  ignifuge: [[/\bM1\b|\bIGNIFUGE/, 'oui']],
};

/** Tailles : uniquement celles que le référentiel connaît. */
function deriverTaille(texte, slugsConnus) {
  const cm = texte.match(/\b(\d{2,3})\s?CM\b/);
  if (cm && slugsConnus.has(`${cm[1]} cm`)) return `${cm[1]} cm`;
  const m = texte.match(/\b(\d)\s?M\b/);
  if (m && slugsConnus.has(`${m[1]} m`)) return `${m[1]} m`;
  const grand = texte.match(/\b(\d{2,3})\s?X\s?(\d{2,3})\b/);
  if (grand && slugsConnus.has(`${grand[1]}x${grand[2]} cm`)) return `${grand[1]}x${grand[2]} cm`;
  return '';
}

const premierMatch = (regles, texte) => regles.find(([re]) => re.test(texte))?.[1] ?? '';

/**
 * Chaque motif reconnu est retiré du texte avant d'évaluer les suivants :
 * sans cela « ROSE GOLD » donnerait trois couleurs (rose gold, rose poudre, or)
 * là où le produit n'en porte qu'une.
 */
const tousMatchs = (regles, texte, max) => {
  const out = [];
  let reste = texte;
  for (const [re, slug] of regles) {
    const m = reste.match(re);
    if (m && !out.includes(slug)) {
      out.push(slug);
      reste = reste.replace(m[0], ' ');
    }
    if (out.length >= max) break;
  }
  return out;
};

/** Matière évidente quand la désignation ne la dit pas : une serviette est en papier. */
const MATIERE_PAR_CATEGORIE = {
  'serviettes en papier': 'papier',
  'confettis papier': 'papier',
  'guirlandes fanions': 'papier',
  'cartes d invitation': 'papier',
  'stickers': 'papier',
  'bougies anniversaire': 'cire',
  'bougies chiffres': 'cire',
  'bougies pics': 'cire',
  'ballons couleur unie': 'latex',
  'arche de ballons': 'latex',
  'kit de ballons': 'latex',
  'ballons metalliques': 'aluminium',
  'ballons etoile 3d': 'aluminium',
  'rideaux franges': 'pvc metallise',
};

/**
 * Retourne un `ProductAttributes` déduit de la désignation, ou null si aucune
 * règle de catégorie n'accroche : mieux vaut un produit sans attributs qu'un produit
 * rangé à la mauvaise catégorie.
 */
export function deriverAttributs(produit, registre, parentDe, slugsParAttribut) {
  const texte = sansAccent(produit.pdt_designation || '');
  const sousCat = premierMatch(categorie, texte);
  if (!sousCat) return null;

  const attrs = { ref: produit.pdt_reference, statut: 'actif' };

  for (const def of registre) {
    const max = def.slots > 1 ? def.slots : 1;
    let vals = [];
    if (def.cle === 'categorie') vals = [parentDe(sousCat)];
    else if (def.cle === 'sous_categorie') vals = [sousCat];
    else if (def.cle === 'taille') vals = [deriverTaille(texte, slugsParAttribut.taille ?? new Set())];
    else if (def.cle === 'ignifuge') vals = [premierMatch(MOTS.ignifuge, texte) || 'non'];
    else if (def.cle === 'matiere') {
      vals = tousMatchs(MOTS.matiere, texte, max);
      if (vals.length === 0 && MATIERE_PAR_CATEGORIE[sousCat]) vals = [MATIERE_PAR_CATEGORIE[sousCat]];
    }
    else if (MOTS[def.cle]) vals = tousMatchs(MOTS[def.cle], texte, max);
    vals = vals.filter((v) => v && (slugsParAttribut[def.cle]?.has(v) ?? false));
    // Clé omise plutôt que vide : le fichier part en entier dans la page, et
    // `correspond` traite pareil une valeur absente et une valeur vide.
    if (vals.length) attrs[def.cle] = def.slots > 1 ? vals : vals[0];
  }
  return attrs;
}
