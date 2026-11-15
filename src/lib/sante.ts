// Lecture des pas et du poids depuis Health Connect (Android), qui regroupe le téléphone et les montres connectées.
import { Linking, Platform } from 'react-native';

import { decalerJour } from './suivi';

type HC = typeof import('react-native-health-connect');

// Chargé à la demande : le module natif n'existe pas sur le web.
function module(): HC | null {
  if (Platform.OS !== 'android') return null;
  try {
    return require('react-native-health-connect') as HC;
  } catch {
    return null;
  }
}

export const LIEN_HEALTH_CONNECT = 'market://details?id=com.google.android.apps.healthdata';

export type EtatSante = 'indisponible' | 'a-installer' | 'pret';

export async function etatSante(): Promise<EtatSante> {
  const hc = module();
  if (!hc) return 'indisponible';
  try {
    const s = await hc.getSdkStatus();
    if (s === hc.SdkAvailabilityStatus.SDK_AVAILABLE) return 'pret';
    if (s === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'a-installer';
    return 'indisponible';
  } catch {
    return 'indisponible';
  }
}

export function installerHealthConnect() {
  Linking.openURL(LIEN_HEALTH_CONNECT).catch(() =>
    Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'),
  );
}

export function ouvrirReglagesSante() {
  module()?.openHealthConnectSettings();
}

/** Demande l'accès aux pas et au poids. Renvoie true si les pas sont autorisés. */
export async function connecterSante(): Promise<boolean> {
  const hc = module();
  if (!hc) return false;
  await hc.initialize();
  const accordees = await hc.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'Weight' },
  ]);
  return accordees.some((p) => p.recordType === 'Steps');
}

const debutJour = (iso: string) => new Date(`${iso}T00:00:00`).toISOString();

/** Pas des `nbJours` derniers jours (jusqu'à aujourd'hui inclus), par date locale. */
export async function lirePas(aujourdhuiISO: string, nbJours = 7): Promise<Record<string, number>> {
  const hc = module();
  if (!hc) return {};
  await hc.initialize();
  const res: Record<string, number> = {};
  for (let i = nbJours - 1; i >= 0; i--) {
    const jour = decalerJour(aujourdhuiISO, -i);
    const fin = i === 0 ? new Date().toISOString() : debutJour(decalerJour(jour, 1));
    const r = await hc.aggregateRecord({ recordType: 'Steps', timeRangeFilter: { operator: 'between', startTime: debutJour(jour), endTime: fin } });
    res[jour] = r.COUNT_TOTAL ?? 0;
  }
  return res;
}

/** Dernière pesée de chaque jour enregistrée par une balance ou une autre appli (si l'accès au poids est donné). */
export async function lirePoids(aujourdhuiISO: string, nbJours = 14): Promise<{ date: string; poidsKg: number }[]> {
  const hc = module();
  if (!hc) return [];
  try {
    await hc.initialize();
    const { records } = await hc.readRecords('Weight', {
      timeRangeFilter: { operator: 'after', startTime: debutJour(decalerJour(aujourdhuiISO, -nbJours + 1)) },
    });
    const parJour: Record<string, { t: string; kg: number }> = {};
    for (const r of records) {
      const d = new Date(r.time);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!parJour[iso] || r.time > parJour[iso].t) parJour[iso] = { t: r.time, kg: Math.round(r.weight.inKilograms * 10) / 10 };
    }
    return Object.entries(parJour).map(([date, v]) => ({ date, poidsKg: v.kg }));
  } catch {
    return []; // accès au poids refusé : ce n'est pas grave
  }
}
