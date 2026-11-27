/**
 * نظام كتابة صفحات المنتجات الهجين — القسم 10 و8 و9 من منظومة العرب الماسي
 * يجمع SEO وGEO وCRO وعلم نفس المستهلك السعودي دون اختلاق أي مواصفة غير مثبتة.
 */

import { BRANCHES, STORE_IDENTITY } from '../config/identity.ts';

export interface ProductFactInput {
  readonly productNameAr: string;
  readonly productNameEn?: string;
  readonly category: 'thobe' | 'shoes' | 'jalabiya' | 'shemagh' | 'accessory' | 'other';
  readonly sku?: string;
  readonly priceSar?: number | null;
  readonly inStock?: boolean | null;
  readonly color?: string;
  readonly fabric?: string;
  readonly collarType?: string;
  readonly sleeveType?: string;
  readonly closureType?: string; // سحاب / أزرار / إلخ
  readonly availableSizes?: string[];
  readonly occasions?: string[];
  readonly verifiedFeatures?: string[];
  readonly productUrl?: string;
  readonly imageCount?: number;
  readonly shippingPolicyNote?: string;
  readonly returnPolicyNote?: string;
}

export interface HybridProductPackage {
  readonly productNameAr: string;
  readonly productNameEn: string;
  readonly commercialTitle: string;
  readonly shortDescription: string;
  readonly salesOpening: string;
  readonly detailedHybridDescription: string;
  readonly wordCount: number;
  readonly benefits: string[];
  readonly specsTable: Array<{ label: string; value: string; verified: boolean }>;
  readonly sizeGuide: string;
  readonly occasions: string[];
  readonly objectionHandling: Array<{ objection: string; response: string }>;
  readonly faq: Array<{ question: string; answer: string }>;
  readonly cta: string;
  readonly internalLinks: {
    readonly categoriesAndComplements: string[];
    readonly branches: Array<{ name: string; address: string }>;
  };
  readonly seo: {
    readonly seoTitle: string;
    readonly metaDescription: string;
    readonly buyingQueries: string[];
    readonly images: Array<{
      readonly index: number;
      readonly seoFilename: string;
      readonly targetFormat: 'WebP 1000x1000';
      readonly altAr: string;
      readonly altEn: string;
    }>;
  };
  readonly schemaJsonLd: Record<string, unknown>;
  readonly unverifiedWarnings: string[];
}

