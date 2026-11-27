import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_60_CHECKPOINTS, evaluateQualityGate } from '../src/core/quality-gate.ts';

test('contains exactly 60 checkpoints across 12 domains', () => {
  assert.equal(ALL_60_CHECKPOINTS.length, 60);
  const report = evaluateQualityGate([]);
  assert.equal(report.totalChecks, 60);
  assert.equal(report.domains.length, 12);
  assert.equal(report.masteryCriteria.length, 10);
});

test('refuses to mark a checkpoint as pass without evidence', () => {
  const report = evaluateQualityGate([
    { id: 'Q01-1', status: 'pass', evidence: '' },
    { id: 'Q01-2', status: 'pass', evidence: 'تم التحقق من فصل الفروع الثلاثة في identity.ts' },
  ]);

  const d1 = report.domains[0];
  assert.equal(d1.items[0].status, 'unverifiable');
  assert.equal(d1.items[1].status, 'pass');
  assert.equal(report.summary.pass, 1);
  assert.equal(report.summary.readyForDelivery, false);
});

test('blocks delivery when any checkpoint fails', () => {
  const report = evaluateQualityGate([
    { id: 'Q03-2', status: 'fail', evidence: 'لم يُحسب Break-even ROAS قبل رفع الميزانية' },
  ]);
  assert.equal(report.summary.fail, 1);
  assert.equal(report.summary.readyForDelivery, false);
  assert.equal(report.blockers.length, 1);
  assert.equal(report.blockers[0].id, 'Q03-2');
});
