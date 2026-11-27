/**
 * محرك تحليل البيانات والربحية — القسم 11 و15 من منظومة العرب الماسي
 * قاعدة صارمة: البيانات الناقصة تبقى null ولا تُعامل كصفر أبداً.
 */

export type MetricStatus = 'calculated' | 'missing_data' | 'zero_denominator';

export interface MetricResult {
  readonly value: number | null;
  readonly formatted: string;
  readonly status: MetricStatus;
  readonly formula: string;
  readonly note?: string;
}

export interface ProfitabilityInput {
  orders?: number | null;
  sessions?: number | null;
  netOrderRevenue?: number | null; // صافي إيرادات الطلبات بعد الخصومات والمرتجعات والإلغاءات
  adSpend?: number | null;
  attributedOrders?: number | null;
  attributedRevenue?: number | null;
  acquisitionCost?: number | null; // تكلفة اكتساب العملاء الإجمالية
  newCustomers?: number | null;
  clicks?: number | null;
  impressions?: number | null;
  // التكاليف المتغيرة قبل الإعلان (لحساب هامش المساهمة ونقطة التعادل)
  cogs?: number | null; // تكلفة البضاعة
  shippingCost?: number | null;
  paymentFees?: number | null;
  otherVariableCosts?: number | null;
  adminRoasTarget?: number; // الهدف الإداري (افتراضياً 3.0)
}

export interface ProfitabilityReport {
  readonly kpis: {
    readonly cvr: MetricResult;
    readonly aov: MetricResult;
    readonly cpa: MetricResult;
    readonly cac: MetricResult;
    readonly roas: MetricResult;
    readonly ctr: MetricResult;
    readonly contributionMarginBeforeAds: MetricResult;
    readonly contributionMarginPctBeforeAds: MetricResult;
    readonly contributionMarginAfterAds: MetricResult;
    readonly breakEvenRoas: MetricResult;
  };
  readonly assessment: {
    readonly adminRoasTarget: number;
    readonly meetsAdminRoasTarget: boolean | null;
    readonly aboveBreakEvenRoas: boolean | null;
    readonly scalingAllowed: boolean;
    readonly verdictAr: string;
    readonly warnings: string[];
  };
}

