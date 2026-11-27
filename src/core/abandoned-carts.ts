/**
 * مهارة السلات المتروكة التلقائية — القسم 17 من منظومة العرب الماسي
 * القواعد الإلزامية:
 * 1. الاعتماد على وقت إنشاء السلة created_at بتوقيت الرياض (Asia/Riyadh)، وليس updated_at.
 * 2. التحقق من عدم إتمام العميل للطلب بالفعل.
 * 3. عدم الإرسال التلقائي دون موافقة صريحة.
 * 4. عدم اختلاق خصم أو شحن مجاني أو سبب لترك السلة.
 */

export interface AbandonedCartRecord {
  readonly cartId: string;
  readonly createdAt: string; // ISO string — الحقل المعتمد وحده للتصفية
  readonly updatedAt?: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly productName: string;
  readonly size?: string | null;
  readonly checkoutUrl: string;
  readonly cartTotal?: number | null;
  readonly currency?: string;
}

export interface CompletedOrderRef {
  readonly orderId: string;
  readonly customerPhone?: string | null;
  readonly createdAt: string;
  readonly status: string;
}

export interface CartReminderDraft {
  readonly cartId: string;
  readonly createdAtRiyadh: string;
  readonly ageHours: number;
  readonly customerName: string;
  readonly productName: string;
  readonly sizeLabel: string;
  readonly checkoutUrl: string;
  readonly rawPhoneForCopy: string;
  readonly whatsappUrl: string | null;
  readonly messageText: string;
  readonly approvalRequired: true;
}

export interface AbandonedCartRunResult {
  readonly triggered: boolean;
  readonly windowHours: number;
  readonly limit: number;
  readonly evaluatedAtRiyadh: string;
  readonly totalInputCarts: number;
  readonly excludedCompletedOrders: number;
  readonly excludedOutOfWindow: number;
  readonly drafts: CartReminderDraft[];
  readonly noticeAr: string;
}

const TRIGGER_PATTERNS = [
  'السلات المتروكة',
  'سلات متروكة',
  'تذكير السلات',
  'ذكّر العملاء',
  'ذكر العملاء',
  'سلات 6 ساعات',
  'سلات 12 ساعة',
  'سلات 24 ساعة',
];

export function detectAbandonedCartTrigger(input: string): {
  triggered: boolean;
  windowHours: number;
  limit: number;
} {
  const normalized = input.trim();
  const triggered = TRIGGER_PATTERNS.some((p) => normalized.includes(p));

  let windowHours = 24;
  const hourMatch = normalized.match(/(\d+)\s*(?:ساعات|ساعة|ساعه)/);
  if (hourMatch) {
    const parsed = Number(hourMatch[1]);
    if (parsed > 0 && parsed <= 720) windowHours = parsed;
  }

  let limit = 3;
  const limitMatch = normalized.match(/(?:آخر|اخر|أحدث)\s*(\d+)/);
  if (limitMatch) {
    const parsed = Number(limitMatch[1]);
    if (parsed > 0 && parsed <= 50) limit = parsed;
  }

  return { triggered, windowHours, limit };
}

