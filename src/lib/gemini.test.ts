/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { analyserGemini, corpsRequete, lireReponse, MODELES_GEMINI, premierTourGemini, testerCleGemini } from './gemini.ts';
import { ErreurAnalyse } from './ia-texte.ts';

const analyseJson = {
  aliments: [{ nom: 'Riz', grammes: 200, grammesMin: 180, grammesMax: 220, cuisson: 'bouilli', kcal100g: 130, proteines100g: 2.7, lipides100g: 0.3, glucides100g: 28, confiance: 0.9 }],
  questions: [],
  remarque: 'Ajoute des légumes.',
};
const reponseOk = { candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: JSON.stringify(analyseJson) }] } }] };

const fauxFetch = (statuts: number[], corps: unknown = reponseOk) => {
  const appels: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    appels.push({ url, init });
    const status = statuts[appels.length - 1] ?? 200;
    return new Response(status === 200 ? JSON.stringify(corps) : '{"error":{"message":"x"}}', { status });
  }) as unknown as typeof fetch;
  return { f, appels };
};

test('corps de requête : image, schéma JSON, consigne système', () => {
  const c = corpsRequete([premierTourGemini('AAAA', 'Analyse ce repas.')]);
  assert.equal(c.generationConfig.response_mime_type, 'application/json');
  assert.deepEqual(c.contents[0].parts[0], { inline_data: { mime_type: 'image/jpeg', data: 'AAAA' } });
  assert.ok(c.system_instruction.parts[0].text.includes('diététicien'));
});

test('lecture d’une réponse valide', () => {
  const { analyse } = lireReponse(reponseOk);
  assert.equal(analyse.aliments[0].nom, 'Riz');
});

test('réponse illisible ou bloquée → erreur claire', () => {
  assert.throws(() => lireReponse({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'pas du json' }] } }] }), ErreurAnalyse);
  assert.throws(() => lireReponse({ promptFeedback: { blockReason: 'SAFETY' } }), ErreurAnalyse);
});

test('clé envoyée en en-tête et historique complété', async () => {
  const { f, appels } = fauxFetch([200]);
  const r = await analyserGemini('cle-test', [premierTourGemini('AAAA', 'x')], f);
  assert.equal((appels[0].init.headers as Record<string, string>)['x-goog-api-key'], 'cle-test');
  assert.ok(appels[0].url.includes(MODELES_GEMINI[0]));
  assert.equal(r.historique.length, 2);
  assert.equal(r.historique[1].role, 'model');
});

test('modèle introuvable (404) → essaie le suivant', async () => {
  const { f, appels } = fauxFetch([404, 200]);
  await analyserGemini('k', [premierTourGemini('AAAA', 'x')], f);
  assert.equal(appels.length, 2);
  assert.ok(appels[1].url.includes(MODELES_GEMINI[1]));
});

const sansAttente = async () => {};

test('surcharge passagère (503) → réessaie le même modèle puis réussit', async () => {
  const { f, appels } = fauxFetch([503, 200]);
  const attentes: number[] = [];
  await analyserGemini('k', [premierTourGemini('AAAA', 'x')], f, async (ms) => { attentes.push(ms); });
  assert.equal(appels.length, 2);
  assert.ok(appels[1].url.includes(MODELES_GEMINI[0]));
  assert.deepEqual(attentes, [2000]);
});

test('modèle surchargé (503 répétés) → passe au modèle suivant', async () => {
  const { f, appels } = fauxFetch([503, 503, 200]);
  await analyserGemini('k', [premierTourGemini('AAAA', 'x')], f, sansAttente);
  assert.equal(appels.length, 3);
  assert.ok(appels[2].url.includes(MODELES_GEMINI[1]));
});

test('tous les modèles surchargés → message clair', async () => {
  const { f, appels } = fauxFetch(Array(20).fill(503));
  await assert.rejects(analyserGemini('k', [premierTourGemini('AAAA', 'x')], f, sansAttente), /surchargé/);
  assert.equal(appels.length, MODELES_GEMINI.length * 2);
});

test('quota d’un modèle atteint (429) → essaie le suivant', async () => {
  const { f, appels } = fauxFetch([429, 200]);
  await analyserGemini('k', [premierTourGemini('AAAA', 'x')], f, sansAttente);
  assert.equal(appels.length, 2);
});

test('quota atteint (429) partout → message quota', async () => {
  const { f } = fauxFetch(Array(10).fill(429));
  await assert.rejects(analyserGemini('k', [premierTourGemini('AAAA', 'x')], f), /Quota/);
});

test('test de clé : valide → ok, invalide → message clair', async () => {
  const ok = { candidates: [{ content: { parts: [{ text: 'OK' }] } }] };
  await testerCleGemini('cle', fauxFetch([200], ok).f);
  const refus = (async () => new Response('{"error":{"message":"API key not valid"}}', { status: 400 })) as unknown as typeof fetch;
  await assert.rejects(testerCleGemini('mauvaise', refus), /Clé Gemini refusée/);
});
