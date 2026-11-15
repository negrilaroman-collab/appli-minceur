// Éléments communs aux fournisseurs d'IA (Gemini gratuit, Claude payant).
import * as SecureStore from 'expo-secure-store';

export type Fournisseur = 'gemini' | 'claude';

export const LIBELLES_FOURNISSEUR: Record<Fournisseur, string> = {
  gemini: 'Gemini (Google, gratuit)',
  claude: 'Claude (Anthropic, payant)',
};

export const LIENS_CLE: Record<Fournisseur, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  claude: 'https://console.anthropic.com/settings/keys',
};

const cleStockage = (f: Fournisseur) => (f === 'gemini' ? 'gemini_api_key' : 'anthropic_api_key');
const CLE_FOURNISSEUR = 'fournisseur_ia';

export async function lireCleApi(f: Fournisseur): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(cleStockage(f));
  } catch {
    return null;
  }
}

export async function enregistrerCleApi(f: Fournisseur, cle: string): Promise<void> {
  if (cle.trim()) await SecureStore.setItemAsync(cleStockage(f), cle.trim());
  else await SecureStore.deleteItemAsync(cleStockage(f));
}

export async function lireFournisseur(): Promise<Fournisseur> {
  try {
    const v = await SecureStore.getItemAsync(CLE_FOURNISSEUR);
    return v === 'claude' ? 'claude' : 'gemini';
  } catch {
    return 'gemini';
  }
}

export async function enregistrerFournisseur(f: Fournisseur): Promise<void> {
  await SecureStore.setItemAsync(CLE_FOURNISSEUR, f);
}

export { ErreurAnalyse, SYSTEME, textePremierTour, texteReponses } from './ia-texte';
