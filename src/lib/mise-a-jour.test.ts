import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lireVersion, majDisponible, versionPubliee } from './mise-a-jour.ts';

test('lireVersion accepte un versionCode entier et refuse le reste', () => {
  assert.deepEqual(lireVersion({ versionCode: 12, date: '2026-11-25' }), { versionCode: 12, date: '2026-11-25' });
  assert.equal(lireVersion({ versionCode: '12' }), null);
  assert.equal(lireVersion({ versionCode: 0 }), null);
  assert.equal(lireVersion(null), null);
});

test('majDisponible seulement si la version publiée est plus grande', () => {
  assert.equal(majDisponible(10, { versionCode: 11 }), true);
  assert.equal(majDisponible(11, { versionCode: 11 }), false);
  assert.equal(majDisponible(12, { versionCode: 11 }), false);
  assert.equal(majDisponible(undefined, { versionCode: 11 }), false);
  assert.equal(majDisponible(10, null), false);
});

test('versionPubliee renvoie null sans réseau ou si le fichier manque', async () => {
  const panne = (async () => { throw new Error('hors ligne'); }) as unknown as typeof fetch;
  assert.equal(await versionPubliee(panne), null);
  const absent = (async () => new Response('', { status: 404 })) as unknown as typeof fetch;
  assert.equal(await versionPubliee(absent), null);
  const ok = (async () => Response.json({ versionCode: 5 })) as unknown as typeof fetch;
  assert.deepEqual(await versionPubliee(ok), { versionCode: 5, date: undefined });
});
