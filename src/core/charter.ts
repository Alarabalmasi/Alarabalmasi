/**
 * ميثاق منظومة العرب الماسي التنفيذية (AL ARAB AL MASI — EXECUTIVE GROWTH OS)
 * وموجّه الخبراء التلقائي (القسم 3 و22)
 */

import { BRANCHES, EXECUTIVE_OS_VERSION, EXPERT_LENSES, STORE_IDENTITY } from '../config/identity.ts';

export interface ExpertRoutingResult {
  readonly activatedLenses: string[];
  readonly recommendedTools: string[];
  readonly detectedModule:
    | 'abandoned_carts'
    | 'profitability_ads'
    | 'seo_geo_ctr'
    | 'product_writer'
    | 'inventory_branches'
    | 'executive_brief'
    | 'quality_gate'
    | 'cinema_creative';
  readonly needsApprovalGuard: boolean;
}

export interface ExecutiveDecisionBrief {
  readonly decisionFirst: string;
  readonly summaryAndEvidence: string[];
  readonly statusBreakdown: {
    readonly analyzed: string[];
    readonly fixed: string[];
    readonly published: string[];
    readonly verified: string[];
  };
  readonly finalDecision: string;
  readonly firstThreeStepsNow: [string, string, string];
  readonly whatToMeasure: string[];
  readonly expectedOutcomeNoGuarantee: string;
  readonly reviewSchedule: string;
  readonly blockersOrMissingPermissions: string[];
  readonly activatedLenses: string[];
  readonly recommendedTools: string[];
}

export function routeExpertTask(query: string): ExpertRoutingResult {
  const q = query.toLowerCase();

  if (/سلات|سلة|السلات المتروكة|تذكير السلات|ذكّر العملاء|ذكر العملاء/.test(q)) {
    return {
      detectedModule: 'abandoned_carts',
      activatedLenses: [
        'خدمة العملاء واسترجاع السلات المتروكة',
        'التجارة الإلكترونية ومنصة زد',
        'علم نفس المستهلك السعودي',
        'الربحية والحوكمة ومراقبة الجودة',
      ],
      recommendedTools: ['Zid (قراءة السلات والطلبات)', 'WhatsApp (مسودات بانتظار الاعتماد)'],
      needsApprovalGuard: true,
    };
  }

  if (/وصف منتج|صفحة منتج|ثوب|جلابية|حذاء|جزمة|شماغ|alt|faq|هجين/.test(q)) {
    return {
      detectedModule: 'product_writer',
      activatedLenses: [
        'كتابة المحتوى التجاري والإقناعي',
        'SEO التقني والتجاري',
        'GEO وAEO ومحركات الذكاء الاصطناعي',
        'تحسين معدل التحويل CRO',
        'علم نفس المستهلك السعودي',
      ],
      recommendedTools: ['Zid (المواصفات والمخزون)', 'Google Search Console', 'Google Merchant Center'],
      needsApprovalGuard: false,
    };
  }

  if (/roas|cpa|cac|cvr|aov|ربحية|هامش|ميزانية|إعلان|اعلان|حملة|حملات|سناب|تيك توك|ميتا|google ads/.test(q)) {
    return {
      detectedModule: 'profitability_ads',
      activatedLenses: [
        'الربحية والحوكمة ومراقبة الجودة',
        'تحليل البيانات والإسناد التسويقي',
        'Google Ads',
        'Snapchat Ads',
        'TikTok Ads',
        'Meta Ads',
        'تحسين معدل النقر CTR',
      ],
      recommendedTools: ['Google Sheets التنفيذي', 'Zid (الطلبات الفعلية)', 'Google Ads / Windsor.ai'],
      needsApprovalGuard: true,
    };
  }

  if (/seo|geo|aeo|gsc|search console|ctr|schema|فهرسة|كلمات مفتاحية|بحث|تصدر|خرائط/.test(q)) {
    return {
      detectedModule: 'seo_geo_ctr',
      activatedLenses: [
        'SEO التقني والتجاري',
        'GEO وAEO ومحركات الذكاء الاصطناعي',
        'Local SEO وخرائط Google',
        'تحسين معدل النقر CTR',
        'البرمجة وتحسين سرعة المتجر',
      ],
      recommendedTools: ['Google Search Console', 'Google Sheets التنفيذي', 'GitHub / فحص القالب'],
      needsApprovalGuard: false,
    };
  }

  if (/مخزون|مقاس|فرع|السالم|الدفة|المرجان|السامر|merchant|gmc/.test(q)) {
    return {
      detectedModule: 'inventory_branches',
      activatedLenses: [
        'إدارة المنتجات والمخزون',
        'التجارة الإلكترونية ومنصة زد',
        'Google Merchant Center',
        'Local SEO وخرائط Google',
      ],
      recommendedTools: ['Zid (مخزون المتغيرات)', 'Google Merchant Center', 'Google Sheets التنفيذي'],
      needsApprovalGuard: false,
    };
  }

  if (/فيديو|سينمائي|برومبت|veo|gemini|مونتاج|تصميم|إخراج|اخراج/.test(q)) {
    return {
      detectedModule: 'cinema_creative',
      activatedLenses: [
        'التصميم والمونتاج والإخراج السينمائي',
        'الاقتصاد السلوكي والتسويق العاطفي',
        'علم نفس المستهلك السعودي',
        'تحسين معدل النقر CTR',
      ],
      recommendedTools: ['الأصول الأصلية للمنتج', 'Canva / Adobe', 'Gemini / Veo Prompts'],
      needsApprovalGuard: false,
    };
  }

  if (/جودة|60|ستين|بوابة|مراجعة|تدقيق|حوكمة/.test(q)) {
    return {
      detectedModule: 'quality_gate',
      activatedLenses: [
        'الربحية والحوكمة ومراقبة الجودة',
        'الإدارة التنفيذية والتخطيط الاستراتيجي',
        'تحليل البيانات والإسناد التسويقي',
      ],
      recommendedTools: ['بوابة الجودة من 60 زاوية', 'Google Sheets التنفيذي'],
      needsApprovalGuard: false,
    };
  }

  return {
    detectedModule: 'executive_brief',
    activatedLenses: [
      'الإدارة التنفيذية والتخطيط الاستراتيجي',
      'الربحية والحوكمة ومراقبة الجودة',
      'تحليل البيانات والإسناد التسويقي',
      'التجارة الإلكترونية ومنصة زد',
    ],
    recommendedTools: ['Google Sheets التنفيذي', 'Google Drive / Docs', 'Zid', 'Google Search Console'],
    needsApprovalGuard: false,
  };
}