export function normalizeSaudiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00966')) return digits.slice(2);
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('05') && digits.length === 10) return `966${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `966${digits}`;
  return digits;
}

export function formatRiyadhDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', '') + ' (توقيت الرياض)';
}

function buildSaudiCartMessage(cart: AbandonedCartRecord): string {
  const firstName = cart.customerName.trim().split(/\s+/)[0] || 'عميلنا الكريم';
  const sizePart = cart.size && cart.size.trim() ? ` (مقاس ${cart.size.trim()})` : '';

  // رسالة شخصية قصيرة باللهجة السعودية العامية بلا اختلاق خصم أو شحن مجاني أو سبب ترك السلة
  return [
    `حياك الله يا ${firstName}، معك فريق متجر العرب الماسي.`,
    `شفنا إنك أضفت «${cart.productName.trim()}»${sizePart} في السلة.`,
    `حبيت أطمنك، هل واجهتك أي مشكلة في إتمام الطلب أو تحتاج مساعدة بخصوص المقاس أو التوصيل؟`,
    `أبشر بالمساعدة في أي وقت، وهذا رابط إكمال طلبك مباشرة:`,
    cart.checkoutUrl.trim(),
  ].join('\n');
}

export function prepareAbandonedCartReminders(params: {
  carts: AbandonedCartRecord[];
  completedOrders?: CompletedOrderRef[];
  windowHours?: number;
  limit?: number;
  now?: Date;
}): AbandonedCartRunResult {
  const now = params.now ?? new Date();
  const windowHours = params.windowHours ?? 24;
  const limit = params.limit ?? 3;
  const completedOrders = params.completedOrders ?? [];

  // تجهيز خريطة الطلبات المكتملة/غير الملغاة حسب رقم الجوال وتوقيت الإنشاء
  const activeOrdersByPhone = new Map<string, number[]>();
  for (const order of completedOrders) {
    const statusLower = order.status.toLowerCase();
    if (['cancelled', 'canceled', 'refunded', 'failed', 'ملغي', 'ملغى'].includes(statusLower)) {
      continue;
    }
    const phone = normalizeSaudiPhone(order.customerPhone || '');
    const ts = Date.parse(order.createdAt);
    if (!phone || Number.isNaN(ts)) continue;
    const list = activeOrdersByPhone.get(phone) ?? [];
    list.push(ts);
    activeOrdersByPhone.set(phone, list);
  }

  const windowStartMs = now.getTime() - windowHours * 3600 * 1000;
  let excludedCompletedOrders = 0;
  let excludedOutOfWindow = 0;

  const eligible: Array<{ cart: AbandonedCartRecord; createdMs: number }> = [];

  for (const cart of params.carts) {
    // الاعتماد حصرياً على created_at وليس updated_at
    const createdMs = Date.parse(cart.createdAt);
    if (Number.isNaN(createdMs) || createdMs < windowStartMs || createdMs > now.getTime()) {
      excludedOutOfWindow++;
      continue;
    }

    const normalizedPhone = normalizeSaudiPhone(cart.customerPhone);
    const customerOrderTimes = normalizedPhone ? activeOrdersByPhone.get(normalizedPhone) ?? [] : [];
    // إذا أتم العميل طلباً عند أو بعد إنشاء السلة يُستبعد تلقائياً
    const alreadyOrdered = customerOrderTimes.some((orderMs) => orderMs >= createdMs);
    if (alreadyOrdered) {
      excludedCompletedOrders++;
      continue;
    }

    eligible.push({ cart, createdMs });
  }

  // ترتيب من الأحدث إلى الأقدم بناءً على created_at
  eligible.sort((a, b) => b.createdMs - a.createdMs);
  const selected = eligible.slice(0, limit);

  const drafts: CartReminderDraft[] = selected.map(({ cart, createdMs }) => {
    const messageText = buildSaudiCartMessage(cart);
    const waPhone = normalizeSaudiPhone(cart.customerPhone);
    const whatsappUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`
      : null;

    return {
      cartId: cart.cartId,
      createdAtRiyadh: formatRiyadhDateTime(new Date(createdMs)),
      ageHours: Math.round(((now.getTime() - createdMs) / 3600000) * 10) / 10,
      customerName: cart.customerName,
      productName: cart.productName,
      sizeLabel: cart.size?.trim() || 'غير محدد في السلة',
      checkoutUrl: cart.checkoutUrl,
      rawPhoneForCopy: cart.customerPhone.trim(),
      whatsappUrl,
      messageText,
      approvalRequired: true,
    };
  });

  const noticeAr =
    drafts.length === 0
      ? `لا توجد سلات متروكة جديدة ومؤهلة خلال آخر ${windowHours} ساعة بتوقيت الرياض (بعد استبعاد الطلبات المكتملة).`
      : `تم تجهيز ${drafts.length} رسائل تذكير جاهزة للمراجعة والاعتماد — لا يتم الإرسال التلقائي دون موافقتك الصريحة.`;

  return {
    triggered: true,
    windowHours,
    limit,
    evaluatedAtRiyadh: formatRiyadhDateTime(now),
    totalInputCarts: params.carts.length,
    excludedCompletedOrders,
    excludedOutOfWindow,
    drafts,
    noticeAr,
  };
}
