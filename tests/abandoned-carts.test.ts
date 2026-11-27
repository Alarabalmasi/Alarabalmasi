import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectAbandonedCartTrigger,
  prepareAbandonedCartReminders,
} from '../src/core/abandoned-carts.ts';

test('detects Section 17 Arabic trigger phrases and extracts window hours', () => {
  assert.deepEqual(detectAbandonedCartTrigger('السلات المتروكة'), {
    triggered: true,
    windowHours: 24,
    limit: 3,
  });
  assert.deepEqual(detectAbandonedCartTrigger('سلات 6 ساعات'), {
    triggered: true,
    windowHours: 6,
    limit: 3,
  });
  assert.deepEqual(detectAbandonedCartTrigger('تذكير السلات 12 ساعة آخر 5'), {
    triggered: true,
    windowHours: 12,
    limit: 5,
  });
});

test('filters strictly by created_at (ignores updated_at) and excludes customers who completed an order', () => {
  const now = new Date('2026-11-27T12:00:00+03:00');
  const result = prepareAbandonedCartReminders({
    now,
    windowHours: 12,
    limit: 3,
    carts: [
      {
        cartId: 'old-but-updated',
        createdAt: '2026-11-25T10:00:00+03:00',
        updatedAt: '2026-11-27T11:50:00+03:00', // must be ignored
        customerName: 'سعد',
        customerPhone: '0501111111',
        productName: 'ثوب كلاسيك',
        size: '58',
        checkoutUrl: 'https://alarabalmasi.com/c/old',
      },
      {
        cartId: 'already-ordered',
        createdAt: '2026-11-27T09:00:00+03:00',
        customerName: 'خالد',
        customerPhone: '0502222222',
        productName: 'ثوب رسمي',
        size: '56',
        checkoutUrl: 'https://alarabalmasi.com/c/ordered',
      },
      {
        cartId: 'eligible-1',
        createdAt: '2026-11-27T10:30:00+03:00',
        customerName: 'فهد العتيبي',
        customerPhone: '0553333333',
        productName: 'جزمة اسود للمناسبات سجنتشر فخامة',
        size: '43',
        checkoutUrl: 'https://alarabalmasi.com/c/ok1',
      },
    ],
    completedOrders: [
      {
        orderId: 'ORD-99',
        customerPhone: '+966502222222',
        createdAt: '2026-11-27T09:15:00+03:00',
        status: 'completed',
      },
    ],
  });

  assert.equal(result.excludedOutOfWindow, 1);
  assert.equal(result.excludedCompletedOrders, 1);
  assert.equal(result.drafts.length, 1);
  const draft = result.drafts[0];
  assert.equal(draft.cartId, 'eligible-1');
  assert.equal(draft.approvalRequired, true);
  assert.equal(draft.rawPhoneForCopy, '0553333333');
  assert.ok(draft.whatsappUrl?.startsWith('https://wa.me/966553333333?text='));
  assert.ok(draft.messageText.includes('فهد'));
  assert.ok(draft.messageText.includes('مقاس 43'));
  assert.ok(!draft.messageText.includes('خصم'));
  assert.ok(!draft.messageText.includes('شحن مجاني'));
});
