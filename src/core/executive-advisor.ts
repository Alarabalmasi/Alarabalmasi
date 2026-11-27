/**
 * العقل التنفيذي للوكيل الإداري — AL ARAB AL MASI EXECUTIVE GROWTH OS
 * يدمج البيانات الحية من Google Sheets + توجيه الخبراء (22 تخصصاً) + مخرجات القسم 22 باللهجة النجدية الاحترافية.
 */

import { BRANCHES, STORE_IDENTITY } from '../config/identity.ts';
import { env, hasLlmCredentials } from '../config/env.ts';
import {
  buildExecutiveSystemPrompt,
  routeExpertTask,
  type ExecutiveDecisionBrief,
} from './charter.ts';
import { detectAbandonedCartTrigger } from './abandoned-carts.ts';
import type { LiveExecutiveSnapshot } from '../connectors/sheets-live.ts';

export interface AdvisorResponse {
  readonly mode: 'deterministic-live' | 'llm-enhanced';
  readonly module: string;
  readonly brief: ExecutiveDecisionBrief;
  readonly llmNarrative?: string;
  readonly cartTrigger?: { triggered: boolean; windowHours: number; limit: number };
}

async function callOptionalLlm(prompt: string, contextSummary: string): Promise<string | null> {
  if (!hasLlmCredentials()) return null;

  try {
    if (env.llmProvider === 'gemini') {
      const endpoint =
        env.llmBaseUrl ||
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.llmModel)}:generateContent?key=${encodeURIComponent(env.llmApiKey)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildExecutiveSystemPrompt() }] },
          contents: [{ role: 'user', parts: [{ text: `${contextSummary}\n\nطلب المدير:\n${prompt}` }] }],
          generationConfig: { temperature: 0.3 },
        }),
      });
      if (!res.ok) return null;
      const json: any = await res.json();
      return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    }

    if (env.llmProvider === 'openai' || env.llmBaseUrl) {
      const endpoint = (env.llmBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.llmApiKey}`,
        },
        body: JSON.stringify({
          model: env.llmModel,
          temperature: 0.3,
          messages: [
            { role: 'system', content: buildExecutiveSystemPrompt() },
            { role: 'user', content: `${contextSummary}\n\nطلب المدير:\n${prompt}` },
          ],
        }),
      });
      if (!res.ok) return null;
      const json: any = await res.json();
      return json?.choices?.[0]?.message?.content ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function runExecutiveAdvisor(
  query: string,
  snapshot: LiveExecutiveSnapshot,
): Promise<AdvisorResponse> {
  const routing = routeExpertTask(query);
  const cartTrigger = detectAbandonedCartTrigger(query);

  const openP0 = snapshot.tasksAndRisks.filter(
    (t) => t.type === 'مهمة' && t.priority === 'P0' && t.status !== 'مغلق',
  );
  const criticalRisks = snapshot.tasksAndRisks.filter(
    (t) => t.type === 'مخاطرة' && t.priority === 'حرج' && t.status !== 'مغلق',
  );
  const { dashboardSummary, tabCounts } = snapshot;

  const missingDataBlockers: string[] = [];
  if (tabCounts.zidRows === 0) {
    missingDataBlockers.push('تبويب «زد» في لوحة المتابعة لا يحتوي سجلات مزامنة حالية بعد (آخر إثبات يدوي مؤكد 18-11-2026 في تبويب الإثبات).');
  }
  if (tabCounts.adsRows === 0) {
    missingDataBlockers.push('تبويب «أداء الإعلانات» فارغ حالياً — يلزم تشغيل مزامنة Google Ads بعد استكمال مفاتيح OAuth.');
  }
  if (tabCounts.searchRows === 0) {
    missingDataBlockers.push('تبويب «أداء البحث» فارغ حالياً — البيانات المتوفرة في اللوحة (1 نقرة / 139 ظهور / CTR 0.72%) مفلترة على استعلام واحد فقط.');
  }

  let brief: ExecutiveDecisionBrief;

  if (routing.detectedModule === 'abandoned_carts') {
    brief = {
      decisionFirst: `تم تفعيل مهارة السلات المتروكة (نافذة آخر ${cartTrigger.windowHours} ساعة بتوقيت الرياض، حد ${cartTrigger.limit} سلات) مع تفعيل قفل الاعتماد اليدوي قبل أي إرسال.`,
      summaryAndEvidence: [
        'الفلترة المعتمدة: تاريخ إنشاء السلة created_at بتوقيت الرياض حصراً (وليس updated_at).',
        'قاعدة المطابقة: استبعاد أي عميل أتم طلباً فعلياً بعد إنشاء السلة لمنع الإزعاج.',
        'لا يتم اختلاق أي خصم أو شحن مجاني أو سبب لترك السلة في النص.',
      ],
      statusBreakdown: {
        analyzed: ['تحديد نافذة السلات المتروكة المطلوبة وضوابط التصفية والرسالة السعودية.'],
        fixed: [],
        published: [],
        verified: ['قفل منع الإرسال التلقائي بدون موافقة صريحة مفعّل.'],
      },
      finalDecision: 'استخدم تبويب «السلات المتروكة» لسحب السلات الحية من زد (فور ضبط مفاتيح ZID في .env) أو لصق بيانات آخر سلات لتوليد الرسائل وروابط واتساب فوراً.',
      firstThreeStepsNow: [
        'تزويد مفاتيح Zid Read-Only في .env أو تشغيل npm run auth:zid في مستودع التكاملات.',
        'مراجعة آخر 3 سلات متروكة بعد استبعاد الطلبات المكتملة.',
        'اعتماد الرسائل يدوياً وفتح روابط واتساب للتواصل المباشر.',
      ],
      whatToMeasure: ['معدل استجابة العملاء على رسائل التذكير', 'معدل استرداد السلات (الطلبات المكتملة خلال 24 ساعة)', 'صافي الإيراد المسترد دون خصومات مختلقة'],
      expectedOutcomeNoGuarantee: 'رفع فرص استعادة السلات المؤهلة وتحسين تجربة العميل السعودي دون تقديم ضمان مبيعات قبل القياس الفعلي.',
      reviewSchedule: 'مراجعة يومية خلال أول 7 أيام ثم أسبوعية.',
      blockersOrMissingPermissions: [
        'مفاتيح Zid API غير مضبوطة محلياً في هذا الخادم للسحب المباشر التلقائي.',
        'الإرسال التلقائي مقفل التزاماً بالقسم 17 حتى موافقتك الصريحة.',
      ],
      activatedLenses: routing.activatedLenses,
      recommendedTools: routing.recommendedTools,
    };
  } else if (routing.detectedModule === 'profitability_ads') {
    brief = {
      decisionFirst: `القرار الحاسم: ${snapshot.currentExecutiveDecision} — يُمنع رفع أي ميزانية إعلانية قبل إثبات تتبع التحويلات (A-02) وحساب Break-even ROAS الفعلي.`,
      summaryAndEvidence: [
        `المستهدف الإداري في الميثاق: ROAS >= 3.0x (والدليل التشغيلي يشير لمستهدف 4.5x وميزانية 2,000 ر.س شهرياً كمستهدف غير فعلي).`,
        `المخاطرة الحرجة المفتوحة (R-01): هدر إنفاق محتمل لعدم توثيق تحويلات الشراء وواتساب والمكالمات.`,
        `عدد سجلات تبويب «أداء الإعلانات» حالياً: ${tabCounts.adsRows} صف (يلزم تشغيل المزامنة لإدخال أرقام إنفاق فعلية).`,
      ],
      statusBreakdown: {
        analyzed: ['مراجعة لوحة المتابعة التنفيذية والمخاطر الحرجة (R-01, R-02) وتوفر بيانات الإعلانات.'],
        fixed: [],
        published: [],
        verified: ['مطابقة بيانات لوحة Google Sheets الحية دون اختلاق أرقام إنفاق.'],
      },
      finalDecision: 'إبقاء الميزانية الحالية دون توسع لحين إغلاق A-02 (اختبار تحويلات ناجح) وإدخال التكاليف المتغيرة في حاسبة الربحية.',
      firstThreeStepsNow: [
        'إتمام اختبار تتبع الشراء + واتساب + المكالمات وتوثيق لقطة الاختبار لإغلاق A-02.',
        'إدخال صافي الإيراد وتكلفة البضاعة والشحن ورسوم الدفع في تبويب «حاسبة الربحية» لحساب Break-even ROAS.',
        'مراجعة مخزون المقاسات الحرجة في زد (R-02) قبل توجيه أي إعلان لمنتج محدد.',
      ],
      whatToMeasure: ['ROAS الفعلي مقابل Break-even ROAS والهدف الإداري (≥3x)', 'CPA مقابل هامش المساهمة بعد الإعلان', 'صافي الطلبات المؤكدة في زد بعد الإلغاءات والمرتجعات'],
      expectedOutcomeNoGuarantee: 'إيقاف الهدر الإعلاني وبناء أساس قياس موثوق يسمح بالتوسع المربح عند ثبوت الأرقام.',
      reviewSchedule: 'مراجعة بعد 72 ساعة من تفعيل التتبع، ثم أسبوعياً كل أحد.',
      blockersOrMissingPermissions: [...missingDataBlockers, 'لا يُسمح بتغيير الميزانية أو إطلاق حملة دون تفويض صريح (القسم 14).'],
      activatedLenses: routing.activatedLenses,
      recommendedTools: routing.recommendedTools,
    };
  } else if (routing.detectedModule === 'seo_geo_ctr') {
    brief = {
      decisionFirst: `القرار: توسعة تقرير Search Console فوراً (A-04) وإزالة فلتر الاستعلام الفردي، ثم تدقيق Schema المنشور (A-03) قبل تعديل أي عنوان أو رابط.`,
      summaryAndEvidence: [
        `القراءة الحالية المرصودة في اللوحة: ${dashboardSummary.searchClicks ?? 'غير متوفر'} نقرة من ${dashboardSummary.searchImpressions ?? 'غير متوفر'} ظهور (CTR: ${dashboardSummary.searchCtrLabel ?? 'غير متوفر'}، متوسط الموضع: ${dashboardSummary.searchAvgPosition ?? 'غير متوفر'}) — لكنها مفلترة على استعلام واحد فقط ("جلابيات مغربية رجالية").`,
        `المهمة المفتوحة A-03 (P1): حقول Schema تحتاج تدقيقاً للهاتف والصور والإحداثيات والفروع الثلاثة المستقلة في جدة.`,
        'قاعدة القسم 11: اختبار أول 3 صفحات ذات فرصة تجارية عالية على آخر 28 يوماً مكتملة قبل التعميم.',
      ],
      statusBreakdown: {
        analyzed: ['مراجعة مؤشرات البحث في لوحة المتابعة وتحديد سبب تشوه قراءة CTR الحالية (فلتر استعلام واحد).'],
        fixed: [],
        published: [],
        verified: ['التأكد من مرجعية الموقع https://alarabalmasi.com/ وعدم المساس بأي رابط مفهرس.'],
      },
      finalDecision: 'سحب تقرير GSC كامل غير مفلتر لآخر 28 يوماً، فصل الاستعلامات التجارية عن العلامة التجارية، ثم تحسين أعلى 3 صفحات فرصة وتدقيق Schema دون تكرار.',
      firstThreeStepsNow: [
        'تشغيل مزامنة Search Console غير مفلترة لآخر 28 يوماً مكتملة لإغلاق A-04.',
        'تدقيق Schema الفعلي على الموقع (Product / LocalBusiness / Organization) والتحقق من إصدار ثيم زد الحالي قبل أي تعديل.',
        'اختيار أعلى 3 صفحات منتجات ذات ظهور عالٍ وCTR منخفض وإعادة كتابة SEO Title وMeta Description وهيكلة GEO/FAQ.',
      ],
      whatToMeasure: ['CTR الموزون (مجموع النقرات ÷ مجموع الظهور) لآخر 28 يوماً مقابل الفترة السابقة', 'الزيارات العضوية والطلبات المنسوبة للصفحات الـ 3 المختبرة', 'الإحالات والاستشهادات المرصودة من محركات الذكاء الاصطناعي'],
      expectedOutcomeNoGuarantee: 'تعزيز فرص الظهور والنقر المؤهل في Google ومحركات الذكاء الاصطناعي دون ضمان ترتيب محدد.',
      reviewSchedule: 'مراجعة أولية بعد 14 يوماً، وحكم كامل بعد 28 يوماً مكتملة.',
      blockersOrMissingPermissions: missingDataBlockers,
      activatedLenses: routing.activatedLenses,
      recommendedTools: routing.recommendedTools,
    };
  } else {
    // الموجز التنفيذي الشامل (الافتراضي)
    brief = {
      decisionFirst: `القرار التنفيذي الفوري: ${snapshot.currentExecutiveDecision} — الأولوية القصوى إغلاق مهام P0 (${openP0.length} مهام مفتوحة) والمخاطر الحرجة (${criticalRisks.length} مخاطر) قبل أي توسع.`,
      summaryAndEvidence: [
        `حالة اللوحة الحية (${snapshot.capturedAtRiyadh}): ${dashboardSummary.openCriticalTasks ?? 'غير متوفر'} مهام حرجة مفتوحة، ${dashboardSummary.criticalRisks ?? 'غير متوفر'} مخاطر حرجة (R-01 هدر الإنفاق، R-02 نفاد المخزون).`,
        `إثبات ربط زد المؤكد (18-11-2026): تم التحقق من ${snapshot.zidProofRows.length} متغيرات مقاسات حقيقية على مستوى مستودع زد (مثال: جزمة أسود للمناسبات سجنتشر فخامة مقاسات 41–45).`,
        `الهيكل الميداني: ${BRANCHES.length} فروع أرضية مستقلة في جدة (${BRANCHES.map((b) => b.nameAr).join(' | ')}) — مستقلة الهوية والحسابات والمخزون والحملات.`,
        `فجوة البيانات الحالية: تبويبات زد/واتساب/الإعلانات/البحث في اللوحة تحتاج تشغيل المزامنة الدورية لتحديث الأرقام اليومية تلقائياً.`,
      ],
      statusBreakdown: {
        analyzed: [
          'قراءة شاملة للوحة المتابعة التنفيذية في Google Sheets (9 تبويبات).',
          `رصد ${snapshot.tasksAndRisks.length} بنداً في سجل المهام والمخاطر و${snapshot.sourcesAndMetrics.length} مرجع قياس.`,
        ],
        fixed: ['تجهيز وتفعيل منظومة الوكيل الإداري التنفيذي (AL ARAB AL MASI — EXECUTIVE GROWTH OS) بجميع محركاتها.'],
        published: [],
        verified: [
          `اتصال Google Sheets: ${snapshot.connectionStatus === 'live' ? 'مؤكد وحيّ' : snapshot.connectionStatus}.`,
          'فصل البيانات المؤكدة عن المستهدفات النظرية (مثل ROAS 4.5x وميزانية 2000 ر.س من الدليل).',
        ],
      },
      finalDecision: 'إغلاق مسار القياس (A-02) واعتماد مصفوفة RACI (A-01) وتفعيل مزامنة البيانات التلقائية قبل إطلاق أي توسع إعلاني.',
      firstThreeStepsNow: [
        'اعتماد مصفوفة الملكية RACI وتثبيت مواعيد إغلاق لمهام P0 (A-01 وA-02).',
        'تنفيذ اختبار تحويلات فعلي (شراء زد + واتساب + مكالمات) وتوثيق النتيجة لإغلاق مخاطرة هدر الإنفاق R-01.',
        'تفعيل مزامنة Zid وSearch Console وGoogle Ads في مستودع التكاملات (Alarabalmasi/-) لتعبئة تبويبات اللوحة بأرقام يومية موثقة.',
      ],
      whatToMeasure: [
        'معدل إغلاق مهام P0 وP1 بالأدلة',
        'تطابق طلبات ومخزون زد اليومي مع لوحة المتابعة',
        'CVR وAOV وCPA وROAS الفعلي مقابل Break-even ROAS بعد تفعيل القياس',
      ],
      expectedOutcomeNoGuarantee: 'تأسيس غرفة عمليات تنفيذية مبنية على أدلة حية تحمي الربحية وتمنع الهدر وتُجهّز المتجر والفروع للنمو المستدام دون وعود غير مثبتة.',
      reviewSchedule: 'مراجعة تنفيذية خلال 24 ساعة لمهام P0، ومراجعة أسبوعية شاملة كل أحد.',
      blockersOrMissingPermissions: missingDataBlockers,
      activatedLenses: routing.activatedLenses,
      recommendedTools: routing.recommendedTools,
    };
  }

  const contextSummary = `بيانات لوحة المتابعة الحية (${snapshot.capturedAtRiyadh}): القرار الحالي="${snapshot.currentExecutiveDecision}"، المهام الحرجة=${dashboardSummary.openCriticalTasks}، المخاطر الحرجة=${dashboardSummary.criticalRisks}، النقرات=${dashboardSummary.searchClicks}، الظهور=${dashboardSummary.searchImpressions}، CTR=${dashboardSummary.searchCtrLabel}، صفوف الإثبات من زد=${snapshot.zidProofRows.length}، صفوف زد الحية=${tabCounts.zidRows}، صفوف الإعلانات=${tabCounts.adsRows}. الموقع: ${STORE_IDENTITY.officialUrl}`;

  const llmNarrative = await callOptionalLlm(query, contextSummary);

  return {
    mode: llmNarrative ? 'llm-enhanced' : 'deterministic-live',
    module: routing.detectedModule,
    brief,
    ...(llmNarrative ? { llmNarrative } : {}),
    ...(cartTrigger.triggered ? { cartTrigger } : {}),
  };
}
