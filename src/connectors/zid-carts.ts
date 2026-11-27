/**
 * موصل قراءة السلات المتروكة والطلبات من منصة زد (Zid Read-Only)
 * لا يختلق سلات أو بيانات عملاء عند غياب مفاتيح التفويض.
 */

import { env, hasZidCredentials } from '../config/env.ts';
import type { AbandonedCartRecord, CompletedOrderRef } from '../core/abandoned-carts.ts';

export interface ZidCartsFetchResult {
  readonly source: 'zid-live' | 'unconfigured' | 'error';
  readonly carts: AbandonedCartRecord[];
  readonly completedOrders: CompletedOrderRef[];
  readonly messageAr: string;
}

function authHeader(): string {
  return /^Bearer\s/i.test(env.zidAuthorizationToken)
    ? env.zidAuthorizationToken
    : `Bearer ${env.zidAuthorizationToken}`;
}

function zidHeaders(): Record<string, string> {
  return {
    Authorization: authHeader(),
    'X-Manager-Token': env.zidManagerToken,
    'Access-Token': env.zidManagerToken,
    'Store-Id': env.zidStoreId,
    Role: 'Manager',
    'Accept-Language': 'ar',
  };
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 15000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: zidHeaders(), signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} من Zid API`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLiveZidAbandonedCarts(): Promise<ZidCartsFetchResult> {
  if (!hasZidCredentials()) {
    return {
      source: 'unconfigured',
      carts: [],
      completedOrders: [],
      messageAr:
        'مفاتيح تفويض زد (ZID_AUTHORIZATION_TOKEN / ZID_MANAGER_TOKEN / ZID_STORE_ID) غير مضبوطة في ملف .env المحلي. أضف المفاتيح أو شغّل npm run auth:zid في مستودع التكاملات لسحب السلات الحقيقية، أو أدخل بيانات السلات المسحوبة يدوياً للتجهيز الفوري.',
    };
  }

  try {
    const [cartsRes, ordersRes] = await Promise.all([
      fetchJsonWithTimeout(`${env.zidBaseUrl}/managers/store/abandoned-carts?page=1&per_page=50`),
      fetchJsonWithTimeout(`${env.zidBaseUrl}/managers/store/orders?page=1&per_page=100&payload_type=simple`),
    ]);

    const rawCarts: any[] = cartsRes?.abandoned_carts || cartsRes?.results || cartsRes?.data || [];
    const rawOrders: any[] = ordersRes?.orders || ordersRes?.results || [];

    const carts: AbandonedCartRecord[] = rawCarts.map((c: any) => {
      const firstItem = Array.isArray(c.products) ? c.products[0] : Array.isArray(c.items) ? c.items[0] : null;
      return {
        cartId: String(c.id ?? c.cart_id ?? ''),
        createdAt: String(c.created_at ?? ''),
        updatedAt: c.updated_at ? String(c.updated_at) : undefined,
        customerName: String(c.customer?.name ?? c.customer_name ?? 'عميلنا الكريم'),
        customerPhone: String(c.customer?.mobile ?? c.customer?.phone ?? c.customer_phone ?? ''),
        productName: String(firstItem?.name ?? firstItem?.product_name ?? 'منتج من العرب الماسي'),
        size: firstItem?.size ?? firstItem?.selected_options?.[0]?.value ?? null,
        checkoutUrl: String(c.checkout_url ?? c.recovery_url ?? c.url ?? 'https://alarabalmasi.com/'),
        cartTotal: typeof c.total === 'number' ? c.total : null,
        currency: 'SAR',
      };
    });

    const completedOrders: CompletedOrderRef[] = rawOrders.map((o: any) => ({
      orderId: String(o.id ?? o.order_id ?? o.code ?? ''),
      customerPhone: o.customer?.mobile ?? o.customer?.phone ?? null,
      createdAt: String(o.created_at ?? o.order_date?.date ?? ''),
      status: String(o.order_status?.name ?? o.status?.name ?? o.status ?? 'unknown'),
    }));

    return {
      source: 'zid-live',
      carts,
      completedOrders,
      messageAr: `تم سحب ${carts.length} سلة متروكة و${completedOrders.length} طلب حديث من زد للمطابقة.`,
    };
  } catch (err) {
    return {
      source: 'error',
      carts: [],
      completedOrders: [],
      messageAr: `تعذر سحب السلات من Zid API: ${(err as Error).message}`,
    };
  }
}
