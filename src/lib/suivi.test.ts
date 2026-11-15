/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { courbePoids, decalerJour, kcalParJour, semainesJusquaCible, vitesseHebdo } from './suivi.ts';

test('dates : décalage avec changement de mois', () => {
  assert.equal(decalerJour('2026-11-30', 1), '2026-12-01');
  assert.equal(decalerJour('2026-03-01', -1), '2026-02-28');
});

test('vitesse : -0,5 kg/semaine sur 3 semaines', () => {
  const pesees = [0, 7, 14, 21].map((j, i) => ({ date: decalerJour('2026-11-01', j), poidsKg: 90 - 0.5 * i }));
  const v = vitesseHebdo(pesees, '2026-11-22');
  assert.ok(v !== null && Math.abs(v + 0.5) < 0.01);
  assert.equal(semainesJusquaCible(88.5, 80, v), 17);
  assert.equal(vitesseHebdo(pesees.slice(0, 1), '2026-11-22'), null);
  assert.equal(semainesJusquaCible(88, 80, 0.2), null);
});

test('courbe lissée et kcal par jour', () => {
  const c = courbePoids([{ date: '2026-11-01', poidsKg: 90 }, { date: '2026-11-02', poidsKg: 89 }]);
  assert.equal(c[1].tendanceKg, 89.5);
  const k = kcalParJour([{ date: '2026-11-02', kcal: 500 }, { date: '2026-11-02', kcal: 300.4 }], '2026-11-03', 3);
  assert.deepEqual(k.map((x) => x.kcal), [0, 800, 0]);
});
