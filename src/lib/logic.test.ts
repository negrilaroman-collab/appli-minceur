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
  assert.equal(m.proteinesG, 146); // 1,8 g × 81 kg (poids à IMC 25 pour 1,80 m)
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

test('programme : gainage en secondes, 2 jours respectés, intermédiaire ≠ débutant, 3 jours équilibrés', () => {
  const p2 = genererProgramme({ niveau: 'debutant', lieu: 'maison', joursParSemaine: 2 });
  assert.ok(p2.every((s) => s.seances.length === 2));
  const gainage = p2[0].seances[0].exercices.find((e) => e.nom === 'Gainage planche');
  assert.match(gainage!.reps, / s$/);
  assert.ok(!p2.some((s) => s.seances.some((x) => x.exercices.some((e) => e.nom.includes('Dips')))));
  const deb = genererProgramme({ niveau: 'debutant', lieu: 'salle', joursParSemaine: 3 });
  const inter = genererProgramme({ niveau: 'intermediaire', lieu: 'salle', joursParSemaine: 3 });
  assert.notDeepEqual(deb[6], inter[6]);
  assert.deepEqual(deb[6].seances.map((s) => s.titre), ['Bas du corps', 'Haut du corps', 'Corps entier']);
  const maison = genererProgramme({ niveau: 'debutant', lieu: 'maison', joursParSemaine: 3 });
  assert.ok(!maison[10].seances[0].exercices[0].reps.startsWith('6'));
});
