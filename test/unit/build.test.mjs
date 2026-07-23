import test from 'node:test';
import assert from 'node:assert/strict';
import { createResolvers, centuryOf } from '../../build/utils.mjs';

const acharyas = [
  { id: 1, name: 'कुन्दकुन्द', period: '1st century' },
  { id: 2, name: 'समन्तभद्र', period: '2nd century' },
  { id: 3, name: 'पूज्यपाद', period: '5th century' },
  { id: 4, name: 'अकलंक', period: '8th century' },
  { id: 5, name: 'विद्यानन्द', period: '9th century' },
];

const bhattarak = [
  { id: 1, name: 'सकलकीर्ति' },
  { id: 2, name: 'ज्ञानभूषण' }
];

test('build utils', async (t) => {
  const { resolveAcharya, resolveGuru, regByKey, bhatByKey } = createResolvers(acharyas, bhattarak);

  await t.test('centuryOf', () => {
    assert.equal(centuryOf({ century: '12वीं (1100-1199)' }), '12');
    assert.equal(centuryOf({ century: '1st' }), '1');
    assert.equal(centuryOf({ century: null }), '?');
  });

  await t.test('resolveAcharya - exact match', () => {
    const a = resolveAcharya('कुन्दकुन्द');
    assert.ok(a);
    assert.equal(a.name, 'कुन्दकुन्द');
  });

  await t.test('resolveAcharya - prefix/contains match', () => {
    const a = resolveAcharya('समन्तभद्र स्वामी');
    assert.ok(a);
    assert.equal(a.name, 'समन्तभद्र');
  });

  await t.test('resolveAcharya - bhattarak', () => {
    const a = resolveAcharya('सकलकीर्ति');
    assert.ok(a);
    assert.equal(a.name, 'सकलकीर्ति');
    assert.equal(a.isBhattarak, true);
  });

  await t.test('resolveGuru', () => {
    const a = resolveGuru('पूज्यपाद');
    assert.ok(a);
    assert.equal(a.name, 'पूज्यपाद');
  });
});
