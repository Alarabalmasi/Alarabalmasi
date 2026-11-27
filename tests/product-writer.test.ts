import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHybridProductPage } from '../src/core/product-writer.ts';

test('flags missing specs honestly without fabricating fabrics or sizes', () => {
  const pkg = generateHybridProductPage({
    productNameAr: 'ثوب العرب الماسي أبيض',
    category: 'thobe',
  });
  assert.ok(pkg.unverifiedWarnings.length >= 2);
  const fabricRow = pkg.specsTable.find((r) => r.label.includes('الخامة'));
  assert.equal(fabricRow?.verified, false);
  assert.equal(pkg.seo.buyingQueries.length, 5);
  assert.equal(pkg.seo.images.length, 3);
  assert.notEqual(pkg.seo.images[0].altAr, pkg.seo.images[1].altAr);
  assert.notEqual(pkg.seo.images[0].altEn, pkg.seo.images[1].altEn);
});

test('produces complete JSON-LD Product schema and distinct WebP filenames when verified facts exist', () => {
  const pkg = generateHybridProductPage({
    productNameAr: 'جزمة اسود للمناسبات سجنتشر فخامة',
    productNameEn: 'Signature Luxury Black Occasion Shoes',
    category: 'shoes',
    sku: 'Z.652101.5825415959',
    priceSar: 249,
    inStock: true,
    color: 'أسود',
    fabric: 'جلد طبيعي',
    availableSizes: ['41', '42', '43', '44', '45'],
    imageCount: 4,
  });

  assert.equal(pkg.unverifiedWarnings.length, 0);
  assert.equal(pkg.seo.images.length, 4);
  assert.ok(pkg.seo.images.every((img) => img.seoFilename.endsWith('.webp')));
  assert.equal(pkg.schemaJsonLd['@type'], 'Product');
  assert.equal(pkg.schemaJsonLd.sku, 'Z.652101.5825415959');
});
