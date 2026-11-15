// Logique pure de l'estimation photo : totaux, fourchette, décision de poser des questions.
// Les kcal sont recalculées ici à partir des grammes et des valeurs pour 100 g,
// pour que les corrections de portion de l'utilisateur restent cohérentes.

export interface AlimentEstime {
  nom: string;
  grammes: number;
  grammesMin: number;
  grammesMax: number;
  cuisson: string;
  kcal100g: number;
  proteines100g: number;
  lipides100g: number;
  glucides100g: number;
  confiance: number; // 0 à 1
}

export interface QuestionPhoto {
  id: string;
  question: string;
  options: string[];
}

export interface AnalysePhoto {
  aliments: AlimentEstime[];
  questions: QuestionPhoto[];
  remarque: string;
}

export interface Totaux {
  kcal: number;
  kcalMin: number;
  kcalMax: number;
  proteinesG: number;
  lipidesG: number;
  glucidesG: number;
}

export const SEUIL_CONFIANCE = 0.7;
export const SEUIL_FOURCHETTE = 0.2; // ± 20 %
export const MAX_TOURS_QUESTIONS = 2;
export const MAX_QUESTIONS = 3;

const r = (x: number) => Math.round(x);

export function totaux(aliments: AlimentEstime[]): Totaux {
  return aliments.reduce<Totaux>(
    (t, a) => ({
      kcal: t.kcal + (a.grammes * a.kcal100g) / 100,
      kcalMin: t.kcalMin + (a.grammesMin * a.kcal100g) / 100,
      kcalMax: t.kcalMax + (a.grammesMax * a.kcal100g) / 100,
      proteinesG: t.proteinesG + (a.grammes * a.proteines100g) / 100,
      lipidesG: t.lipidesG + (a.grammes * a.lipides100g) / 100,
      glucidesG: t.glucidesG + (a.grammes * a.glucides100g) / 100,
    }),
    { kcal: 0, kcalMin: 0, kcalMax: 0, proteinesG: 0, lipidesG: 0, glucidesG: 0 },
  );
}

export function arrondirTotaux(t: Totaux): Totaux {
  return {
    kcal: r(t.kcal),
    kcalMin: r(t.kcalMin),
    kcalMax: r(t.kcalMax),
    proteinesG: r(t.proteinesG),
    lipidesG: r(t.lipidesG),
    glucidesG: r(t.glucidesG),
  };
}

/** Demi-largeur relative de la fourchette (0,2 = ± 20 %). */
export function incertitude(t: Totaux): number {
  if (t.kcal <= 0) return 1;
  return (t.kcalMax - t.kcalMin) / 2 / t.kcal;
}

/** Faut-il poser des questions ? Confiance faible ou fourchette trop large, et il reste des tours. */
export function doitPoserQuestions(a: AnalysePhoto, toursFaits: number): boolean {
  if (toursFaits >= MAX_TOURS_QUESTIONS || a.questions.length === 0 || a.aliments.length === 0) return false;
  const confianceMin = Math.min(...a.aliments.map((x) => x.confiance));
  return confianceMin < SEUIL_CONFIANCE || incertitude(totaux(a.aliments)) > SEUIL_FOURCHETTE;
}

/** Corrige les valeurs reçues (bornes, ordre min ≤ grammes ≤ max, questions limitées). */
export function nettoyerAnalyse(a: AnalysePhoto): AnalysePhoto {
  const pos = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);
  return {
    remarque: a.remarque ?? '',
    questions: (a.questions ?? []).filter((q) => q.options.length >= 2).slice(0, MAX_QUESTIONS),
    aliments: (a.aliments ?? [])
      .map((x) => {
        const grammes = pos(x.grammes);
        return {
          ...x,
          grammes,
          grammesMin: Math.min(pos(x.grammesMin) || grammes, grammes),
          grammesMax: Math.max(pos(x.grammesMax) || grammes, grammes),
          kcal100g: Math.min(pos(x.kcal100g), 900),
          proteines100g: Math.min(pos(x.proteines100g), 100),
          lipides100g: Math.min(pos(x.lipides100g), 100),
          glucides100g: Math.min(pos(x.glucides100g), 100),
          confiance: Math.min(Math.max(x.confiance, 0), 1),
        };
      })
      .filter((x) => x.grammes > 0),
  };
}

/** Change la portion d'un aliment (facteur 0,9 = -10 %) en gardant la fourchette proportionnelle. */
export function ajusterPortion(a: AlimentEstime, facteur: number): AlimentEstime {
  const grammes = Math.max(5, Math.round(a.grammes * facteur));
  const k = grammes / a.grammes;
  return { ...a, grammes, grammesMin: Math.round(a.grammesMin * k), grammesMax: Math.round(a.grammesMax * k) };
}
