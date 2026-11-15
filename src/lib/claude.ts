// Analyse d'une photo de repas avec l'API Claude (option payante).
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import { ErreurAnalyse, SYSTEME } from './ia-texte';
import { nettoyerAnalyse, type AnalysePhoto } from './photo-logic';

export const MODELE_CLAUDE = 'claude-sonnet-5-5';

const SchemaAnalyse = z.object({
  aliments: z.array(
    z.object({
      nom: z.string(),
      grammes: z.number(),
      grammesMin: z.number(),
      grammesMax: z.number(),
      cuisson: z.string(),
      kcal100g: z.number(),
      proteines100g: z.number(),
      lipides100g: z.number(),
      glucides100g: z.number(),
      confiance: z.number(),
    }),
  ),
  questions: z.array(z.object({ id: z.string(), question: z.string(), options: z.array(z.string()) })),
  remarque: z.string(),
});

// Les tours de l'assistant sont renvoyés tels quels (blocs de réflexion compris), comme l'exige l'API.
export type TourClaude = Anthropic.Beta.BetaMessageParam;

export async function analyserClaude(
  apiKey: string,
  historique: TourClaude[],
): Promise<{ analyse: AnalysePhoto; historique: TourClaude[] }> {
  // La clé appartient à l'utilisateur et reste sur son propre téléphone : appel direct autorisé.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, timeout: 90_000 });

  let reponse;
  try {
    reponse = await client.beta.messages.parse({
      model: MODELE_CLAUDE,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEME,
      messages: historique,
      output_config: { effort: 'medium', format: betaZodOutputFormat(SchemaAnalyse) },
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new ErreurAnalyse('Clé Claude refusée : vérifie-la dans l’onglet Profil.');
    if (e instanceof Anthropic.RateLimitError) throw new ErreurAnalyse('Trop de demandes, réessaie dans une minute.');
    if (e instanceof Anthropic.APIConnectionError) throw new ErreurAnalyse('Pas de connexion internet.');
    if (e instanceof Anthropic.APIError) throw new ErreurAnalyse(`Erreur du service (${e.status ?? '?'}). Réessaie.`);
    throw e;
  }

  if (reponse.stop_reason === 'refusal') throw new ErreurAnalyse('L’analyse a été refusée pour cette photo.');
  if (reponse.stop_reason === 'max_tokens' || !reponse.parsed_output) throw new ErreurAnalyse('Réponse incomplète, réessaie.');

  return {
    analyse: nettoyerAnalyse(reponse.parsed_output),
    historique: [...historique, { role: 'assistant', content: reponse.content as Anthropic.Beta.BetaContentBlockParam[] }],
  };
}

export function premierTourClaude(base64Jpeg: string, texte: string): TourClaude {
  return {
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg } },
      { type: 'text', text: texte },
    ],
  };
}
