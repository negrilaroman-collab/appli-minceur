// Calculs diététiques : métabolisme de base, dépense, objectif kcal, macros.
// Règles issues de la fiche : Mifflin-St Jeor, déficit 20 % plafonné à 750 kcal,
// planchers 1500 (homme) / 1200 (femme) et jamais sous le métabolisme de base.

export type Sexe = 'homme' | 'femme';
export type NiveauActivite = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'extreme';
export type Rythme = 'doux' | 'normal' | 'rapide';

export interface Profil {
  sexe: Sexe;
  age: number;
  tailleCm: number;
  poidsKg: number;
  poidsCibleKg: number;
  activite: NiveauActivite;
  rythme: Rythme;
  /** Correction en kcal décidée lors des bilans de la semaine (0 par défaut). */
  ajustementKcal?: number;
}

export const FACTEURS_ACTIVITE: Record<NiveauActivite, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  extreme: 1.9,
};

export const LIBELLES_ACTIVITE: Record<NiveauActivite, string> = {
  sedentaire: 'Sédentaire',
  leger: 'Léger (1-3 séances/sem.)',
  modere: 'Modéré (3-5 séances/sem.)',
  actif: 'Très actif (6-7 séances/sem.)',
  extreme: 'Extrême (travail physique + sport)',
};

// Part de déficit par rythme (doux ≈ 0,5 %/sem, normal ≈ 0,75 %, rapide ≈ 1 %).
const DEFICIT_PAR_RYTHME: Record<Rythme, number> = {
  doux: 0.15,
  normal: 0.2,
  rapide: 0.25,
};

export const DEFICIT_MAX_KCAL = 750;
export const KCAL_PAR_KG_GRAISSE = 7700;

export function metabolismeDeBase(p: Pick<Profil, 'sexe' | 'age' | 'tailleCm' | 'poidsKg'>): number {
  const base = 10 * p.poidsKg + 6.25 * p.tailleCm - 5 * p.age;
  return Math.round(base + (p.sexe === 'homme' ? 5 : -161));
}

export function depenseTotale(p: Profil): number {
  return Math.round(metabolismeDeBase(p) * FACTEURS_ACTIVITE[p.activite]);
}

export function plancherKcal(p: Profil): number {
  const minimumSexe = p.sexe === 'homme' ? 1500 : 1200;
  return Math.max(minimumSexe, metabolismeDeBase(p));
}

export function objectifKcal(p: Profil): number {
  const tdee = depenseTotale(p);
  // maintien (l'ajustement des bilans s'applique aussi, sinon accepter une proposition ne changerait rien)
  if (p.poidsCibleKg >= p.poidsKg) return p.ajustementKcal ? Math.round(Math.max(tdee + p.ajustementKcal, plancherKcal(p)) / 10) * 10 : tdee;
  const deficit = Math.min(tdee * DEFICIT_PAR_RYTHME[p.rythme], DEFICIT_MAX_KCAL);
  const cible = Math.max(tdee - deficit + (p.ajustementKcal ?? 0), plancherKcal(p));
  return Math.round(cible / 10) * 10;
}

export interface Macros {
  kcal: number;
  proteinesG: number;
  lipidesG: number;
  glucidesG: number;
}

export function imc(p: Pick<Profil, 'poidsKg' | 'tailleCm'>): number {
  const m = p.tailleCm / 100;
  return p.poidsKg / (m * m);
}

export function objectifMacros(p: Profil): Macros {
  const kcal = objectifKcal(p);
  // 1,8 g/kg du poids « de référence » : le poids actuel, plafonné au poids correspondant à un IMC de 25
  // (évite des quantités énormes en cas de surpoids, sans saut brutal ni dépendance à la cible).
  const poidsRef = Math.min(p.poidsKg, 25 * (p.tailleCm / 100) ** 2);
  const proteinesG = Math.round(1.8 * poidsRef);
  const lipidesG = Math.round(Math.max((kcal * 0.3) / 9, 0.6 * p.poidsKg));
  const glucidesG = Math.max(0, Math.round((kcal - proteinesG * 4 - lipidesG * 9) / 4));
  return { kcal, proteinesG, lipidesG, glucidesG };
}

/** Perte hebdomadaire attendue (kg) pour un objectif kcal donné. */
export function perteHebdoAttendue(p: Profil, kcalObjectif = objectifKcal(p)): number {
  return ((depenseTotale(p) - kcalObjectif) * 7) / KCAL_PAR_KG_GRAISSE;
}

/** Moyenne glissante sur 7 jours d'une série de pesées triées par date. */
export function moyenne7Jours(pesees: { date: string; poidsKg: number }[], finISO: string): number | null {
  const fin = new Date(finISO).getTime();
  const debut = fin - 6 * 24 * 3600 * 1000;
  const fenetre = pesees.filter((x) => {
    const t = new Date(x.date).getTime();
    return t >= debut && t <= fin;
  });
  if (fenetre.length === 0) return null;
  return fenetre.reduce((s, x) => s + x.poidsKg, 0) / fenetre.length;
}

/**
 * Ajustement hebdomadaire : si la perte réelle (moyenne 7 j) est < 50 % de l'attendu
 * deux semaines de suite → -125 kcal ; si > 1,2 % du poids/sem → +125 kcal.
 * Renvoie le nouvel objectif, borné par le plancher.
 */
export function ajusterObjectif(
  p: Profil,
  kcalActuel: number,
  pertesReellesKg: [number, number], // [semaine -1, semaine 0]
): number {
  const attendue = perteHebdoAttendue(p, kcalActuel);
  const tropLent = pertesReellesKg.every((x) => x < attendue * 0.5);
  const tropRapide = pertesReellesKg[1] > p.poidsKg * 0.012;
  let nouveau = kcalActuel;
  if (tropRapide) nouveau += 125;
  else if (tropLent) nouveau -= 125;
  return Math.max(nouveau, plancherKcal(p));
}
