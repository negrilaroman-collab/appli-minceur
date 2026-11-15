// Analyse d'une photo de repas avec l'API Claude.
// La clé API est saisie dans l'appli et stockée chiffrée sur le téléphone (expo-secure-store).
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { nettoyerAnalyse, type AnalysePhoto } from './photo-logic';

const CLE_STOCKAGE = 'anthropic_api_key';
export const MODELE = 'claude-opus-5-5';

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

const SchemaAnalyse = z.object({
  aliments: z.array(
    z.object({
      nom: z.string().describe('Nom court en français, ex. "Riz basmati cuit"'),
      grammes: z.number().describe('Meilleure estimation du poids dans l’assiette, en grammes'),
      grammesMin: z.number().describe('Estimation basse plausible, en grammes'),
      grammesMax: z.number().describe('Estimation haute plausible, en grammes'),
      cuisson: z.string().describe('Mode de cuisson probable, ex. "grillé", "poêlé à l’huile", "cru"'),
      kcal100g: z.number().describe('kcal pour 100 g, tel que préparé (matières grasses de cuisson incluses)'),
      proteines100g: z.number(),
      lipides100g: z.number(),
      glucides100g: z.number(),
      confiance: z.number().describe('Confiance de 0 à 1 sur l’identification ET la quantité'),
    }),
  ),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string().describe('Question courte en français, tutoiement'),
      options: z.array(z.string()).describe('2 à 4 réponses courtes à toucher'),
    }),
  ),
  remarque: z.string().describe('Un conseil diététique bref et bienveillant sur ce repas, ou chaîne vide'),
});

const SYSTEME = `Tu es un diététicien expert qui estime les calories d'un repas à partir d'une photo.

Pour chaque aliment visible :
- Identifie-le précisément et estime son poids en grammes avec une fourchette basse/haute honnête. Sers-toi des repères d'échelle (assiette standard 26 cm, couverts, main).
- Donne les valeurs pour 100 g de l'aliment tel que préparé, en t'appuyant sur les tables de référence (CIQUAL de l'ANSES). Compte l'huile, le beurre et les sauces probables, soit dans l'aliment, soit comme aliment séparé (ex. "Huile d'olive", 10 g).
- Donne une confiance de 0 à 1.

Questions : pose 0 à 3 questions, uniquement celles qui réduisent le plus l'incertitude en kcal (portion, mode de cuisson, matières grasses ou sauce cachées, variante de l'aliment, boisson). Chaque question a 2 à 4 réponses courtes. Si tu es déjà sûr (confiance ≥ 0,7 partout et fourchette étroite), ne pose aucune question.

Quand l'utilisateur répond à des questions, mets à jour toute l'analyse en tenant compte de ses réponses, et ne repose pas une question déjà répondue.

Si la photo ne montre pas de nourriture, renvoie une liste d'aliments vide et explique-le dans la remarque.`;

// Les tours de l'assistant sont renvoyés tels quels (blocs de réflexion compris), comme l'exige l'API.
export type Tour = Anthropic.Beta.BetaMessageParam;

export class ErreurAnalyse extends Error {}

/**
 * Lance (ou poursuit) l'analyse. `historique` contient les tours précédents ; renvoie
 * l'analyse et l'historique complété pour un éventuel tour de questions suivant.
 */
export async function analyser(
  historique: Tour[],
): Promise<{ analyse: AnalysePhoto; historique: Tour[] }> {
  const apiKey = await lireCleApi();
  if (!apiKey) throw new ErreurAnalyse('Ajoute ta clé API Anthropic dans l’onglet Profil pour utiliser la photo.');

  // La clé appartient à l'utilisateur et reste sur son propre téléphone : appel direct autorisé.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, timeout: 90_000 });

  let reponse;
  try {
    reponse = await client.beta.messages.parse({
      model: MODELE,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEME,
      messages: historique,
      output_config: { effort: 'medium', format: betaZodOutputFormat(SchemaAnalyse) },
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new ErreurAnalyse('Clé API refusée : vérifie-la dans l’onglet Profil.');
    if (e instanceof Anthropic.RateLimitError) throw new ErreurAnalyse('Trop de demandes, réessaie dans une minute.');
    if (e instanceof Anthropic.APIConnectionError) throw new ErreurAnalyse('Pas de connexion internet.');
    if (e instanceof Anthropic.APIError) throw new ErreurAnalyse(`Erreur du service (${e.status ?? '?'}). Réessaie.`);
    throw e;
  }

  if (reponse.stop_reason === 'refusal') throw new ErreurAnalyse('L’analyse a été refusée pour cette photo.');
  if (reponse.stop_reason === 'max_tokens' || !reponse.parsed_output) {
    throw new ErreurAnalyse('Réponse incomplète, réessaie.');
  }

  const analyse = nettoyerAnalyse(reponse.parsed_output);
  return {
    analyse,
    historique: [...historique, { role: 'assistant', content: reponse.content as Anthropic.Beta.BetaContentBlockParam[] }],
  };
}

export function premierTour(base64Jpeg: string, contexte: string): Tour {
  return {
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg } },
      { type: 'text', text: contexte ? `Analyse ce repas. Précision de ma part : ${contexte}` : 'Analyse ce repas.' },
    ],
  };
}

export function tourReponses(reponses: { question: string; reponse: string }[]): Tour {
  return {
    role: 'user',
    content: `Mes réponses :\n${reponses.map((r) => `- ${r.question} → ${r.reponse}`).join('\n')}\nMets à jour l'analyse.`,
  };
}
