// Calculs du suivi : courbe de poids lissée, vitesse de perte, kcal des jours passés.
import { moyenne7Jours } from './nutrition.ts';

const JOUR_MS = 24 * 3600 * 1000;

export function decalerJour(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const jj = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${jj}`;
}

export function ecartJours(debutISO: string, finISO: string): number {
  return Math.round((new Date(`${finISO}T12:00:00`).getTime() - new Date(`${debutISO}T12:00:00`).getTime()) / JOUR_MS);
}

export interface PointPoids {
  date: string;
  poidsKg: number;
  tendanceKg: number; // moyenne des 7 derniers jours à cette date
}

/** Pesées depuis `depuisISO` (incluse), avec la tendance lissée sur 7 jours. */
export function courbePoids(pesees: { date: string; poidsKg: number }[], depuisISO?: string): PointPoids[] {
  return pesees
    .filter((p) => !depuisISO || p.date >= depuisISO)
    .map((p) => ({ date: p.date, poidsKg: p.poidsKg, tendanceKg: moyenne7Jours(pesees, p.date) ?? p.poidsKg }));
}

/**
 * Vitesse de variation en kg/semaine (droite des moindres carrés sur les 28 derniers jours).
 * null s'il n'y a pas au moins 2 pesées espacées d'une semaine.
 */
export function vitesseHebdo(pesees: { date: string; poidsKg: number }[], finISO: string): number | null {
  const debut = decalerJour(finISO, -27);
  const pts = pesees.filter((p) => p.date >= debut && p.date <= finISO).map((p) => ({ x: ecartJours(debut, p.date), y: p.poidsKg }));
  if (pts.length < 2 || pts[pts.length - 1].x - pts[0].x < 7) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  return den === 0 ? null : (num / den) * 7;
}

/** Nombre de semaines pour atteindre la cible au rythme actuel (null si on ne descend pas). */
export function semainesJusquaCible(poidsActuel: number, cible: number, vitesse: number | null): number | null {
  if (poidsActuel <= cible) return 0;
  if (vitesse === null || vitesse >= -0.05) return null;
  return Math.ceil((poidsActuel - cible) / -vitesse);
}

/** kcal mangées par jour sur `nbJours` jours finissant à `finISO` (du plus ancien au plus récent). */
export function kcalParJour(repas: { date: string; kcal: number }[], finISO: string, nbJours: number): { date: string; kcal: number }[] {
  const jours = Array.from({ length: nbJours }, (_, i) => decalerJour(finISO, i - nbJours + 1));
  return jours.map((date) => ({ date, kcal: Math.round(repas.filter((r) => r.date === date).reduce((s, r) => s + r.kcal, 0)) }));
}

/** Une boisson seule (café sucré, soda…) ne suffit pas pour dire que la journée a été notée. */
const estRepasNote = (r: { moment?: string }) => r.moment !== 'boisson';

/** Nombre de jours d'affilée avec au moins un repas noté (jusqu'à aujourd'hui, ou hier si rien encore aujourd'hui). */
export function serieJours(repas: { date: string; moment?: string }[], aujourdhuiISO: string): number {
  const jours = new Set(repas.filter(estRepasNote).map((r) => r.date));
  let d = jours.has(aujourdhuiISO) ? aujourdhuiISO : decalerJour(aujourdhuiISO, -1);
  let n = 0;
  while (jours.has(d)) {
    n++;
    d = decalerJour(d, -1);
  }
  return n;
}

/** Perte de poids (kg, positif = perte) des deux dernières semaines, d'après la tendance sur 7 jours. */
export function pertesHebdo(pesees: { date: string; poidsKg: number }[], finISO: string): [number, number] | null {
  const t = [0, 7, 14].map((k) => {
    const fin = decalerJour(finISO, -k);
    const fenetre = pesees.filter((p) => p.date > decalerJour(fin, -7) && p.date <= fin);
    return fenetre.length ? fenetre.reduce((s, p) => s + p.poidsKg, 0) / fenetre.length : null;
  });
  if (t[0] === null || t[1] === null) return null;
  const s0 = t[1] - t[0];
  const s1 = t[2] === null ? s0 : t[2] - t[1];
  return [Math.round(s1 * 100) / 100, Math.round(s0 * 100) / 100];
}

export interface Bilan {
  date: string;
  perteKg: number | null;
  moyenneKcal: number | null; // moyenne des jours où des repas ont été notés
  joursNotes: number;
  kcalActuel: number;
  kcalPropose: number;
  message: string;
}

/**
 * Bilan de la semaine. `ajuster` est la règle d'ajustement (ajusterObjectif) : on ne baisse pas l'objectif
 * si la personne n'a pas noté assez de repas ou a mangé nettement au-dessus de son objectif.
 */
export function bilanSemaine(
  pesees: { date: string; poidsKg: number }[],
  repas: { date: string; kcal: number; moment?: string }[],
  finISO: string,
  kcalActuel: number,
  ajuster: (pertes: [number, number]) => number,
): Bilan {
  const notes = new Set(repas.filter(estRepasNote).map((r) => r.date));
  const jours = kcalParJour(repas, finISO, 7).filter((j) => j.kcal > 0 && notes.has(j.date));
  const moyenneKcal = jours.length ? Math.round(jours.reduce((s, j) => s + j.kcal, 0) / jours.length) : null;
  const pertes = pertesHebdo(pesees, finISO);
  const base = { date: finISO, perteKg: pertes ? pertes[1] : null, moyenneKcal, joursNotes: jours.length, kcalActuel };
  const kg = (x: number) => `${Math.abs(x).toFixed(1).replace('.', ',')} kg`;

  if (!pertes) {
    return { ...base, kcalPropose: kcalActuel, message: 'Pas assez de pesées pour juger : pèse-toi au moins 2 fois par semaine, le matin à jeun.' };
  }
  const propose = ajuster(pertes);
  const resultat = pertes[1] > 0.05 ? `Tu as perdu ${kg(pertes[1])} cette semaine.` : pertes[1] < -0.05 ? `Tu as pris ${kg(pertes[1])} cette semaine.` : 'Ton poids est stable cette semaine.';

  // Avec une seule semaine de pesées, la perte inclut souvent de l'eau : on attend un 2e bilan avant d'ajuster.
  const deuxSemaines = pesees.some((p) => p.date <= decalerJour(finISO, -14) && p.date > decalerJour(finISO, -21));
  if (!deuxSemaines) {
    return { ...base, kcalPropose: kcalActuel, message: `${resultat} Les premiers jours, une partie de la perte est de l'eau : on garde ton objectif et on ajustera si besoin la semaine prochaine.` };
  }

  if (propose < kcalActuel) {
    if (jours.length < 4) {
      return { ...base, kcalPropose: kcalActuel, message: `${resultat} Note tes repas au moins 4 jours sur 7 pour que je puisse ajuster ton objectif.` };
    }
    if (moyenneKcal !== null && moyenneKcal > kcalActuel + 150) {
      return {
        ...base,
        kcalPropose: kcalActuel,
        message: `${resultat} Tu as mangé en moyenne ${moyenneKcal} kcal, au-dessus de ton objectif : essaie d'abord de le respecter avant de le baisser.`,
      };
    }
    return { ...base, kcalPropose: propose, message:
        pertes[1] < -0.05
          ? `${resultat} Ton poids monte : je te propose de baisser un peu ton objectif.`
          : `${resultat} C'est plus lent que prévu depuis 2 semaines : je te propose de baisser un peu ton objectif.`,
    };
  }
  if (propose > kcalActuel) {
    return { ...base, kcalPropose: propose, message: `${resultat} C'est un peu trop rapide (risque de perdre du muscle) : je te propose de manger un peu plus.` };
  }
  return { ...base, kcalPropose: kcalActuel, message: `${resultat} C'est le bon rythme, on garde le même objectif. Bravo !` };
}
