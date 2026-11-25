// Analyse d'une photo de repas avec l'API Gemini (Google), utilisable gratuitement
// avec une clé Google AI Studio (quota gratuit limité par jour).
import { ErreurAnalyse, SYSTEME } from './ia-texte.ts';
import { nettoyerAnalyse, type AnalysePhoto } from './photo-logic.ts';

// Essayés dans l'ordre : si un modèle n'existe pas (404), on passe au suivant.
export const MODELES_GEMINI = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'];

const URL = (modele: string) => `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`;

export interface TourGemini {
  role: 'user' | 'model';
  parts: ({ text: string } | { inline_data: { mime_type: string; data: string } })[];
}

const N = { type: 'NUMBER' } as const;
const S = { type: 'STRING' } as const;

export const SCHEMA_GEMINI = {
  type: 'OBJECT',
  properties: {
    aliments: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nom: S,
          grammes: N,
          grammesMin: N,
          grammesMax: N,
          cuisson: S,
          kcal100g: N,
          proteines100g: N,
          lipides100g: N,
          glucides100g: N,
          confiance: N,
        },
        required: ['nom', 'grammes', 'grammesMin', 'grammesMax', 'cuisson', 'kcal100g', 'proteines100g', 'lipides100g', 'glucides100g', 'confiance'],
      },
    },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { id: S, question: S, options: { type: 'ARRAY', items: S } },
        required: ['id', 'question', 'options'],
      },
    },
    remarque: S,
  },
  required: ['aliments', 'questions', 'remarque'],
};

export function corpsRequete(historique: TourGemini[]) {
  return {
    system_instruction: { parts: [{ text: SYSTEME }] },
    contents: historique,
    generationConfig: { response_mime_type: 'application/json', response_schema: SCHEMA_GEMINI },
  };
}

/** Extrait le JSON de la réponse Gemini (texte du premier candidat). */
export function lireReponse(json: any): { texte: string; analyse: AnalysePhoto } {
  const candidat = json?.candidates?.[0];
  if (!candidat) {
    const raison = json?.promptFeedback?.blockReason;
    throw new ErreurAnalyse(raison ? 'La photo a été refusée par le service.' : 'Réponse vide, réessaie.');
  }
  if (candidat.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidat.finishReason)) {
    throw new ErreurAnalyse('L’analyse a été interrompue, réessaie.');
  }
  const texte: string = (candidat.content?.parts ?? []).map((p: any) => p.text ?? '').join('');
  let brut: AnalysePhoto;
  try {
    brut = JSON.parse(texte);
  } catch {
    throw new ErreurAnalyse('Réponse illisible, réessaie.');
  }
  return { texte, analyse: nettoyerAnalyse(brut) };
}

/** Erreurs passagères côté Google (surcharge, panne courte) : on réessaie. */
const PASSAGERES = [500, 502, 503, 504, 529];
/** Attente avant chaque nouvel essai sur un même modèle (ms). */
export const DELAIS_REESSAI_MS = [2000];

export type Attente = (ms: number) => Promise<void>;
const dormir: Attente = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Appelle Gemini. Si un modèle est absent (404), surchargé (503…) ou à court de quota (429),
 * on réessaie puis on passe au modèle suivant. Renvoie le JSON brut.
 */
export async function appelerGemini(
  apiKey: string,
  corps: unknown,
  fetchFn: typeof fetch = fetch,
  attendre: Attente = dormir,
): Promise<any> {
  const texteCorps = JSON.stringify(corps);
  let derniere = '';
  let surcharge = false;
  let quota = false;
  for (const modele of MODELES_GEMINI) {
    for (let essai = 0; ; essai++) {
      let rep: Response;
      try {
        rep = await fetchFn(URL(modele), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: texteCorps,
        });
      } catch {
        throw new ErreurAnalyse('Pas de connexion internet.');
      }
      if (rep.ok) return rep.json();
      if (rep.status === 400 || rep.status === 401 || rep.status === 403) {
        const txt = await rep.text();
        if (/API key|API_KEY|permission/i.test(txt)) throw new ErreurAnalyse('Clé Gemini refusée : vérifie-la dans l’onglet Profil.');
        if (/location|region|not supported/i.test(txt)) throw new ErreurAnalyse('Gemini gratuit n’est pas disponible dans ton pays.');
        throw new ErreurAnalyse(`Requête refusée (${rep.status}).`);
      }
      if (PASSAGERES.includes(rep.status) && essai < DELAIS_REESSAI_MS.length) {
        await attendre(DELAIS_REESSAI_MS[essai]);
        continue; // même modèle, après une petite pause
      }
      if (PASSAGERES.includes(rep.status)) surcharge = true;
      else if (rep.status === 429) quota = true;
      else if (rep.status !== 404) throw new ErreurAnalyse(`Erreur du service Gemini (${rep.status}). Réessaie.`);
      derniere = modele;
      break; // modèle suivant
    }
  }
  if (surcharge) throw new ErreurAnalyse('Gemini est surchargé en ce moment (erreur 503, ça ne vient pas de toi). Réessaie dans une minute.');
  if (quota) throw new ErreurAnalyse('Quota gratuit du jour atteint, réessaie plus tard.');
  throw new ErreurAnalyse(`Aucun modèle Gemini disponible (dernier essayé : ${derniere}).`);
}

export async function analyserGemini(
  apiKey: string,
  historique: TourGemini[],
  fetchFn: typeof fetch = fetch,
  attendre?: Attente,
): Promise<{ analyse: AnalysePhoto; historique: TourGemini[] }> {
  const { texte, analyse } = lireReponse(await appelerGemini(apiKey, corpsRequete(historique), fetchFn, attendre));
  return { analyse, historique: [...historique, { role: 'model', parts: [{ text: texte }] }] };
}

/** Conversation libre (coach) : renvoie le texte de la réponse. */
export async function discuterGemini(
  apiKey: string,
  systeme: string,
  historique: TourGemini[],
  fetchFn: typeof fetch = fetch,
  attendre?: Attente,
): Promise<string> {
  const json = await appelerGemini(apiKey, { system_instruction: { parts: [{ text: systeme }] }, contents: historique }, fetchFn, attendre);
  const candidat = json?.candidates?.[0];
  if (!candidat) throw new ErreurAnalyse('Réponse vide, réessaie.');
  const texte: string = (candidat.content?.parts ?? []).map((p: any) => p.text ?? '').join('').trim();
  if (!texte) throw new ErreurAnalyse('Réponse vide, réessaie.');
  return texte;
}

export function premierTourGemini(base64Jpeg: string | null, texte: string): TourGemini {
  const image = base64Jpeg ? [{ inline_data: { mime_type: 'image/jpeg', data: base64Jpeg } }] : [];
  return { role: 'user', parts: [...image, { text: texte }] };
}

/** Petit appel pour vérifier qu'une clé fonctionne. Lève ErreurAnalyse sinon. */
export async function testerCleGemini(apiKey: string, fetchFn: typeof fetch = fetch): Promise<void> {
  await discuterGemini(apiKey, 'Réponds seulement OK.', [{ role: 'user', parts: [{ text: 'Test' }] }], fetchFn);
}