function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function round(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function ratioMetric(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  formula: string,
  multiplier: number,
  suffix: string,
  decimals = 2,
): MetricResult {
  if (!isValidNumber(numerator) || !isValidNumber(denominator)) {
    return {
      value: null,
      formatted: 'غير متوفر (بيانات ناقصة)',
      status: 'missing_data',
      formula,
    };
  }
  if (denominator <= 0) {
    return {
      value: null,
      formatted: 'متعذر الحساب (المقام = 0)',
      status: 'zero_denominator',
      formula,
    };
  }
  const value = round((numerator / denominator) * multiplier, decimals);
  return {
    value,
    formatted: `${value}${suffix}`,
    status: 'calculated',
    formula,
  };
}

export function evaluateProfitability(input: ProfitabilityInput): ProfitabilityReport {
  const adminRoasTarget = input.adminRoasTarget ?? 3.0;
  const warnings: string[] = [];

  const cvr = ratioMetric(input.orders, input.sessions, 'الطلبات ÷ الجلسات × 100', 100, '%');
  const aov = ratioMetric(input.netOrderRevenue, input.orders, 'صافي إيرادات الطلبات ÷ عدد الطلبات المطابقة', 1, ' ر.س');
  const cpa = ratioMetric(input.adSpend, input.attributedOrders, 'الإنفاق الإعلاني ÷ الطلبات المنسوبة', 1, ' ر.س');
  const cac = ratioMetric(input.acquisitionCost, input.newCustomers, 'تكلفة اكتساب العملاء ÷ العملاء الجدد', 1, ' ر.س');
  const roas = ratioMetric(input.attributedRevenue, input.adSpend, 'الإيراد المنسوب للإعلانات ÷ الإنفاق الإعلاني', 1, 'x');
  const ctr = ratioMetric(input.clicks, input.impressions, 'النقرات ÷ مرات الظهور × 100', 100, '%');

  // حساب هامش المساهمة قبل وبعد الإعلان دون اعتبار البيانات الناقصة صفراً
  let contributionMarginBeforeAds: MetricResult = {
    value: null,
    formatted: 'غير متوفر (يتطلب صافي الإيراد وتكلفة البضاعة على الأقل)',
    status: 'missing_data',
    formula: 'صافي الإيراد - (تكلفة البضاعة + الشحن + رسوم الدفع + التكاليف المتغيرة)',
  };
  let contributionMarginPctBeforeAds: MetricResult = {
    value: null,
    formatted: 'غير متوفر (بيانات ناقصة)',
    status: 'missing_data',
    formula: 'هامش المساهمة قبل الإعلان ÷ صافي الإيراد × 100',
  };
  let contributionMarginAfterAds: MetricResult = {
    value: null,
    formatted: 'غير متوفر (بيانات ناقصة)',
    status: 'missing_data',
    formula: 'هامش المساهمة قبل الإعلان - الإنفاق الإعلاني',
  };
  let breakEvenRoas: MetricResult = {
    value: null,
    formatted: 'غير متوفر (يتطلب نسبة هامش المساهمة قبل الإعلان)',
    status: 'missing_data',
    formula: '1 ÷ نسبة هامش المساهمة قبل الإعلان',
  };

  if (isValidNumber(input.netOrderRevenue) && isValidNumber(input.cogs)) {
    const missingOptionalCosts: string[] = [];
    if (!isValidNumber(input.shippingCost)) missingOptionalCosts.push('الشحن');
    if (!isValidNumber(input.paymentFees)) missingOptionalCosts.push('رسوم الدفع');
    if (missingOptionalCosts.length > 0) {
      warnings.push(
        `تنبيه دقة: لم تُدخل تكلفة (${missingOptionalCosts.join('، ')})؛ هامش المساهمة الحالي تقديري حتى استكمال كافة التكاليف المتغيرة.`,
      );
    }
    const variableCosts =
      input.cogs +
      (isValidNumber(input.shippingCost) ? input.shippingCost : 0) +
      (isValidNumber(input.paymentFees) ? input.paymentFees : 0) +
      (isValidNumber(input.otherVariableCosts) ? input.otherVariableCosts : 0);

    const cmBefore = round(input.netOrderRevenue - variableCosts, 2);
    contributionMarginBeforeAds = {
      value: cmBefore,
      formatted: `${cmBefore} ر.س`,
      status: 'calculated',
      formula: contributionMarginBeforeAds.formula,
      note: missingOptionalCosts.length ? 'تقديري لنقص بعض التكاليف المتغيرة' : 'مكتمل',
    };

    if (input.netOrderRevenue > 0) {
      const ratio = cmBefore / input.netOrderRevenue;
      const pct = round(ratio * 100, 2);
      contributionMarginPctBeforeAds = {
        value: pct,
        formatted: `${pct}%`,
        status: 'calculated',
        formula: contributionMarginPctBeforeAds.formula,
      };
      if (ratio > 0) {
        const beRoas = round(1 / ratio, 2);
        breakEvenRoas = {
          value: beRoas,
          formatted: `${beRoas}x`,
          status: 'calculated',
          formula: breakEvenRoas.formula,
        };
      } else {
        warnings.push('هامش المساهمة قبل الإعلان سالب أو يساوي صفراً — لا يمكن التوسع الإعلاني قبل إصلاح التسعير أو التكاليف.');
        breakEvenRoas = {
          value: null,
          formatted: 'غير مربح (هامش المساهمة ≤ 0)',
          status: 'zero_denominator',
          formula: breakEvenRoas.formula,
        };
      }
    }

    if (isValidNumber(input.adSpend)) {
      const cmAfter = round(cmBefore - input.adSpend, 2);
      contributionMarginAfterAds = {
        value: cmAfter,
        formatted: `${cmAfter} ر.س`,
        status: 'calculated',
        formula: contributionMarginAfterAds.formula,
      };
      if (cmAfter < 0) {
        warnings.push(`هامش المساهمة بعد الإعلان سالب (${cmAfter} ر.س) — الحملة تخسر فعلياً حتى لو ارتفعت النقرات أو الزيارات.`);
      }
    }
  } else {
    warnings.push('أدخل صافي الإيراد وتكلفة البضاعة الفعلية لحساب هامش المساهمة ونقطة التعادل (Break-even ROAS).');
  }

  const meetsAdminRoasTarget = roas.value !== null ? roas.value >= adminRoasTarget : null;
  const aboveBreakEvenRoas =
    roas.value !== null && breakEvenRoas.value !== null ? roas.value >= breakEvenRoas.value : null;

  let scalingAllowed = false;
  let verdictAr = 'لا يُسمح بزيادة الميزانية حالياً لعدم توفر قياس مكتمل لـ ROAS وهامش المساهمة.';

  if (roas.value === null) {
    warnings.push('لم يتوفر قياس ROAS مؤكد (الإنفاق والإيراد المنسوب المطابق لطلبات زد).');
  } else if (aboveBreakEvenRoas === false) {
    verdictAr = `إيقاف التوسع فوراً: ROAS الفعلي (${roas.value}x) أقل من نقطة التعادل (${breakEvenRoas.value}x). شخّص التتبع والعرض والإبداع وصفحة الهبوط أولاً.`;
  } else if (meetsAdminRoasTarget === false) {
    verdictAr = `عدم التوسع: ROAS الفعلي (${roas.value}x) دون الهدف الإداري (${adminRoasTarget}x). حسّن الاستهداف والصفحة قبل ضخ أي ميزانية إضافية.`;
  } else if (meetsAdminRoasTarget === true && aboveBreakEvenRoas === true) {
    scalingAllowed = true;
    verdictAr = `مؤهل للتوسع المنضبط: ROAS الفعلي (${roas.value}x) يتجاوز الهدف الإداري (${adminRoasTarget}x) ونقطة التعادل (${breakEvenRoas.value}x) بهامش مساهمة موجب — بشرط التفويض الصريح وتوفر مخزون المقاسات.`;
  } else if (meetsAdminRoasTarget === true && aboveBreakEvenRoas === null) {
    verdictAr = `ROAS الفعلي (${roas.value}x) يحقق الهدف الإداري (${adminRoasTarget}x)، لكن نقطة التعادل غير محسوبة لنقص بيانات التكلفة — استكمل التكاليف المتغيرة قبل التوسع.`;
  }

  return {
    kpis: {
      cvr,
      aov,
      cpa,
      cac,
      roas,
      ctr,
      contributionMarginBeforeAds,
      contributionMarginPctBeforeAds,
      contributionMarginAfterAds,
      breakEvenRoas,
    },
    assessment: {
      adminRoasTarget,
      meetsAdminRoasTarget,
      aboveBreakEvenRoas,
      scalingAllowed,
      verdictAr,
      warnings,
    },
  };
}
