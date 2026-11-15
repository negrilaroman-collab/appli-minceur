// Point d'entrée unique de l'IA (Gemini, gratuit) : estimation des repas et coach.
import { analyserGemini, discuterGemini, premierTourGemini, type TourGemini } from './gemini';
import { ErreurAnalyse, lireCleApi, textePremierTour, texteReponses } from './ia-commun';
import { systemeCoach, type ContexteCoach } from './ia-texte';
import type { AnalysePhoto } from './photo-logic';

export { ErreurAnalyse } from './ia-commun';

export interface Session {
  cle: string;
  historique: TourGemini[];
}

async function executer(s: Session): Promise<{ analyse: AnalysePhoto; session: Session }> {
  const r = await analyserGemini(s.cle, s.historique);
  return { analyse: r.analyse, session: { ...s, historique: r.historique } };
}

async function cle(): Promise<string> {
  const c = await lireCleApi();
  if (!c) throw new ErreurAnalyse('Ajoute ta clé Gemini gratuite dans l’onglet Profil pour utiliser l’IA.');
  return c;
}

/** Démarre une estimation à partir d'une photo, ou d'une simple description si base64Jpeg est null. */
export async function demarrerAnalyse(base64Jpeg: string | null, contexte: string) {
  const texte = textePremierTour(contexte, base64Jpeg !== null);
  return executer({ cle: await cle(), historique: [premierTourGemini(base64Jpeg, texte)] });
}

export async function repondreQuestions(s: Session, reponses: { question: string; reponse: string }[]) {
  return executer({ ...s, historique: [...s.historique, { role: 'user', parts: [{ text: texteReponses(reponses) }] }] });
}

// ---------- Coach (conversation libre) ----------

export interface MessageCoach {
  role: 'utilisateur' | 'coach';
  texte: string;
  imageBase64?: string;
}

export async function demanderCoach(conversation: MessageCoach[], contexte: ContexteCoach): Promise<string> {
  // On ne renvoie que la photo la plus récente, pour limiter la taille des requêtes.
  const avecPhoto = conversation.map((m) => !!m.imageBase64).lastIndexOf(true);
  const historique: TourGemini[] = conversation.map((m, i) =>
    m.role === 'coach'
      ? { role: 'model', parts: [{ text: m.texte }] }
      : premierTourGemini(i === avecPhoto ? m.imageBase64 ?? null : null, m.texte || 'Que me conseilles-tu avec ça ?'),
  );
  return discuterGemini(await cle(), systemeCoach(contexte), historique);
}

export { testerCleGemini } from './gemini';
