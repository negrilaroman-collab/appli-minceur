/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ajusterPortion,
  arrondirTotaux,
  doitPoserQuestions,
  incertitude,
  nettoyerAnalyse,
  totaux,
  type AlimentEstime,
  type AnalysePhoto,
} from './photo-logic.ts';

const riz: AlimentEstime = {
  nom: 'Riz cuit', grammes: 200, grammesMin: 180, grammesMax: 220, cuisson: 'bouilli',
  kcal100g: 130, proteines100g: 2.7, lipides100g: 0.3, glucides100g: 28, confiance: 0.9,
};
const poulet: AlimentEstime = {
  nom: 'Poulet', grammes: 150, grammesMin: 130, grammesMax: 170, cuisson: 'grillé',
  kcal100g: 165, proteines100g: 31, lipides100g: 3.6, glucides100g: 0, confiance: 0.85,
};
const question = { id: 'q1', question: 'Cuisson ?', options: ['Grillé', 'Poêlé'] };

test('totaux et fourchette', () => {
  const t = arrondirTotaux(totaux([riz, poulet]));
  assert.equal(t.kcal, 508); // 260 + 247,5
  assert.equal(t.kcalMin, 449);
  assert.equal(t.kcalMax, 567);
  assert.equal(t.proteinesG, 52);
});

test('pas de question si confiance haute et fourchette étroite', () => {
  const a: AnalysePhoto = { aliments: [riz, poulet], questions: [question], remarque: '' };
  assert.ok(incertitude(totaux(a.aliments)) < 0.2);
  assert.equal(doitPoserQuestions(a, 0), false);
});

test('question si confiance faible', () => {
  const a: AnalysePhoto = { aliments: [riz, { ...poulet, confiance: 0.4 }], questions: [question], remarque: '' };
  assert.equal(doitPoserQuestions(a, 0), true);
  assert.equal(doitPoserQuestions(a, 2), false); // plus de 2 tours
  assert.equal(doitPoserQuestions({ ...a, questions: [] }, 0), false);
});

test('question si fourchette trop large', () => {
  const a: AnalysePhoto = { aliments: [{ ...riz, grammesMin: 100, grammesMax: 350 }], questions: [question], remarque: '' };
  assert.equal(doitPoserQuestions(a, 0), true);
});

test('nettoyage des valeurs aberrantes', () => {
  const a = nettoyerAnalyse({
    aliments: [{ ...riz, grammesMin: 300, grammesMax: 50, confiance: 3, kcal100g: -5 }, { ...poulet, grammes: 0 }],
    questions: [question, { id: 'q2', question: 'x', options: ['seule'] }, question, question, question],
    remarque: '',
  });
  assert.equal(a.aliments.length, 1);
  assert.equal(a.aliments[0].grammesMin, 200);
  assert.equal(a.aliments[0].grammesMax, 200);
  assert.equal(a.aliments[0].confiance, 1);
  assert.equal(a.aliments[0].kcal100g, 0);
  assert.equal(a.questions.length, 3);
});

test('ajustement de portion proportionnel', () => {
  const plus = ajusterPortion(riz, 1.1);
  assert.equal(plus.grammes, 220);
  assert.equal(plus.grammesMin, 198);
  assert.equal(plus.grammesMax, 242);
});