function slugifyEn(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'alarab-almasi-product';
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const UNVERIFIED = 'يحتاج تحقق من المورد أو العينة الأصلية';

export function generateHybridProductPage(input: ProductFactInput): HybridProductPackage {
  const warnings: string[] = [];
  const nameAr = input.productNameAr.trim();
  const nameEn = (input.productNameEn || `Al Arab Al Masi ${input.category}`).trim();
  const color = input.color?.trim() || '';
  const fabric = input.fabric?.trim() || '';
  const collar = input.collarType?.trim() || '';
  const sleeve = input.sleeveType?.trim() || '';
  const closure = input.closureType?.trim() || '';
  const sizes = (input.availableSizes || []).map((s) => s.trim()).filter(Boolean);

  if (!fabric) warnings.push('نوع القماش غير مذكور — وُسِم للمراجعة من المورد/العينة الأصلية دون اختلاق.');
  if (!sizes.length) warnings.push('المقاسات المتوفرة غير مدخلة — يجب سحبها مباشرة من مخزون المتغيرات في زد.');
  if (input.priceSar === undefined || input.priceSar === null) {
    warnings.push('السعر غير محدد — يُؤخذ السعر النهائي من متجر زد مباشرة.');
  }

  const categoryArMap: Record<ProductFactInput['category'], string> = {
    thobe: 'ثوب رجالي',
    shoes: 'حذاء رجالي',
    jalabiya: 'جلابية مغربية رجالية',
    shemagh: 'شماغ ومستلزمات رجالية',
    accessory: 'إكسسوارات رجالية',
    other: 'أزياء رجالية',
  };
  const catAr = categoryArMap[input.category];

  const commercialTitle = color && !nameAr.includes(color)
    ? `${nameAr} لون ${color} — ${STORE_IDENTITY.brandAr}`
    : `${nameAr} — ${STORE_IDENTITY.brandAr}`;

  const shortDescription = [
    `${nameAr} من ${STORE_IDENTITY.brandAr}، خيار مصمم لذوق الرجل السعودي الباحث عن الأناقة العملية والوضوح في التفاصيل.`,
    color ? `متوفر بلون ${color}.` : '',
    fabric ? `مصنوع من خامة ${fabric}.` : '',
    sizes.length ? `المقاسات المتاحة حالياً: ${sizes.join('، ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const salesOpening = `إذا كنت تدور على ${catAr} يجمع بين الحضور المرتب والراحة الفعلية طوال اليوم، فإن «${nameAr}» من ${STORE_IDENTITY.brandAr} يعطيك إطلالة متوازنة بدون تعقيد — سواء لمناسباتك الخاصة أو لاستخدامك اليومي في أجواء المملكة.`;

  const verifiedFeatures = (input.verifiedFeatures || []).filter((f) => f.trim().length > 0);
  const occasions =
    input.occasions && input.occasions.length > 0
      ? input.occasions
      : ['الاستخدام اليومي والدوام', 'المناسبات العائلية والزيارات', 'الجمعة والاجتماعات الرسمية'];

  const specsTable: HybridProductPackage['specsTable'] = [
    { label: 'العلامة التجارية', value: `${STORE_IDENTITY.brandAr} (${STORE_IDENTITY.brandEn})`, verified: true },
    { label: 'الفئة', value: catAr, verified: true },
    { label: 'رمز المنتج (SKU)', value: input.sku?.trim() || 'يُسحب من زد', verified: Boolean(input.sku?.trim()) },
    { label: 'اللون', value: color || UNVERIFIED, verified: Boolean(color) },
    { label: 'الخامة / القماش', value: fabric || UNVERIFIED, verified: Boolean(fabric) },
    ...(input.category === 'thobe' || input.category === 'jalabiya'
      ? [
          { label: 'نوع الياقة', value: collar || UNVERIFIED, verified: Boolean(collar) },
          { label: 'نوع الأكمام', value: sleeve || UNVERIFIED, verified: Boolean(sleeve) },
          { label: 'نظام الإغلاق', value: closure || UNVERIFIED, verified: Boolean(closure) },
        ]
      : []),
    {
      label: 'المقاسات المتوفرة',
      value: sizes.length ? sizes.join(' / ') : 'تُعرض تلقائياً حسب توفر المخزون الفعلي في زد',
      verified: sizes.length > 0,
    },
  ];

  const benefits: string[] = [
    ...verifiedFeatures.map((f) => `${f} — ميزة مبنية على المواصفات المثبتة للمنتج.`),
    ...(color ? [`لون ${color} يمنحك تنسيقاً سهلاً مع مستلزماتك اليومية والمناسبات.`] : []),
    ...(fabric ? [`خامة ${fabric} المختارة لتمنحك ثباتاً وراحة في اللبس.`] : []),
    'توفر الشراء الإلكتروني عبر متجر العرب الماسي الرسمي على منصة زد مع دعم مباشر قبل وبعد الطلب.',
    'إمكانية التعرف على علامة العرب الماسي وحضورها الأرضي الموثوق في مدينة جدة.',
  ];

  const sizeGuide =
    input.category === 'thobe' || input.category === 'jalabiya'
      ? 'لاختيار المقاس الأدق دون تردد: قِس طول الثوب المناسب لك من أعلى الكتف حتى الكعب، وتحقق من عرض الصدر المعتاد في ثوبك المريح حالياً، ثم اختر المقاس المطابق من القائمة المتوفرة في صفحة المنتج. وإذا كنت بين مقاسين، تواصل مع فريق العرب الماسي قبل إتمام الطلب لنساعدك في اختيار الأنسب.'
      : 'لاختيار المقاس الصحيح: اعتمد مقاسك المعتاد في نفس الفئة وتأكد من توافر المقاس مباشرة في خيارات المنتج على زد قبل الإضافة للسلة، ويمكن لفريقنا مساعدتك في التأكد قبل الشحن.';

  const shippingNote =
    input.shippingPolicyNote?.trim() || 'وفق سياسة الشحن والتوصيل المنشورة في متجر العرب الماسي الرسمي.';
  const returnNote =
    input.returnPolicyNote?.trim() || 'وفق سياسة الاستبدال والاسترجاع الرسمية المنشورة في متجر العرب الماسي.';

  const objectionHandling = [
    {
      objection: 'خوف العميل من اختيار المقاس الخطأ',
      response: `${sizeGuide} كما يمكنك الاستفادة من الاستبدال ${returnNote}`,
    },
    {
      objection: 'التأكد من تطابق المنتج مع الصور والمواصفات',
      response: 'جميع المواصفات المعروضة في الجدول مطابقة للبيانات المعتمدة للمنتج دون مبالغة أو تعديل في التفاصيل الأصلية.',
    },
    {
      objection: 'الاطمئنان لموثوقية المتجر وسهولة الدفع والشحن',
      response: `العرب الماسي متجر سعودي موثق على منصة زد وله حضور أرضي معروف في جدة، مع توضيح كامل لتكلفة الشحن عند السلة ${shippingNote}`,
    },
  ];

  // وصف تفصيلي هجين (يستهدف 350-500 كلمة للثياب عند توفر المواصفات)
  const detailParagraphs = [
    salesOpening,
    `يأتي «${nameAr}» ضمن تشكيلة ${STORE_IDENTITY.brandAr} المختارة بعناية لتلبية احتياج العميل السعودي الذي يبحث عن جودة واضحة وسهولة في اتخاذ القرار دون حشو أو وعود غير حقيقية. ${fabric ? `تعتمد القطعة على خامة ${fabric}` : 'يُراعى في القطعة توازن الخامة والتفصيل وفق العينة الأصلية المعتمدة'}${color ? ` باللون ${color}` : ''}${collar ? ` مع ياقة ${collar}` : ''}${sleeve ? ` وأكمام ${sleeve}` : ''}${closure ? ` وإغلاق ${closure}` : ''}.`,
    `من ناحية الاستخدام اليومي والمناسبات، يناسب هذا الخيار ${occasions.join('، ')}. حرصنا في عرض المنتج على تقديم صورة واضحة لكل تفصيلة تهمك قبل الطلب، بدءاً من جدول المواصفات المثبتة، مروراً بدليل اختيار المقاس، وصولاً إلى توضيح خيارات التوصيل والاستبدال بكل شفافية.`,
    `لأن اختيار المقاس هو أكثر ما يشغل العميل عند التسوق الإلكتروني، وفرنا لك إرشادات واضحة لاختيار المقاس المناسب مع إمكانية مراجعة المقاسات المتوفرة لحظياً من مخزون المتجر على منصة زد. ${sizes.length ? `المقاسات المسجلة حالياً تشمل: ${sizes.join('، ')}.` : 'تظهر المقاسات المتوفرة فعلياً في خيارات الصفحة مباشرة.'}`,
    `عند الشراء من الموقع الرسمي ${STORE_IDENTITY.officialUrl}، تحصل على تجربة طلب ميسّرة على الجوال ووضوح تام في السعر وتكلفة الشحن قبل إتمام الدفع. كما يرتبط متجر العرب الماسي بحضور فعلي في جدة، مما يمنحك ثقة إضافية في العلامة التجارية وخدمة ما بعد البيع.`,
    `خلاصة الاختيار: إذا كنت تريد ${catAr} عملي ومرتب يخدم إطلالتك اليومية أو مناسباتك في السعودية، اختر مقاسك من القائمة المتوفرة وأضف «${nameAr}» إلى السلة الآن.`,
  ];

  const detailedHybridDescription = detailParagraphs.join('\n\n');

  const faq = [
    {
      question: `هل «${nameAr}» متوفر حالياً للشحن داخل السعودية؟`,
      answer: `نعم، يظهر التوفر الفعلي لكل مقاس مباشرة في خيارات المنتج على متجر ${STORE_IDENTITY.brandAr}، ويتم الشحن ${shippingNote}`,
    },
    {
      question: `كيف أختار المقاس الصحيح في «${nameAr}»؟`,
      answer: sizeGuide,
    },
    {
      question: `ما هي خامة وتفاصيل «${nameAr}»؟`,
      answer: fabric
        ? `الخامة المثبتة للمنتج هي ${fabric}${color ? ` باللون ${color}` : ''}، وجميع التفاصيل الإضافية موضحة في جدول المواصفات أعلاه.`
        : `تُعرض تفاصيل الخامة في جدول المواصفات بعد مطابقتها مع بطاقة المورد والعينة الأصلية.`,
    },
    {
      question: 'هل يمكن الاستبدال أو الاسترجاع في حال لم يناسبني المقاس؟',
      answer: `نعم، يخضع الاستبدال والاسترجاع للسياسة الرسمية المنشورة في متجر ${STORE_IDENTITY.brandAr}: ${returnNote}`,
    },
    {
      question: 'هل للعرب الماسي فروع أرضية في جدة؟',
      answer: `نعم، ترتبط منظومة ${STORE_IDENTITY.brandAr} بفروع أرضية معروفة في جدة (مع مراعاة استقلال مخزون وحسابات كل فرع عن المتجر الإلكتروني).`,
    },
  ];

  const buyingQueries = [
    `${nameAr} السعودية`,
    `شراء ${nameAr} جدة`,
    `${catAr} ${color || 'فخم'} ${STORE_IDENTITY.brandAr}`.replace(/\s+/g, ' ').trim(),
    `أفضل ${catAr} للمناسبات جدة`,
    `${nameAr} أونلاين توصيل السعودية`,
  ];

  const seoTitle = `${nameAr}${color && !nameAr.includes(color) ? ` ${color}` : ''} | ${STORE_IDENTITY.brandAr}`.slice(0, 60);
  const metaDescription = `اطلب ${nameAr} من ${STORE_IDENTITY.brandAr} في السعودية.${color ? ` لون ${color}.` : ''}${fabric ? ` خامة ${fabric}.` : ''} مقاسات متعددة، شحن واضح وسياسة استبدال شفافة.`.slice(0, 155);

  const imgCount = Math.max(1, Math.min(input.imageCount ?? 3, 6));
  const baseSlug = slugifyEn(`${nameEn} ${color}`);
  const angleLabelsAr = ['الواجهة الأمامية الكاملة', 'تفاصيل القماش والخياطة', 'المنظور الجانبي والإطلالة', 'تفاصيل الياقة والأكمام', 'عرض المقاس والتنسيق', 'تغليف وتقديم المنتج'];
  const angleLabelsEn = ['front full view', 'fabric and stitching detail', 'side silhouette view', 'collar and sleeve detail', 'fit and styling view', 'presentation view'];

  const images = Array.from({ length: imgCount }, (_, i) => ({
    index: i + 1,
    seoFilename: `${baseSlug}-${i + 1}.webp`,
    targetFormat: 'WebP 1000x1000' as const,
    altAr: `${nameAr}${color ? ` لون ${color}` : ''} — ${angleLabelsAr[i]} من ${STORE_IDENTITY.brandAr}`,
    altEn: `${nameEn}${color ? ` in ${color}` : ''} - ${angleLabelsEn[i]} by ${STORE_IDENTITY.brandEn}`,
  }));

  const schemaJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: nameAr,
    alternateName: nameEn,
    description: shortDescription,
    brand: {
      '@type': 'Brand',
      name: STORE_IDENTITY.brandAr,
    },
    ...(input.sku ? { sku: input.sku } : {}),
    ...(color ? { color } : {}),
    ...(fabric ? { material: fabric } : {}),
    ...(input.priceSar !== undefined && input.priceSar !== null
      ? {
          offers: {
            '@type': 'Offer',
            url: input.productUrl || STORE_IDENTITY.officialUrl,
            priceCurrency: 'SAR',
            price: input.priceSar,
            ...(input.inStock === true
              ? { availability: 'https://schema.org/InStock' }
              : input.inStock === false
                ? { availability: 'https://schema.org/OutOfStock' }
                : {}),
          },
        }
      : {}),
  };

  return {
    productNameAr: nameAr,
    productNameEn: nameEn,
    commercialTitle,
    shortDescription,
    salesOpening,
    detailedHybridDescription,
    wordCount: countWords(detailedHybridDescription),
    benefits,
    specsTable,
    sizeGuide,
    occasions,
    objectionHandling,
    faq,
    cta: `اختر مقاسك الآن وأضف «${nameAr}» إلى السلة — وإذا احتجت تأكيد المقاس، فريق ${STORE_IDENTITY.brandAr} حاضر لمساعدتك.`,
    internalLinks: {
      categoriesAndComplements: [
        `تصنيف ${catAr} في ${STORE_IDENTITY.brandAr}`,
        'الأحذية الرجالية للمناسبات والدوام',
        'الشماغ والمستلزمات الرجالية المكملة',
      ],
      branches: BRANCHES.map((b) => ({ name: b.nameAr, address: b.addressAr })),
    },
    seo: {
      seoTitle,
      metaDescription,
      buyingQueries,
      images,
    },
    schemaJsonLd,
    unverifiedWarnings: warnings,
  };
}
