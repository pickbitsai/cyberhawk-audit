import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCves, normalizeFeedUrl } from '../scripts/import-watchlist.mjs';

test('personal feeds retain only unique CVE identifiers', () => {
  assert.deepEqual(extractCves('CVE-2026-55255 text CVE-2026-55255 CVE-2025-71338'), ['CVE-2025-71338', 'CVE-2026-55255']);
});

test('personal feed URLs require the expected HTTPS host and route', () => {
  const token = 'A'.repeat(32);
  assert.equal(
    normalizeFeedUrl(`https://vbfwzpztnvfktydozgir.supabase.co/functions/v1/cyberhawk-feed/${token}.xml`),
    `https://vbfwzpztnvfktydozgir.supabase.co/functions/v1/cyberhawk-feed/${token}.xml`
  );
  assert.throws(() => normalizeFeedUrl(`http://vbfwzpztnvfktydozgir.supabase.co/functions/v1/cyberhawk-feed/${token}.xml`), /HTTPS/);
  assert.throws(() => normalizeFeedUrl(`https://example.com/functions/v1/cyberhawk-feed/${token}.xml`), /not allowed/);
});
