/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ajusterObjectif,
  depenseTotale,
  metabolismeDeBase,
  objectifKcal,
  objectifMacros,
  type Profil,
} from './nutrition.ts';
import { chargeSuivante, genererProgramme } from './training.ts';

const roman: Profil = {
  sexe: 'homme', age: 30, tailleCm: 180, poidsKg: 90, poidsCibleKg: 80, activite: 'modere', rythme: 'normal',
};

test('Mifflin-St Jeor : exemple de la fiche', () => {
  assert.equal(metabolismeDeBase(roman), 1880);
  assert.equal(depenseTotale(roman), 2914);
  assert.equal(objectifKcal(roman), 2330);
});

test('macros cohérentes avec les kcal', () => {
  const m = objectifMacros(roman);
  assert.equal(m.proteinesG, 162);
  const total = m.proteinesG * 4 + m.lipidesG * 9 + m.glucidesG * 4;
  assert.ok(Math.abs(total - m.kcal) < 10);
});

test('plancher de sécurité respecté', () => {
  const petite: Profil = { sexe: 'femme', age: 60, tailleCm: 150, poidsKg: 50, poidsCibleKg: 45, activite: 'sedentaire', rythme: 'rapide' };
  assert.ok(objectifKcal(petite) >= 1200);
  assert.ok(objectifKcal(petite) >= metabolismeDeBase(petite));
});

test('déficit plafonné à 750 kcal', () => {
  const grand: Profil = { ...roman, poidsKg: 140, activite: 'extreme', rythme: 'rapide' };
  assert.ok(depenseTotale(grand) - objectifKcal(grand) <= 755);
});

test('ajustement hebdo : trop lent → baisse, trop rapide → hausse', () => {
  assert.equal(ajusterObjectif(roman, 2330, [0.1, 0.1]), 2205);
  assert.equal(ajusterObjectif(roman, 2330, [1.0, 1.2]), 2455);
  assert.equal(ajusterObjectif(roman, 2330, [0.6, 0.6]), 2330);
});

test('programme : 12 semaines, semaines 5 et 9 allégées', () => {
  const prog = genererProgramme({ niveau: 'debutant', lieu: 'maison', joursParSemaine: 4 });
  assert.equal(prog.length, 12);
  assert.equal(prog[4].bloc, 'Allègement');
  assert.equal(prog[8].bloc, 'Allègement');
  assert.equal(prog[11].bloc, 'Intensification');
  assert.ok(prog.every((s) => s.seances.length >= 2));
});

test('double progression', () => {
  assert.equal(chargeSuivante(40, [12, 12, 12], 12, 8), 41);
  assert.equal(chargeSuivante(40, [12, 10, 9], 12, 8), 40);
  assert.equal(chargeSuivante(40, [12, 12, 12], 12, 10), 38);
});
