/**
 * خادم غرفة العمليات التنفيذية — AL ARAB AL MASI EXECUTIVE GROWTH OS
 * يقدم واجهة الويب + نقاط API لجميع وحدات الوكيل الإداري بدون اعتمادات خارجية.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.ts';
import {
  BRANCHES,
  EXECUTIVE_OS_VERSION,
  EXPERT_LENSES,
  SOURCE_OF_TRUTH_ORDER,
  STORE_IDENTITY,
  STRATEGIC_TARGETS,
} from '../config/identity.ts';
import { fetchLiveExecutiveSnapshot, readCachedSnapshot } from '../connectors/sheets-live.ts';
import { fetchLiveZidAbandonedCarts } from '../connectors/zid-carts.ts';
import { inspectConnectedTools } from '../connectors/workspace.ts';
import {
  detectAbandonedCartTrigger,
  prepareAbandonedCartReminders,
  type AbandonedCartRecord,
  type CompletedOrderRef,
} from '../core/abandoned-carts.ts';
import { runExecutiveAdvisor } from '../core/executive-advisor.ts';
import { generateHybridProductPage, type ProductFactInput } from '../core/product-writer.ts';
import { evaluateProfitability, type ProfitabilityInput } from '../core/profitability.ts';
import {
  ALL_60_CHECKPOINTS,
  evaluateQualityGate,
  QUALITY_DOMAINS,
  type CheckEvaluation,
} from '../core/quality-gate.ts';

const webDir = path.resolve(import.meta.dirname, '..', 'web');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function readBody(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > 1024 * 1024) throw new Error('حجم الطلب يتجاوز الحد المسموح (1MB).');
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

async function getSnapshot(refresh = false) {
  if (!refresh) {
    const cached = readCachedSnapshot();
    if (cached) return cached;
  }
  return fetchLiveExecutiveSnapshot(true);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${env.port}`);
    const { pathname, searchParams } = url;

    if (req.method === 'GET' && pathname === '/api/bootstrap') {
      const refresh = searchParams.get('refresh') === '1';
      const [snapshot, tools] = await Promise.all([getSnapshot(refresh), inspectConnectedTools()]);
      return sendJson(res, 200, {
        version: EXECUTIVE_OS_VERSION,
        identity: STORE_IDENTITY,
        branches: BRANCHES,
        targets: STRATEGIC_TARGETS,
        sourceOfTruthOrder: SOURCE_OF_TRUTH_ORDER,
        expertLenses: EXPERT_LENSES,
        qualityDomains: QUALITY_DOMAINS,
        totalQualityCheckpoints: ALL_60_CHECKPOINTS.length,
        snapshot,
        tools,
      });
    }

    if (req.method === 'GET' && pathname === '/api/snapshot') {
      const refresh = searchParams.get('refresh') !== '0';
      const snapshot = await getSnapshot(refresh);
      return sendJson(res, 200, snapshot);
    }

    if (req.method === 'POST' && pathname === '/api/advisor') {
      const body = await readBody(req);
      const query = String(body?.query || '').trim();
      if (!query) return sendJson(res, 400, { error: 'يرجى كتابة الطلب أو السؤال التنفيذي.' });
      const snapshot = await getSnapshot(false);
      const result = await runExecutiveAdvisor(query, snapshot);
      return sendJson(res, 200, result);
    }

    if (req.method === 'POST' && pathname === '/api/profitability') {
      const body = (await readBody(req)) as ProfitabilityInput;
      return sendJson(res, 200, evaluateProfitability(body));
    }

    if (req.method === 'POST' && pathname === '/api/abandoned-carts') {
      const body = await readBody(req);
      const triggerText = String(body?.triggerText || '');
      const parsedTrigger = triggerText ? detectAbandonedCartTrigger(triggerText) : null;
      const windowHours = Number(body?.windowHours || parsedTrigger?.windowHours || 24);
      const limit = Number(body?.limit || parsedTrigger?.limit || 3);

      let carts: AbandonedCartRecord[] = Array.isArray(body?.carts) ? body.carts : [];
      let completedOrders: CompletedOrderRef[] = Array.isArray(body?.completedOrders)
        ? body.completedOrders
        : [];
      let sourceNote = 'بيانات سلات مدخلة للمراجعة والتجهيز اليدوي';

      if (body?.fetchLiveZid === true || carts.length === 0) {
        const live = await fetchLiveZidAbandonedCarts();
        sourceNote = live.messageAr;
        if (live.source === 'zid-live') {
          carts = live.carts;
          completedOrders = live.completedOrders;
        }
      }

      const result = prepareAbandonedCartReminders({
        carts,
        completedOrders,
        windowHours,
        limit,
      });
      return sendJson(res, 200, { sourceNote, ...result });
    }

    if (req.method === 'POST' && pathname === '/api/product-writer') {
      const body = (await readBody(req)) as ProductFactInput;
      if (!body?.productNameAr?.trim()) {
        return sendJson(res, 400, { error: 'اسم المنتج بالعربية مطلوب لتوليد صفحة المنتج الهجينة.' });
      }
      return sendJson(res, 200, generateHybridProductPage(body));
    }

    if (req.method === 'POST' && pathname === '/api/quality-gate') {
      const body = await readBody(req);
      const evaluations: CheckEvaluation[] = Array.isArray(body?.evaluations) ? body.evaluations : [];
      return sendJson(res, 200, evaluateQualityGate(evaluations));
    }

    // تقديم الملفات الثابتة لغرفة العمليات
    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
    const fullPath = path.join(webDir, safePath);
    if (fullPath.startsWith(webDir) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const ext = path.extname(fullPath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(fullPath).pipe(res);
      return;
    }

    sendJson(res, 404, { error: 'المسار غير موجود.' });
  } catch (err) {
    sendJson(res, 500, { error: (err as Error).message });
  }
});

server.listen(env.port, '127.0.0.1', () => {
  console.log(`AL ARAB AL MASI — EXECUTIVE GROWTH OS يعمل على http://localhost:${env.port}`);
});
