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
