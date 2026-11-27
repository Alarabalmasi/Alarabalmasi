import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { enhanceWordPressPosts, type WpRawPost } from '../src/core/wp-enhancer.ts';

const backupPath = path.resolve(import.meta.dirname, '..', 'wordpress', 'backup-2026-11-27.json');

test('enhances all 11 WordPress posts with zero missing ALTs, valid headings, Maps, and WhatsApp links', () => {
  const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8')) as WpRawPost[];
  assert.equal(raw.length, 11);

  const enhanced = enhanceWordPressPosts(raw);
  assert.equal(enhanced.length, 11);

  for (const post of enhanced) {
    assert.equal(post.metricsAfter.missingAltCount, 0, `Post ${post.id} still has missing ALT`);
    assert.ok(post.metricsAfter.h2Count >= 3, `Post ${post.id} must have >= 3 H2 headings`);
    assert.ok(post.metricsAfter.storeLinksCount >= 3, `Post ${post.id} must have deep store links`);
    assert.equal(post.metricsAfter.hasWhatsApp, true, `Post ${post.id} missing WhatsApp link`);
    assert.equal(post.metricsAfter.hasMaps, true, `Post ${post.id} missing Google Maps link`);
    assert.equal(post.metricsAfter.hasGeoDirectAnswer, true, `Post ${post.id} missing GEO summary`);
    assert.equal(post.metricsAfter.hasComparisonTable, true, `Post ${post.id} missing comparison table`);
    assert.ok(Array.isArray((post.schemaJsonLd as any)['@graph']), `Post ${post.id} missing JSON-LD @graph`);
  }

  const branchPost = enhanced.find((p) => p.id === 465)!;
  assert.ok(
    (branchPost.schemaJsonLd as any)['@graph'].some((g: any) => g['@type'] === 'ClothingStore'),
    'Branch post 465 must include ClothingStore schema',
  );

  const p572 = enhanced.find((p) => p.id === 572)!;
  assert.ok(!/(?:^|>|\s)ختر الثوب الجاهز/.test(p572.htmlContent), 'Typo in post 572 must be fixed');
  assert.ok(p572.htmlContent.includes('اختر الثوب الجاهز'));
});
