// Vérifie si une nouvelle version de l'APK est publiée sur GitHub (release "apk").
const BASE = 'https://github.com/negrilaroman-collab/appli-minceur/releases/download/apk';
export const LIEN_APK = `${BASE}/appli-minceur.apk`;
export const LIEN_VERSION = `${BASE}/version.json`;

export interface VersionPubliee {
  versionCode: number;
  date?: string;
}

/** Lit le contenu de version.json ; null si invalide. */
export function lireVersion(json: unknown): VersionPubliee | null {
  if (!json || typeof json !== 'object') return null;
  const v = (json as Record<string, unknown>).versionCode;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return null;
  const date = (json as Record<string, unknown>).date;
  return { versionCode: v, date: typeof date === 'string' ? date : undefined };
}

/** Vrai si la version publiée est plus récente que celle installée. */
export function majDisponible(installee: number | undefined, publiee: VersionPubliee | null): boolean {
  if (!publiee || !installee) return false;
  return publiee.versionCode > installee;
}

/** Récupère la version publiée (null si pas de réseau ou fichier absent). */
export async function versionPubliee(fetchFn: typeof fetch = fetch): Promise<VersionPubliee | null> {
  try {
    const rep = await fetchFn(`${LIEN_VERSION}?t=${Date.now()}`, { cache: 'no-store' });
    if (!rep.ok) return null;
    return lireVersion(await rep.json());
  } catch {
    return null;
  }
}
