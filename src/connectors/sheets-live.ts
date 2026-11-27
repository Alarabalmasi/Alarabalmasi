/**
 * موصل القراءة الحية من لوحة المتابعة التنفيذية في Google Sheets عبر gsheets CLI
 * قراءة فقط (readonly) — لا يعدّل أو يحذف أي خلية أو تبويب.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.ts';
import { STORE_IDENTITY } from '../config/identity.ts';

const execFileAsync = promisify(execFile);

export interface TaskOrRiskRow {
  readonly id: string;
  readonly type: string;
  readonly priority: string;
  readonly title: string;
  readonly description: string;
  readonly functionalOwner: string;
  readonly namedOwner: string;
  readonly status: string;
  readonly due: string;
  readonly closureEvidence: string;
}

export interface SourceMetricRow {
  readonly source: string;
  readonly updatedAt: string;
  readonly metric: string;
  readonly value: string;
  readonly interpretation: string;
  readonly url: string;
}

export interface ZidProofRow {
  readonly variantId: string;
  readonly sku: string;
  readonly productName: string;
  readonly availableQuantity: number | null;
  readonly warehouse: string;
  readonly checkedAt: string;
  readonly result: string;
}

export interface SyncLogRow {
  readonly source: string;
  readonly attemptTime: string;
  readonly status: string;
  readonly pulled: string;
  readonly written: string;
  readonly durationMs: string;
  readonly message: string;
}

export interface LiveExecutiveSnapshot {
  readonly capturedAt: string;
  readonly capturedAtRiyadh: string;
  readonly sheetId: string;
  readonly sheetUrl: string;
  readonly connectionStatus: 'live' | 'cached' | 'unavailable';
  readonly error?: string;
  readonly currentExecutiveDecision: string;
  readonly dashboardSummary: {
    readonly openCriticalTasks: number | null;
    readonly criticalRisks: number | null;
    readonly unassignedOwners: number | null;
    readonly searchClicks: number | null;
    readonly searchImpressions: number | null;
    readonly searchCtrLabel: string | null;
    readonly searchAvgPosition: number | null;
    readonly targetMinRoas: number | null;
    readonly targetMonthlySales: number | null;
    readonly guideMonthlyBudget: number | null;
  };
  readonly tasksAndRisks: TaskOrRiskRow[];
  readonly sourcesAndMetrics: SourceMetricRow[];
  readonly zidProofRows: ZidProofRow[];
  readonly syncLogs: SyncLogRow[];
  readonly tabCounts: {
    readonly zidRows: number;
    readonly whatsappRows: number;
    readonly adsRows: number;
    readonly searchRows: number;
  };
}

function parseArabicNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw)
    .trim()
    .replace(/٬|,/g, '')
    .replace(/٫/g, '.')
    .replace(/%/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function runGsheetsRead(sheetId: string, range: string): Promise<string[][]> {
  const { stdout } = await execFileAsync(
    'gsheets',
    ['readonly', 'read', sheetId, range, '--json'],
    { timeout: 15000, maxBuffer: 5 * 1024 * 1024 },
  );
  const parsed = JSON.parse(stdout);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.values)) return parsed.values;
  if (Array.isArray(parsed?.rows)) return parsed.rows;
  return [];
}

function riyadhTimestamp(date: Date): string {
  return (
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(',', '') + ' Asia/Riyadh'
  );
}

export function getSnapshotFilePath(): string {
  return path.join(env.dataDir, 'live-snapshot.json');
}

export function readCachedSnapshot(): LiveExecutiveSnapshot | null {
  const file = getSnapshotFilePath();
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as LiveExecutiveSnapshot;
    return { ...parsed, connectionStatus: 'cached' };
  } catch {
    return null;
  }
}

export async function fetchLiveExecutiveSnapshot(saveToDisk = true): Promise<LiveExecutiveSnapshot> {
  const now = new Date();
  const sheetId = env.googleSheetId;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  try {
    const [dashboard, tasksRaw, sourcesRaw, proofRaw, logsRaw, zidRaw, waRaw, adsRaw, searchRaw] =
      await Promise.all([
        runGsheetsRead(sheetId, "'لوحة المتابعة'!A1:O25"),
        runGsheetsRead(sheetId, "'المهام والمخاطر'!A1:J50"),
        runGsheetsRead(sheetId, "'المصادر والقياس'!A1:H30"),
        runGsheetsRead(sheetId, "'إثبات ربط زد 18-11-2026'!A1:J30"),
        runGsheetsRead(sheetId, "'سجل التشغيل'!A1:G50"),
        runGsheetsRead(sheetId, "'زد'!A1:A500"),
        runGsheetsRead(sheetId, "'واتساب'!A1:A500"),
        runGsheetsRead(sheetId, "'أداء الإعلانات'!A1:A500"),
        runGsheetsRead(sheetId, "'أداء البحث'!A1:A500"),
      ]);

    // استخراج المؤشرات الرئيسية من لوحة المتابعة بدقة حسب عناوين الصفوف
    let currentExecutiveDecision = '';
    const metricLookup = new Map<string, string>();
    for (const row of dashboard) {
      for (let i = 0; i < row.length; i++) {
        const cell = String(row[i] ?? '').trim();
        if (cell.startsWith('القرار الحالي:')) {
          currentExecutiveDecision = cell.replace(/^القرار الحالي:\s*/, '').trim();
        }
        if (cell && i + 1 < row.length) {
          const nextVal = String(row[i + 1] ?? '').trim();
          if (nextVal) metricLookup.set(cell, nextVal);
        }
      }
    }

    // استخراج المهام والمخاطر
    const taskHeaderIdx = tasksRaw.findIndex((r) => String(r[0] ?? '').trim() === 'المعرف');
    const tasksAndRisks: TaskOrRiskRow[] =
      taskHeaderIdx >= 0
        ? tasksRaw
            .slice(taskHeaderIdx + 1)
            .filter((r) => String(r[0] ?? '').trim().length > 0)
            .map((r) => ({
              id: String(r[0] ?? '').trim(),
              type: String(r[1] ?? '').trim(),
              priority: String(r[2] ?? '').trim(),
              title: String(r[3] ?? '').trim(),
              description: String(r[4] ?? '').trim(),
              functionalOwner: String(r[5] ?? '').trim(),
              namedOwner: String(r[6] ?? '').trim(),
              status: String(r[7] ?? '').trim(),
              due: String(r[8] ?? '').trim(),
              closureEvidence: String(r[9] ?? '').trim(),
            }))
        : [];

    // استخراج المصادر والقياس
    const srcHeaderIdx = sourcesRaw.findIndex((r) => String(r[0] ?? '').trim() === 'المصدر');
    const sourcesAndMetrics: SourceMetricRow[] =
      srcHeaderIdx >= 0
        ? sourcesRaw
            .slice(srcHeaderIdx + 1)
            .filter((r) => String(r[0] ?? '').trim().length > 0)
            .map((r) => ({
              source: String(r[0] ?? '').trim(),
              updatedAt: String(r[1] ?? '').trim(),
              metric: String(r[2] ?? '').trim(),
              value: String(r[3] ?? '').trim(),
              interpretation: String(r[4] ?? '').trim(),
              url: String(r[5] ?? '').trim(),
            }))
        : [];

    // استخراج إثبات ربط زد
    const zidProofRows: ZidProofRow[] = proofRaw
      .slice(1)
      .filter((r) => String(r[0] ?? '').trim().length > 0)
      .map((r) => ({
        variantId: String(r[0] ?? '').trim(),
        sku: String(r[1] ?? '').trim(),
        productName: String(r[2] ?? '').trim(),
        availableQuantity: parseArabicNumber(r[3]),
        warehouse: String(r[4] ?? '').trim(),
        checkedAt: String(r[5] ?? '').trim(),
        result: String(r[6] ?? '').trim(),
      }));

    // استخراج سجل التشغيل
    const syncLogs: SyncLogRow[] = logsRaw
      .slice(1)
      .filter((r) => String(r[0] ?? '').trim().length > 0)
      .map((r) => ({
        source: String(r[0] ?? '').trim(),
        attemptTime: String(r[1] ?? '').trim(),
        status: String(r[2] ?? '').trim(),
        pulled: String(r[3] ?? '').trim(),
        written: String(r[4] ?? '').trim(),
        durationMs: String(r[5] ?? '').trim(),
        message: String(r[6] ?? '').trim(),
      }));

    const snapshot: LiveExecutiveSnapshot = {
      capturedAt: now.toISOString(),
      capturedAtRiyadh: riyadhTimestamp(now),
      sheetId,
      sheetUrl,
      connectionStatus: 'live',
      currentExecutiveDecision:
        currentExecutiveDecision ||
        'لا تُزاد الميزانية قبل تسمية المالكين وتفعيل القياس وتدقيق البيانات.',
      dashboardSummary: {
        openCriticalTasks: parseArabicNumber(metricLookup.get('المهام الحرجة المفتوحة')),
        criticalRisks: parseArabicNumber(metricLookup.get('المخاطر الحرجة')),
        unassignedOwners: parseArabicNumber(metricLookup.get('مالكو المهام غير المعيّنين')),
        searchClicks: parseArabicNumber(metricLookup.get('النقرات')),
        searchImpressions: parseArabicNumber(metricLookup.get('الظهور')),
        searchCtrLabel: metricLookup.get('CTR') ?? null,
        searchAvgPosition: parseArabicNumber(metricLookup.get('متوسط الموضع')),
        targetMinRoas: parseArabicNumber(metricLookup.get('ROAS الأدنى')),
        targetMonthlySales: parseArabicNumber(metricLookup.get('مبيعات شهرية مستهدفة')),
        guideMonthlyBudget: parseArabicNumber(metricLookup.get('ميزانية شهرية')),
      },
      tasksAndRisks,
      sourcesAndMetrics,
      zidProofRows,
      syncLogs,
      tabCounts: {
        zidRows: Math.max(0, zidRaw.length - 1),
        whatsappRows: Math.max(0, waRaw.length - 1),
        adsRows: Math.max(0, adsRaw.length - 1),
        searchRows: Math.max(0, searchRaw.length - 1),
      },
    };

    if (saveToDisk) {
      fs.mkdirSync(env.dataDir, { recursive: true });
      fs.writeFileSync(getSnapshotFilePath(), JSON.stringify(snapshot, null, 2), 'utf8');
    }
    return snapshot;
  } catch (err) {
    const cached = readCachedSnapshot();
    if (cached) {
      return {
        ...cached,
        error: `تعذر التحديث المباشر من Google Sheets؛ يتم عرض آخر لقطة محفوظة (${cached.capturedAtRiyadh}). السبب: ${(err as Error).message}`,
      };
    }
    return {
      capturedAt: now.toISOString(),
      capturedAtRiyadh: riyadhTimestamp(now),
      sheetId,
      sheetUrl: STORE_IDENTITY.executiveSheetUrl,
      connectionStatus: 'unavailable',
      error: `تعذر قراءة Google Sheets: ${(err as Error).message}`,
      currentExecutiveDecision: 'تعذر قراءة القرار الحي من لوحة المتابعة — تحقق من صلاحية gsheets.',
      dashboardSummary: {
        openCriticalTasks: null,
        criticalRisks: null,
        unassignedOwners: null,
        searchClicks: null,
        searchImpressions: null,
        searchCtrLabel: null,
        searchAvgPosition: null,
        targetMinRoas: null,
        targetMonthlySales: null,
        guideMonthlyBudget: null,
      },
      tasksAndRisks: [],
      sourcesAndMetrics: [],
      zidProofRows: [],
      syncLogs: [],
      tabCounts: { zidRows: 0, whatsappRows: 0, adsRows: 0, searchRows: 0 },
    };
  }
}
