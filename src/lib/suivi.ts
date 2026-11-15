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
