import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProfitability } from '../src/core/profitability.ts';

test('missing data remains null and never defaults to zero', () => {
  const report = evaluateProfitability({ adSpend: 1000 });
  assert.equal(report.kpis.cvr.value, null);
  assert.equal(report.kpis.cvr.status, 'missing_data');
  assert.equal(report.kpis.roas.value, null);
  assert.equal(report.kpis.breakEvenRoas.value, null);
  assert.equal(report.assessment.scalingAllowed, false);
});

test('calculates CVR, AOV, CPA, CAC, ROAS, CTR, Contribution Margin, and Break-even ROAS accurately', () => {
  const report = evaluateProfitability({
    orders: 50,
    sessions: 2500,
    netOrderRevenue: 10000,
    adSpend: 2000,
    attributedOrders: 40,
    attributedRevenue: 8000,
    acquisitionCost: 2400,
    newCustomers: 30,
    clicks: 250,
    impressions: 10000,
    cogs: 4000,
    shippingCost: 600,
    paymentFees: 400,
    adminRoasTarget: 3.0,
  });

  assert.equal(report.kpis.cvr.value, 2);
  assert.equal(report.kpis.aov.value, 200);
  assert.equal(report.kpis.cpa.value, 50);
  assert.equal(report.kpis.cac.value, 80);
  assert.equal(report.kpis.roas.value, 4);
  assert.equal(report.kpis.ctr.value, 2.5);
  assert.equal(report.kpis.contributionMarginBeforeAds.value, 5000);
  assert.equal(report.kpis.contributionMarginPctBeforeAds.value, 50);
  assert.equal(report.kpis.contributionMarginAfterAds.value, 3000);
  assert.equal(report.kpis.breakEvenRoas.value, 2);
  assert.equal(report.assessment.scalingAllowed, true);
});

test('blocks scaling when ROAS meets 3x target but is below break-even ROAS', () => {
  const report = evaluateProfitability({
    netOrderRevenue: 10000,
    cogs: 7500,
    shippingCost: 0,
    paymentFees: 0,
    adSpend: 2000,
    attributedRevenue: 6400, // ROAS = 3.2x, but break-even ROAS = 1 / 0.25 = 4.0x
    adminRoasTarget: 3.0,
  });

  assert.equal(report.kpis.roas.value, 3.2);
  assert.equal(report.kpis.breakEvenRoas.value, 4);
  assert.equal(report.assessment.meetsAdminRoasTarget, true);
  assert.equal(report.assessment.aboveBreakEvenRoas, false);
  assert.equal(report.assessment.scalingAllowed, false);
});
