import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProducts, matchEntries, watchlistCves, buildRss } from '../scripts/build-watchlist.mjs';

const SAMPLE = [
  { cve: 'CVE-2026-55255', product: 'Langflow', severity: 'KEV', first_seen: '2026-07-07', flaw_summary: 'x', action: 'Update' },
  { cve: 'CVE-2026-40001', product: 'Ollama server', severity: 'CRITICAL', first_seen: '2026-07-20' },
  { cve: 'CVE-2026-40002', product: 'ollama', severity: 'HIGH', first_seen: '2026-01-01' },
  { cve: 'CVE-2026-40003', product: 'Some Other Thing', severity: 'CRITICAL', first_seen: '2026-07-21' },
  { cve: 'not-a-cve', product: 'badcve-widget', severity: 'HIGH', first_seen: '2026-07-21' },
];

test('parseProducts normalizes, dedups, and drops multi-token noise', () => {
  assert.deepEqual(parseProducts('Ollama, ollama , Langflow'), ['ollama', 'langflow']);
});

test('matchEntries matches by case-insensitive product substring', () => {
  const hits = matchEntries(SAMPLE, ['ollama']);
  assert.deepEqual(hits.map((e) => e.cve).sort(), ['CVE-2026-40001', 'CVE-2026-40002']);
});

test('severity and window filters apply', () => {
  const now = new Date('2026-07-22T00:00:00Z').getTime();
  const crit = matchEntries(SAMPLE, ['ollama'], { severity: 'CRITICAL', now });
  assert.deepEqual(crit.map((e) => e.cve), ['CVE-2026-40001']);
  const recent = matchEntries(SAMPLE, ['ollama'], { windowDays: 30, now });
  assert.deepEqual(recent.map((e) => e.cve), ['CVE-2026-40001']); // the 2026-01-01 row is outside 30d
});

test('watchlistCves keeps only valid, unique, sorted CVE ids', () => {
  const matched = matchEntries(SAMPLE, ['ollama', 'langflow', 'some', 'badcve-widget']);
  assert.deepEqual(watchlistCves(matched), ['CVE-2026-40001', 'CVE-2026-40002', 'CVE-2026-40003', 'CVE-2026-55255']);
});

test('buildRss escapes content and produces valid item structure', () => {
  const xml = buildRss([{ cve: 'CVE-2026-55255', product: 'A & B <script>', severity: 'KEV' }], { products: ['a'] });
  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /A &amp; B &lt;script&gt;/);
  assert.doesNotMatch(xml, /<script>/); // untrusted product text never lands as live markup
});
