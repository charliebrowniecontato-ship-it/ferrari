import test from 'node:test';
import assert from 'node:assert/strict';
import { readInventory } from '../lib/inventory.mjs';

test('only known projects with residential units in stock reach the site', () => {
  const payload = readInventory({
    uf: 'SP',
    developments: [
      { development: 'CONDOMÍNIO VISION PENHA', profile: { delivery: 'Entregue' }, groups: [
        { typology: '2Q', free: 0, minPrice: 250000 },
        { typology: 'LOJA', category: 'NR', free: 5, minPrice: 300000 },
        { typology: '2Q', free: 1, minPrice: null },
        { typology: '2QS', free: 3, minPrice: 400000, category: 'R2v-1', parking: 'car' }
      ] },
      { development: 'SINFONIA SANTO AMARO', groups: [{ typology: '3Q', free: 0 }] },
      { development: 'UNMAPPED', groups: [{ typology: '1Q', free: 10 }] }
    ]
  });

  assert.deepEqual(Object.keys(payload), ['vision']);
  assert.equal(payload.vision.units, 4);
  assert.equal(payload.vision.price, 400000);
  assert.equal(payload.vision.delivery, 'Entregue');
  assert.deepEqual(payload.vision.options.map(option => [option.label, option.price, option.category]), [
    ['2 dormitórios + suíte', 400000, 'R2V'],
    ['2 dormitórios', null, '']
  ]);
});

test('November offers follow São Paulo calendar and stay separate from stock prices', () => {
  const input = {
    uf: 'SP',
    developments: [
      { development: 'CONDOMÍNIO VISION PENHA', groups: [{ typology: '2Q', free: 1, minPrice: 436361 }] },
      { development: 'ATLAS SACOMÃ BY EMCCAMP', groups: [{ typology: '2Q', free: 1, minPrice: 310000 }] },
      { development: 'SERENA RESIDENCE', groups: [{ typology: '2Q', free: 0 }] }
    ]
  };
  const november = readInventory(input, Date.parse('2026-11-01T03:00:00Z'));
  assert.deepEqual(november.vision.blackNovember, { discount: 30000, prize: 6000 });
  assert.equal(november.vision.price, 436361);
  assert.deepEqual(november.atlas.blackNovember, { discount: 0, prize: 2000 });
  assert.equal(november.serena, undefined);
  assert.equal(readInventory(input, Date.parse('2026-11-01T02:59:59Z')).vision.blackNovember, undefined);
  assert.equal(readInventory(input, Date.parse('2026-12-01T03:00:00Z')).vision.blackNovember, undefined);
});
