/**
 * فاحص الأدوات والتكاملات المتصلة في البيئة (القسم 4: الاستخدام الذكي للأدوات)
 * يفحص التوفر الفعلي دون ادعاء اتصال أداة غير متوفرة.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import { env, hasLlmCredentials, hasZidCredentials } from '../config/env.ts';

const execFileAsync = promisify(execFile);

export interface ToolHealthStatus {
  readonly id: string;
  readonly name: string;
  readonly category: 'workspace' | 'ecommerce' | 'repo' | 'ai';
  readonly connected: boolean;
  readonly detail: string;
}

async function checkCli(cmd: string, args: string[]): Promise<{ ok: boolean; detail: string }> {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 6000 });
    const firstLine = stdout.trim().split(/\r?\n/)[0] || 'متصل وجاهز';
    return { ok: true, detail: firstLine };
  } catch (err) {
    return { ok: false, detail: `غير متصل أو يتطلب تفويضاً (${(err as Error).message.slice(0, 80)})` };
  }
}

export async function inspectConnectedTools(): Promise<ToolHealthStatus[]> {
  const [gsheets, gdrive, gdocs, gmail, gcalendar, gh] = await Promise.all([
    checkCli('gsheets', ['auth', 'status']),
    checkCli('gdrive', ['auth', 'status']),
    checkCli('gdocs', ['auth', 'status']),
    checkCli('gmail', ['auth', 'status']),
    checkCli('gcalendar', ['auth', 'status']),
    checkCli('gh', ['auth', 'status']),
  ]);

  const integrationsRepoExists = fs.existsSync(env.integrationsRepoPath);

  return [
    {
      id: 'gsheets',
      name: 'Google Sheets (لوحة المتابعة التنفيذية)',
      category: 'workspace',
      connected: gsheets.ok,
      detail: gsheets.ok ? `متصل — معرف اللوحة: ${env.googleSheetId}` : gsheets.detail,
    },
    {
      id: 'gdrive',
      name: 'Google Drive (الملفات المرجعية)',
      category: 'workspace',
      connected: gdrive.ok,
      detail: gdrive.detail,
    },
    {
      id: 'gdocs',
      name: 'Google Docs (الدليل التشغيلي والتسويات)',
      category: 'workspace',
      connected: gdocs.ok,
      detail: gdocs.detail,
    },
    {
      id: 'gmail',
      name: 'Gmail (الدعم والمراسلات الإدارية)',
      category: 'workspace',
      connected: gmail.ok,
      detail: gmail.detail,
    },
    {
      id: 'gcalendar',
      name: 'Google Calendar (المراجعات والجدولة)',
      category: 'workspace',
      connected: gcalendar.ok,
      detail: gcalendar.detail,
    },
    {
      id: 'github',
      name: 'GitHub CLI (التحكم بالكود والتعديلات)',
      category: 'repo',
      connected: gh.ok,
      detail: gh.detail,
    },
    {
      id: 'integrations-repo',
      name: 'مستودع التكاملات (Alarabalmasi/-)',
      category: 'repo',
      connected: integrationsRepoExists,
      detail: integrationsRepoExists
        ? `موجود في ${env.integrationsRepoPath}`
        : 'غير موجود في المسار المحدد',
    },
    {
      id: 'zid-api',
      name: 'Zid Read-Only API (الطلبات والمخزون والسلات)',
      category: 'ecommerce',
      connected: hasZidCredentials(),
      detail: hasZidCredentials()
        ? `مضبوط للمتجر ${env.zidStoreId}`
        : 'بانتظار مفاتيح ZID في .env المحلي (يتوفر إثبات ربط سابق 18-11-2026 في Sheets)',
    },
    {
      id: 'llm-engine',
      name: 'محرك الذكاء الاصطناعي الاختياري (LLM)',
      category: 'ai',
      connected: hasLlmCredentials(),
      detail: hasLlmCredentials()
        ? `مفعّل (${env.llmProvider} / ${env.llmModel})`
        : 'يعمل حالياً بالمحرك التنفيذي الحتمي المربوط بالبيانات الحية (يمكن تفعيل Gemini/OpenAI عبر .env)',
    },
  ];
}
