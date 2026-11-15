/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { bilanSemaine, courbePoids, decalerJour, kcalParJour, semainesJusquaCible, serieJours, vitesseHebdo } from './suivi.ts';

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

test('série de jours notés', () => {
  const r = ['2026-11-12', '2026-11-13', '2026-11-14'].map((date) => ({ date }));
  assert.equal(serieJours(r, '2026-11-15'), 3);
  assert.equal(serieJours([...r, { date: '2026-11-15' }], '2026-11-15'), 4);
  assert.equal(serieJours([{ date: '2026-11-10' }], '2026-11-15'), 0);
});

test('bilan : perte lente mais repas au-dessus de l’objectif → on ne baisse pas', () => {
  const pesees = Array.from({ length: 21 }, (_, i) => ({ date: decalerJour('2026-10-26', i), poidsKg: 90 - i * 0.005 }));
  const repas = Array.from({ length: 7 }, (_, i) => ({ date: decalerJour('2026-11-09', i), kcal: 2700 }));
  const b = bilanSemaine(pesees, repas, '2026-11-15', 2330, () => 2205);
  assert.equal(b.kcalPropose, 2330);
  assert.match(b.message, /au-dessus/);
  const b2 = bilanSemaine(pesees, repas.map((r) => ({ ...r, kcal: 2300 })), '2026-11-15', 2330, () => 2205);
  assert.equal(b2.kcalPropose, 2205);
  const b3 = bilanSemaine([], repas, '2026-11-15', 2330, () => 2205);
  assert.equal(b3.perteKg, null);
});

test('bilan : une seule semaine de pesées → pas d’ajustement', () => {
  const pesees = Array.from({ length: 8 }, (_, i) => ({ date: decalerJour('2026-11-08', i), poidsKg: 90 - i * 0.2 }));
  const b = bilanSemaine(pesees, [], '2026-11-15', 2330, () => 2455);
  assert.equal(b.kcalPropose, 2330);
  assert.match(b.message, /eau/);
});
