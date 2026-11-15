// Point d'entrée unique de l'analyse photo, quel que soit le fournisseur choisi.
import { analyserClaude, premierTourClaude, type TourClaude } from './claude';
import { analyserGemini, premierTourGemini, type TourGemini } from './gemini';
import { ErreurAnalyse, lireCleApi, lireFournisseur, textePremierTour, texteReponses, type Fournisseur } from './ia-commun';
import type { AnalysePhoto } from './photo-logic';

export { ErreurAnalyse } from './ia-commun';

export type Session =
  | { fournisseur: 'gemini'; cle: string; historique: TourGemini[] }
  | { fournisseur: 'claude'; cle: string; historique: TourClaude[] };

async function executer(s: Session): Promise<{ analyse: AnalysePhoto; session: Session }> {
  if (s.fournisseur === 'gemini') {
    const r = await analyserGemini(s.cle, s.historique);
    return { analyse: r.analyse, session: { ...s, historique: r.historique } };
  }
  const r = await analyserClaude(s.cle, s.historique);
  return { analyse: r.analyse, session: { ...s, historique: r.historique } };
}

export async function demarrerAnalyse(base64Jpeg: string, contexte: string) {
  const fournisseur: Fournisseur = await lireFournisseur();
  const cle = await lireCleApi(fournisseur);
  if (!cle) throw new ErreurAnalyse('Ajoute ta clé API dans l’onglet Profil pour utiliser la photo.');
  const texte = textePremierTour(contexte);
  const session: Session =
    fournisseur === 'gemini'
      ? { fournisseur, cle, historique: [premierTourGemini(base64Jpeg, texte)] }
      : { fournisseur, cle, historique: [premierTourClaude(base64Jpeg, texte)] };
  return executer(session);
}

export async function repondreQuestions(s: Session, reponses: { question: string; reponse: string }[]) {
  const texte = texteReponses(reponses);
  const suite: Session =
    s.fournisseur === 'gemini'
      ? { ...s, historique: [...s.historique, { role: 'user', parts: [{ text: texte }] }] }
      : { ...s, historique: [...s.historique, { role: 'user', content: texte }] };
  return executer(suite);
}
