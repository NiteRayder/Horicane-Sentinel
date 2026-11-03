import test from 'node:test';
import assert from 'node:assert/strict';
import { horicaneRequest, isHoricaneApiConfigured } from './horicane.js';

test('Horicane integration reports whether credentials are configured', () => {
  assert.equal(typeof isHoricaneApiConfigured(), 'boolean');
});

test('Horicane integration fails closed when not configured', async () => {
  if (isHoricaneApiConfigured()) return;
  await assert.rejects(horicaneRequest('/guilds/example/overview'), {
    code: 'HORICANE_API_NOT_CONFIGURED',
  });
});
