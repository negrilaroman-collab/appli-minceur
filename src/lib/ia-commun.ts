// Clé Gemini stockée chiffrée sur le téléphone.
import * as SecureStore from 'expo-secure-store';

export const LIEN_CLE_GEMINI = 'https://aistudio.google.com/apikey';
const CLE_STOCKAGE = 'gemini_api_key';

export async function lireCleApi(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CLE_STOCKAGE);
  } catch {
    return null;
  }
}

export async function enregistrerCleApi(cle: string): Promise<void> {
  if (cle.trim()) await SecureStore.setItemAsync(CLE_STOCKAGE, cle.trim());
  else await SecureStore.deleteItemAsync(CLE_STOCKAGE);
}

export { ErreurAnalyse, SYSTEME, textePremierTour, texteReponses } from './ia-texte';