export function buildExecutiveSystemPrompt(): string {
  const branchesText = BRANCHES.map((b) => `- ${b.nameAr} — ${b.addressAr}.`).join('\n');
  return [
    `# AL ARAB AL MASI — EXECUTIVE GROWTH OS (${EXECUTIVE_OS_VERSION})`,
    `أنت المدير العام التنفيذي ومدير النمو والتطوير والتجارة الإلكترونية والتسويق الرقمي لمتجر ${STORE_IDENTITY.brandAr} (${STORE_IDENTITY.brandEn}) وفروعه الأرضية في ${STORE_IDENTITY.market}.`,
    `الموقع الرسمي: ${STORE_IDENTITY.officialUrl} | المنصة: ${STORE_IDENTITY.platform} | الثيم المرجعي: ${STORE_IDENTITY.referenceTheme} (مع التحقق من الإصدار الحالي قبل التعديلات التقنية).`,
    `الفروع الأرضية المستقلة (حافظ على استقلال هوية وحسابات ومخزون وحملات كل فرع):\n${branchesText}`,
    `تعمل بعقلية لجنة افتراضية متعددة التخصصات (${EXPERT_LENSES.length} تخصصاً رئيسياً و60 زاوية جودة) دون عرض النقاش الداخلي للمستخدم؛ قدّم القرار التنفيذي أولاً ثم النتائج والأدلة بلهجة سعودية نجدية مبسطة واحترافية عالية.`,
    `القواعد الصارمة: لا تختلق أرقاماً أو مواصفات أو خصومات؛ لا تعتبر البيانات الناقصة صفراً؛ لا تغيّر ميزانية أو ترسل رسائل عملاء تلقائياً دون موافقة صريحة؛ لا تضمن ترتيباً أو مبيعات دون أدلة فعلية؛ ميّز بين ما تم تحليله وما تم إصلاحه وما تم نشره وما تم التحقق منه.`,
    `اختم المهام التنفيذية بـ: القرار النهائي، أول ثلاث خطوات الآن، ما يجب قياسه، النتيجة المتوقعة دون ضمان، موعد المراجعة، والعوائق أو الصلاحيات الناقصة.`,
  ].join('\n\n');
}
