/**
 * واجهة سطر الأوامر التنفيذية — AL ARAB AL MASI EXECUTIVE GROWTH OS
 * الأوامر:
 *   npm run exec:brief                 — موجز تنفيذي حي من لوحة المتابعة
 *   npm run exec -- ask "<سؤالك>"       — توجيه أي سؤال/مهمة للوكيل الإداري
 *   npm run exec:carts                 — فحص السلات المتروكة (القسم 17)
 *   npm run exec:gate                  — عرض ملخص بوابة الجودة من 60 زاوية
 *   npm run exec -- tools              — فحص حالة الأدوات المتصلة في البيئة
 */

import { fetchLiveExecutiveSnapshot } from '../connectors/sheets-live.ts';
import { fetchLiveZidAbandonedCarts } from '../connectors/zid-carts.ts';
import { inspectConnectedTools } from '../connectors/workspace.ts';
import { prepareAbandonedCartReminders } from '../core/abandoned-carts.ts';
import { runExecutiveAdvisor } from '../core/executive-advisor.ts';
import { ALL_60_CHECKPOINTS, evaluateQualityGate } from '../core/quality-gate.ts';

const [command = 'brief', ...rest] = process.argv.slice(2);

if (command === 'tools') {
  const tools = await inspectConnectedTools();
  console.log('\n=== حالة الأدوات والتكاملات المتصلة ===\n');
  for (const t of tools) {
    console.log(`[${t.connected ? 'متصل' : 'غير متصل'}] ${t.name} — ${t.detail}`);
  }
  process.exit(0);
}

if (command === 'gate') {
  const report = evaluateQualityGate([]);
  console.log(`\n=== بوابة الجودة من ${ALL_60_CHECKPOINTS.length} زاوية تخصصية (12 مجالاً × 5 نقاط) ===`);
  console.log(`الحكم الافتراضي قبل إرفاق الأدلة: ${report.summary.verdictAr}\n`);
  for (const d of report.domains) {
    console.log(`${d.id}. ${d.title} (${d.items.length} نقاط تحقق)`);
  }
  process.exit(0);
}

if (command === 'carts') {
  const zid = await fetchLiveZidAbandonedCarts();
  console.log(`\n=== مهارة السلات المتروكة (القسم 17) ===`);
  console.log(`مصدر البيانات: ${zid.source} — ${zid.messageAr}`);
  if (zid.carts.length > 0) {
    const result = prepareAbandonedCartReminders({
      carts: zid.carts,
      completedOrders: zid.completedOrders,
      windowHours: 24,
      limit: 3,
    });
    console.log(result.noticeAr);
    for (const draft of result.drafts) {
      console.log('\n-----------------------------------------');
      console.log(`العميل: ${draft.customerName} | السلة: ${draft.cartId} | وقت الإنشاء: ${draft.createdAtRiyadh}`);
      console.log(draft.messageText);
      console.log(`للنسخ: ${draft.rawPhoneForCopy}`);
      if (draft.whatsappUrl) console.log(`واتساب: ${draft.whatsappUrl}`);
    }
  }
  process.exit(0);
}

const query =
  command === 'ask' && rest.length > 0
    ? rest.join(' ')
    : 'أعطني الموجز التنفيذي الفوري وأهم أولويات العرب الماسي اليوم بناءً على البيانات الحية';

const snapshot = await fetchLiveExecutiveSnapshot(true);
const response = await runExecutiveAdvisor(query, snapshot);
const b = response.brief;

console.log('\n======================================================');
console.log('AL ARAB AL MASI — EXECUTIVE GROWTH OS');
console.log('======================================================\n');
console.log(`القرار أولاً:\n${b.decisionFirst}\n`);
console.log('الأدلة والنتائج:');
for (const item of b.summaryAndEvidence) console.log(`- ${item}`);
console.log(`\nالقرار النهائي:\n${b.finalDecision}\n`);
console.log('أول ثلاث خطوات الآن:');
b.firstThreeStepsNow.forEach((s, idx) => console.log(`${idx + 1}. ${s}`));
console.log('\nما يجب قياسه:');
for (const m of b.whatToMeasure) console.log(`- ${m}`);
console.log(`\nالنتيجة المتوقعة دون ضمان:\n${b.expectedOutcomeNoGuarantee}`);
console.log(`\nموعد المراجعة:\n${b.reviewSchedule}`);
if (b.blockersOrMissingPermissions.length > 0) {
  console.log('\nالعوائق أو الصلاحيات الناقصة:');
  for (const c of b.blockersOrMissingPermissions) console.log(`- ${c}`);
}
console.log('');
