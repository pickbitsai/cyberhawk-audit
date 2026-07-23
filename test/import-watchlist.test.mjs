import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCves, normalizeFeedUrl } from '../scripts/import-watchlist.mjs';

test('personal feeds retain only unique CVE identifiers', () => {
  assert.deepEqual(extractCves('CVE-2026-55255 text CVE-2026-55255 CVE-2025-71338'), ['CVE-2025-71338', 'CVE-2026-55255']);
});

test('personal feed URLs require an explicit allowed HTTPS host and the feed route', () => {
  const token = 'A'.repeat(32);
  const host = 'feeds.example.com';
  assert.equal(
    normalizeFeedUrl(`https://${host}/functions/v1/cyberhawk-feed/${token}.xml`, host),
    `https://${host}/functions/v1/cyberhawk-feed/${token}.xml`
  );
  assert.throws(() => normalizeFeedUrl(`https://${host}/functions/v1/cyberhawk-feed/${token}.xml`), /allowed host is required/);
  assert.throws(() => normalizeFeedUrl(`http://${host}/functions/v1/cyberhawk-feed/${token}.xml`, host), /HTTPS/);
  assert.throws(() => normalizeFeedUrl(`https://other.example.com/functions/v1/cyberhawk-feed/${token}.xml`, host), /not allowed/);
});
