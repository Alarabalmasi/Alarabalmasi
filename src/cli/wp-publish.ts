/**
 * أداة تجهيز ونشر تحسينات مقالات ووردبريس (alarabmsa19.wordpress.com)
 * الأوامر:
 *   npm run wp:enhance                          — توليد النسخ المحسّنة لجميع الـ 11 مقالاً محلياً في wordpress/articles/
 *   npm run wp:publish -- --dry-run             — محاكاة النشر دون المساس بالموقع الحي
 *   npm run wp:publish -- --live --post 465     — رفع الصورة وتحديث مقال محدد عبر WordPress REST API
 *   npm run wp:publish -- --live --all          — تحديث جميع المقالات (مع الحفاظ على الروابط المفهرسة)
 *
 * المصادقة المطلوبة للنشر الحي (--live) في .env:
 *   WP_SITE=alarabmsa19.wordpress.com
 *   WP_ACCESS_TOKEN=<WordPress.com OAuth Token>
 *   أو لمواقع WP ذاتية الاستضافة / Jetpack:
 *   WP_USERNAME=<username> + WP_APP_PASSWORD=<application_password>
 */

import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.ts';
import { buildAllWordPressArtifacts, type EnhancedWpArticle } from '../core/wp-enhancer.ts';

const args = process.argv.slice(2);
const modeLive = args.includes('--live');
const postFlagIdx = args.indexOf('--post');
const singlePostId = postFlagIdx >= 0 ? Number(args[postFlagIdx + 1]) : null;
const statusFlagIdx = args.indexOf('--status');
const targetStatus = statusFlagIdx >= 0 ? args[statusFlagIdx + 1] : null; // اختياري: 'draft' أو 'publish'

const { count, manifestPath, articles } = buildAllWordPressArtifacts(env.repoRoot);
const selected = singlePostId ? articles.filter((a) => a.id === singlePostId) : articles;

if (!modeLive) {
  console.log(
    JSON.stringify(
      {
        mode: 'dry-run',
        totalEnhancedArticles: count,
        selectedCount: selected.length,
        manifestPath,
        summary: selected.map((a) => ({
          id: a.id,
          improvedTitle: a.improvedTitle,
          before: a.metricsBefore,
          after: a.metricsAfter,
          featuredImageUpload: a.featuredImagePlan.needsUpload ? a.featuredImagePlan.localFilename : 'keep-existing',
          fixesCount: a.fixesApplied.length,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const wpSite = process.env.WP_SITE || 'alarabmsa19.wordpress.com';
const wpToken = process.env.WP_ACCESS_TOKEN || '';
const wpUser = process.env.WP_USERNAME || '';
const wpAppPass = process.env.WP_APP_PASSWORD || '';

if (!wpToken && !(wpUser && wpAppPass)) {
  console.error(
    'خطأ تفويض: يرجى إضافة WP_ACCESS_TOKEN (لـ WordPress.com) أو WP_USERNAME + WP_APP_PASSWORD في ملف .env قبل تشغيل --live.',
  );
  process.exit(1);
}

const authHeader = wpToken
  ? `Bearer ${wpToken}`
  : `Basic ${Buffer.from(`${wpUser}:${wpAppPass}`).toString('base64')}`;

const apiBase = `https://public-api.wordpress.com/wp/v2/sites/${encodeURIComponent(wpSite)}`;

async function uploadMedia(article: EnhancedWpArticle): Promise<number | null> {
  if (!article.featuredImagePlan.needsUpload || !article.featuredImagePlan.localFilename) return null;
  const imgPath = path.join(env.repoRoot, 'wordpress', 'images', article.featuredImagePlan.localFilename);
  if (!fs.existsSync(imgPath)) {
    throw new Error(`ملف الصورة غير موجود: ${imgPath}`);
  }
  const binary = fs.readFileSync(imgPath);
  const uploadName = article.featuredImagePlan.localFilename;
  const res = await fetch(`${apiBase}/media`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Disposition': `attachment; filename="${uploadName}"`,
      'Content-Type': uploadName.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
    },
    body: binary,
  });
  if (!res.ok) {
    throw new Error(`فشل رفع الصورة (${res.status}): ${await res.text()}`);
  }
  const media: any = await res.json();
  // تحديث النص البديل ALT للصورة المرفوعة
  if (media?.id) {
    await fetch(`${apiBase}/media/${media.id}`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alt_text: article.featuredImagePlan.altAr,
        caption: article.featuredImagePlan.altAr,
      }),
    });
  }
  return media?.id ?? null;
}

const uploadedCache = new Map<string, number>();

for (const article of selected) {
  let mediaId: number | null = null;
  if (article.featuredImagePlan.needsUpload && article.featuredImagePlan.localFilename) {
    const key = article.featuredImagePlan.localFilename;
    if (uploadedCache.has(key)) {
      mediaId = uploadedCache.get(key)!;
    } else {
      mediaId = await uploadMedia(article);
      if (mediaId) uploadedCache.set(key, mediaId);
    }
  }

  const payload: Record<string, unknown> = {
    title: article.improvedTitle,
    content: article.htmlContent,
    excerpt: article.metaDescription,
    ...(mediaId ? { featured_media: mediaId } : {}),
    ...(targetStatus ? { status: targetStatus } : {}),
  };

  const res = await fetch(`${apiBase}/posts/${article.id}`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`فشل تحديث المقال ${article.id} (${res.status}):`, await res.text());
    continue;
  }
  const updated: any = await res.json();
  console.log(`تم تحديث المقال ${article.id} بنجاح -> ${updated.link} (featured_media=${updated.featured_media})`);
}
