import fs from 'node:fs';
import path from 'node:path';
import { STORE_IDENTITY } from './identity.ts';

function loadDotEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
loadDotEnv(path.join(repoRoot, '.env'));

export const env = {
  repoRoot,
  dataDir: path.join(repoRoot, 'data'),
  port: Number(process.env.APP_PORT || 4090),
  timezone: process.env.APP_TIMEZONE || STORE_IDENTITY.timezone,
  googleSheetId: process.env.GOOGLE_SHEET_ID || STORE_IDENTITY.executiveSheetId,
  integrationsRepoPath: process.env.INTEGRATIONS_REPO_PATH || '/home/antigravity/Alarabalmasi/-',
  zidBaseUrl: (process.env.ZID_BASE_URL || 'https://api.zid.sa/v1').replace(/\/$/, ''),
  zidAuthorizationToken: process.env.ZID_AUTHORIZATION_TOKEN || '',
  zidManagerToken: process.env.ZID_MANAGER_TOKEN || '',
  zidStoreId: process.env.ZID_STORE_ID || '',
  llmProvider: (process.env.EXECUTIVE_LLM_PROVIDER || 'none').toLowerCase(),
  llmApiKey: process.env.EXECUTIVE_LLM_API_KEY || '',
  llmModel: process.env.EXECUTIVE_LLM_MODEL || 'gemini-2.5-pro',
  llmBaseUrl: process.env.EXECUTIVE_LLM_BASE_URL || '',
};

export function hasZidCredentials(): boolean {
  return Boolean(env.zidAuthorizationToken && env.zidManagerToken && env.zidStoreId);
}

export function hasLlmCredentials(): boolean {
  return env.llmProvider !== 'none' && Boolean(env.llmApiKey);
}
