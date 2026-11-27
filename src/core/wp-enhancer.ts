/**
 * محرك تدقيق وإصلاح وتحسين مقالات ووردبريس لمنظومة العرب الماسي
 * يقرأ النسخة الاحتياطية لمقالات alarabmsa19.wordpress.com ويُنتج نسخاً محسّنة لـ SEO/GEO/Local SEO
 * مع الحفاظ الكامل على الروابط المفهرسة (Slugs) والصور الحقيقية وإصلاح العناوين وALT وروابط المتجر والفروع.
 */

import fs from 'node:fs';
import path from 'node:path';
import { STORE_IDENTITY } from '../config/identity.ts';

export interface WpRawPost {
  readonly id: number;
  readonly date: string;
  readonly slug: string;
  readonly link: string;
  readonly featured_media: number;
  readonly title: { rendered: string };
  readonly excerpt: { rendered: string };
  readonly content: { rendered: string };
}

export interface EnhancedWpArticle {
  readonly id: number;
  readonly originalUrl: string;
  readonly slug: string;
  readonly originalTitle: string;
  readonly improvedTitle: string;
  readonly seoTitle: string;
  readonly metaDescription: string;
  readonly focusKeywords: string[];
  readonly featuredImagePlan: {
    readonly needsUpload: boolean;
    readonly localFilename: string | null;
    readonly seoFilename: string | null;
    readonly altAr: string;
    readonly altEn: string;
    readonly note: string;
  };
  readonly fixesApplied: string[];
  readonly metricsBefore: {
    readonly h2Count: number;
    readonly h3Count: number;
    readonly imgCount: number;
    readonly missingAltCount: number;
    readonly storeLinksCount: number;
    readonly hasWhatsApp: boolean;
    readonly hasMaps: boolean;
  };
  readonly metricsAfter: {
    readonly h2Count: number;
    readonly h3Count: number;
    readonly imgCount: number;
    readonly missingAltCount: number;
    readonly storeLinksCount: number;
    readonly hasWhatsApp: boolean;
    readonly hasMaps: boolean;
  };
  readonly htmlContent: string;
}

/** روابط المتجر والفروع الموثقة والمفحوصة (HTTP 200) */
export const VERIFIED_LINKS = {
  home: 'https://alarabalmasi.com/',
  branchesHub: 'https://alarabalmasi.com/pages/branches',
  sizeGuide: 'https://alarabalmasi.com/pages/thob-size-guide-dalil-maqasat',
  shipping: 'https://alarabalmasi.com/pages/shipping-policy',
  exchange: 'https://alarabalmasi.com/pages/refund-exchange-policy',
  supportWa: 'https://wa.me/966539939570',
  categories: {
    thobes: 'https://alarabalmasi.com/categories/1325330/saudi-mens-thobes',
    boysThobes: 'https://alarabalmasi.com/categories/1430686/boys-thobes-collection',
    shemaghs: 'https://alarabalmasi.com/categories/1325316/shemaghs-ghutras-shawls-collection',
    bishts: 'https://alarabalmasi.com/categories/1325332/sadiriyat-luxury-collection',
    shoes: 'https://alarabalmasi.com/categories/1430044/eastern-shoes',
    jalabiyas: 'https://alarabalmasi.com/categories/1430043/sleep-jalabiyas-emirati-shirts',
    underwear: 'https://alarabalmasi.com/categories/1387865/mens-cotton-underwear',
    gifts: 'https://alarabalmasi.com/categories/1325322/mens-watches-luxury-gift-sets',
  },
  branches: {
    alsalem: {
      name: 'مركز السالم للمستلزمات الرجالية — حي السامر، جدة',
      address: 'جدة، حي السامر، شارع وهيب بن عمير، أمام قاعة الرفيدي مباشرة',
      pageUrl: 'https://alarabalmasi.com/pages/alsalem-menswear-jeddah',
      mapsUrl: 'https://maps.app.goo.gl/Uf5xzkMGYXrNcyy57?g_st=ic',
      waUrl: 'https://wa.me/966539939530',
      phone: '0539939530',
      handle: '@alsalemsa1',
      role: 'الفرع المعتمد لاستلام واستبدال طلبات متجر العرب الماسي الإلكتروني بعد تأكيد الجاهزية، مع استقلال حساباته ومخزونه.',
    },
    aldaffahSamer: {
      name: 'مركز الدفة للمستلزمات الرجالية — حي السامر، جدة',
      address: 'جدة، حي السامر، شارع وهيب بن عمير، بجوار بنك البلاد مباشرة',
      pageUrl: 'https://alarabalmasi.com/pages/aldaffah-al-samer-jeddah',
      mapsUrl: 'https://www.google.com/maps/place/21.5911511,39.2365084',
      waUrl: 'https://wa.me/966561560303',
      phone: '0561560303',
      handle: '@aldaffahsa1',
      role: 'معرض ميداني مستقل للثياب السعودية والأشمغة والغتر والشرقيات والمستلزمات الرجالية.',
    },
    aldaffahMarjan: {
      name: 'مركز الدفة للمستلزمات الرجالية — سوق المرجان، جدة',
      address: 'جدة، حي الصفا، داخل سوق المرجان، بوابة 2، محل رقم 205',
      pageUrl: 'https://alarabalmasi.com/pages/aldaffah-al-safa-marjan-jeddah',
      mapsUrl: 'https://www.google.com/maps/place/21.5802312,39.2233659',
      waUrl: 'https://wa.me/966558977126',
      phone: '0558977126',
      handle: '@aldaffahsa',
      role: 'معرض ميداني مستقل داخل سوق المرجان للثياب والمشالح والجلابيات وأطقم الهدايا الرجالية.',
    },
  },
} as const;

interface PostSpec {
  readonly improvedTitle: string;
  readonly seoTitle: string;
  readonly metaDescription: string;
  readonly focusKeywords: string[];
  readonly branchFocus: 'alsalem' | 'aldaffahSamer' | 'aldaffahMarjan' | 'all';
  readonly recommendedCategories: Array<{ label: string; url: string }>;
  readonly altPrefixAr: string;
  readonly featuredImage: {
    readonly needsUpload: boolean;
    readonly localFilename: string | null;
    readonly seoFilename: string | null;
    readonly altAr: string;
    readonly altEn: string;
    readonly note: string;
  };
  readonly faq: Array<{ q: string; a: string }>;
}

const POST_SPECS: Record<number, PostSpec> = {
  465: {
    improvedTitle: 'مركز السالم للمستلزمات الرجالية بحي السامر جدة | ثوب العرب والأشمغة',
    seoTitle: 'مركز السالم للمستلزمات الرجالية حي السامر جدة | العرب الماسي',
    metaDescription:
      'عنوان وموقع مركز السالم للمستلزمات الرجالية في حي السامر بجدة أمام قاعة الرفيدي: ثوب العرب، الأشمغة الأصلية، المشالح، واتساب 0539939530 واستلام طلبات المتجر.',
    focusKeywords: [
      'مركز السالم للمستلزمات الرجالية جدة',
      'محل ثياب حي السامر جدة',
      'ثوب العرب جدة السامر',
      'أشمغة أصلية حي السامر',
      'استلام طلبات العرب الماسي جدة',
    ],
    branchFocus: 'alsalem',
    recommendedCategories: [
      { label: 'تصفح تشكيلة ثوب العرب الرجالي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الأشمغة والغتر الأصلية (البسام، بنتلي، التاج، فالنتينو)', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'المشالح والسديريات الملكية', url: VERIFIED_LINKS.categories.bishts },
      { label: 'دليل مقاسات ثوب العرب قبل الزيارة', url: VERIFIED_LINKS.sizeGuide },
      { label: 'صفحة تفاصيل مركز السالم على المتجر', url: VERIFIED_LINKS.branches.alsalem.pageUrl },
    ],
    altPrefixAr: 'معرض مركز السالم للمستلزمات الرجالية بحي السامر جدة — تشكيلة ثياب وأشمغة',
    featuredImage: {
      needsUpload: true,
      localFilename: 'alsalem-menswear-alsamer-jeddah.jpg',
      seoFilename: 'alsalem-menswear-alsamer-jeddah.webp',
      altAr: 'صورة تعبيرية لمعرض مستلزمات رجالية سعودية يعرض الثياب البيضاء والأشمغة والمشالح — مركز السالم حي السامر جدة',
      altEn: 'Editorial Saudi menswear boutique displaying white thobes, shemaghs, and bishts - Al Salem Center Al Samer Jeddah',
      note: 'صورة غلاف تحريرية تعويضاً عن غياب Featured Image (featured_media=0).',
    },
    faq: [
      {
        q: 'أين يقع مركز السالم للمستلزمات الرجالية في جدة بالضبط؟',
        a: 'يقع في جدة، حي السامر، شارع وهيب بن عمير، أمام قاعة الرفيدي مباشرة، ويمكنك فتح الموقع مباشرة عبر خرائط Google أو التواصل على واتساب الفرع 0539939530.',
      },
      {
        q: 'هل يمكن استلام أو استبدال طلبات متجر العرب الماسي الإلكتروني من مركز السالم؟',
        a: 'نعم، مركز السالم بحي السامر هو الفرع المعتمد لاستلام واستبدال طلبات متجر العرب الماسي الإلكتروني بعد تأكيد الجاهزية وتوفر البديل.',
      },
      {
        q: 'هل مخزون مركز السالم مطابق دائماً لمخزون المتجر الإلكتروني وباقي الفروع؟',
        a: 'لكل فرع مخزونه وحساباته المستقلة؛ لذلك ننصح بمراسلة واتساب الفرع (0539939530) للتأكد من توفر المقاس المطلوب قبل الزيارة.',
      },
    ],
  },
  486: {
    improvedTitle: 'مركز الدفة للمستلزمات الرجالية بحي السامر جدة | ثوب العرب والشرقيات',
    seoTitle: 'مركز الدفة حي السامر جدة | ثياب رجالية وأشمغة وشرقيات',
    metaDescription:
      'دليل زيارة مركز الدفة للمستلزمات الرجالية في حي السامر بجدة بجوار بنك البلاد: ثياب رجالية وولادية، أشمغة وغتر، أحذية شرقية، وموقع الخريطة وواتساب 0561560303.',
    focusKeywords: [
      'مركز الدفة حي السامر جدة',
      'محل مستلزمات رجالية شارع وهيب بن عمير',
      'ثياب جاهزة رجالي وولادي جدة',
      'أحذية شرقية جدة حي السامر',
      'الدفة للمستلزمات الرجالية جدة',
    ],
    branchFocus: 'aldaffahSamer',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي الجاهز', url: VERIFIED_LINKS.categories.thobes },
      { label: 'ثياب العرب الولادية للمدارس والأعياد', url: VERIFIED_LINKS.categories.boysThobes },
      { label: 'الشراقي والأحذية الشرقية', url: VERIFIED_LINKS.categories.shoes },
      { label: 'الملابس الداخلية القطنية (دروش، كنج ميرلاند، الأصيل)', url: VERIFIED_LINKS.categories.underwear },
      { label: 'صفحة تفاصيل فرع الدفة (السامر) على المتجر', url: VERIFIED_LINKS.branches.aldaffahSamer.pageUrl },
    ],
    altPrefixAr: 'مركز الدفة للمستلزمات الرجالية بحي السامر جدة — معروضات الثياب والمستلزمات',
    featuredImage: {
      needsUpload: true,
      localFilename: 'aldaffah-alsamer-jeddah.jpg',
      seoFilename: 'aldaffah-alsamer-jeddah.webp',
      altAr: 'صورة تعبيرية لمعرض مستلزمات رجالية سعودية يضم الثياب الجاهزة والشرقيات والغتر — مركز الدفة حي السامر جدة',
      altEn: 'Editorial Saudi menswear showroom with tailored thobes, eastern sandals, and ghutras - Al Daffah Al Samer Jeddah',
      note: 'صورة غلاف تحريرية تعويضاً عن غياب Featured Image (featured_media=0).',
    },
    faq: [
      {
        q: 'أين يقع مركز الدفة في حي السامر بجدة؟',
        a: 'يقع على شارع وهيب بن عمير في حي السامر بجدة بجوار بنك البلاد مباشرة، وحسابه الرسمي @aldaffahsa1 ورقم الواتساب 0561560303.',
      },
      {
        q: 'ما الفرق بين مركز الدفة حي السامر ومركز الدفة سوق المرجان؟',
        a: 'فرع الدفة السامر يقع على شارع وهيب بن عمير بجوار بنك البلاد (واتساب 0561560303، حساب @aldaffahsa1)، بينما فرع الدفة المرجان يقع داخل سوق المرجان بحي الصفا بوابة 2 محل 205 (واتساب 0558977126، حساب @aldaffahsa)، ولكل منهما مخزون مستقل.',
      },
      {
        q: 'هل تتوفر ثياب ولادية وملابس داخلية وأحذية شرقية في فرع الدفة السامر؟',
        a: 'نعم، يضم المعرض تشكيلة من الثياب الرجالية والولادية والأشمغة والغتر والملابس الداخلية والشرقيات؛ ويُنصح بتأكيد المقاس عبر واتساب الفرع قبل الزيارة.',
      },
    ],
  },
  533: {
    improvedTitle: 'مركز الدفة سوق المرجان بجدة (بوابة 2 محل 205) | ثياب ومشالح وهدايا',
    seoTitle: 'مركز الدفة سوق المرجان جدة بوابة 2 محل 205 | مستلزمات رجالية',
    metaDescription:
      'موقع وتفاصيل مركز الدفة للمستلزمات الرجالية داخل سوق المرجان بحي الصفا جدة بوابة 2 محل 205: ثياب رجالية وولادية، جلابيات مغربية، مشالح وهدايا. واتساب 0558977126.',
    focusKeywords: [
      'مركز الدفة سوق المرجان جدة',
      'محل مستلزمات رجالية سوق المرجان بوابة 2',
      'ثياب رجالية حي الصفا جدة',
      'جلابيات مغربية رجالية سوق المرجان',
      'أطقم هدايا رجالية جدة الصفا',
    ],
    branchFocus: 'aldaffahMarjan',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي والولادي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الجلابيات المغربية وملابس النوم الرجالية', url: VERIFIED_LINKS.categories.jalabiyas },
      { label: 'المشالح والسديريات الفاخرة', url: VERIFIED_LINKS.categories.bishts },
      { label: 'الساعات وأطقم الهدايا الرجالية', url: VERIFIED_LINKS.categories.gifts },
      { label: 'صفحة تفاصيل فرع الدفة (سوق المرجان)', url: VERIFIED_LINKS.branches.aldaffahMarjan.pageUrl },
    ],
    altPrefixAr: 'مركز الدفة سوق المرجان جدة بوابة 2 محل 205 — مستلزمات رجالية وهدايا',
    featuredImage: {
      needsUpload: true,
      localFilename: 'aldaffah-almarjan-jeddah.jpg',
      seoFilename: 'aldaffah-almarjan-jeddah.webp',
      altAr: 'صورة تعبيرية لمعرض مشالح وجلابيات مغربية وأطقم هدايا رجالية فاخرة — مركز الدفة سوق المرجان جدة بوابة 2',
      altEn: 'Editorial Saudi menswear boutique featuring bishts, Moroccan jalabiyas, and men gift sets - Al Daffah Al Marjan Jeddah',
      note: 'صورة غلاف تحريرية تعويضاً عن غياب Featured Image (featured_media=0).',
    },
    faq: [
      {
        q: 'كيف أصل إلى مركز الدفة داخل سوق المرجان في جدة؟',
        a: 'ادخل من بوابة 2 في سوق المرجان بحي الصفا بمدينة جدة وتوجّه مباشرة إلى محل رقم 205، أو افتح الموقع عبر خرائط Google وتواصل مع واتساب الفرع 0558977126.',
      },
      {
        q: 'ما أبرز المنتجات التي يشتهر بها فرع الدفة في سوق المرجان؟',
        a: 'يوفر الفرع الثياب الرجالية والولادية، الجلابيات المغربية، المشالح والسديريات، الأحذية الشرقية، وأطقم الهدايا الرجالية ومستلزمات المواليد.',
      },
      {
        q: 'هل يمكنني الطلب أونلاين إذا لم أتمكن من زيارة سوق المرجان؟',
        a: 'نعم، يمكنك الطلب مباشرة من متجر العرب الماسي الإلكتروني alarabalmasi.com مع شحن مجاني للطلبات من 195 ريال بعد الخصم وتقسيط عبر تمارا.',
      },
    ],
  },
  766: {
    improvedTitle: 'عندك مناسبة؟ دليل تجهيز الإطلالة السعودية الكاملة بدون حيرة | العرب الماسي',
    seoTitle: 'تجهيز إطلالة المناسبات السعودية: ثوب وشماغ وحذاء | العرب الماسي',
    metaDescription:
      'دليل عملي لتجهيز إطلالتك السعودية للمناسبات من متجر العرب الماسي وفروعه الثلاثة في جدة: اختيار الثوب والمقاس والشماغ والمشلح والحذاء الشرقي بخطوات واضحة.',
    focusKeywords: [
      'تجهيز إطلالة المناسبات السعودية',
      'تنسيق الثوب والشماغ للمناسبات',
      'متجر مستلزمات رجالية السعودية',
      'شراء ثوب وشماغ أونلاين السعودية',
      'فروع العرب الماسي جدة',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي للمناسبات', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الأشمغة والغتر الرسمية', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'المشالح والسديريات', url: VERIFIED_LINKS.categories.bishts },
      { label: 'الأحذية الشرقية والجزم الرجالية', url: VERIFIED_LINKS.categories.shoes },
      { label: 'دليل مقاسات ثوب العرب', url: VERIFIED_LINKS.sizeGuide },
    ],
    altPrefixAr: 'تنسيق الإطلالة السعودية الرسمية للمناسبات من العرب الماسي',
    featuredImage: {
      needsUpload: true,
      localFilename: 'saudi-occasion-look-guide.jpg',
      seoFilename: 'saudi-occasion-look-guide.webp',
      altAr: 'تنسيق تحريري لإطلالة سعودية رسمية تضم ثوباً أبيض وشماغاً وحذاءً شرقياً وسبحة وقلماً — العرب الماسي',
      altEn: 'Editorial flat-lay of a complete formal Saudi men outfit with white thobe, shemagh, black dress shoes, misbaha, and pen - Al Arab Al Masi',
      note: 'صورة غلاف/داخلية تحريرية لتعزيز الجاذبية البصرية (المقال كان بلا صور داخلية وبلا عناوين H2).',
    },
    faq: [
      {
        q: 'كيف أضمن اختيار مقاس الثوب الصحيح قبل المناسبة؟',
        a: 'راجع دليل مقاسات ثوب العرب على المتجر وقارن الطول وعرض الصدر بأريح ثوب تلبسه حالياً، كما يوفر المتجر أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط.',
      },
      {
        q: 'هل يتوفر تقسيط وشحن مجاني على طلبات المناسبات في العرب الماسي؟',
        a: 'نعم، يتوفر شحن مجاني للطلبات من 195 ريال بعد الخصم عبر ريدبوكس والبريد السعودي، وتقسيم المشتريات على 4 دفعات عبر تمارا.',
      },
    ],
  },
  572: {
    improvedTitle: 'كيف تختار ثوباً سعودياً جاهزاً يناسب دوامك ومناسباتك؟ دليل المقاس والياقة',
    seoTitle: 'كيف تختار ثوباً سعودياً جاهزاً؟ دليل الياقة والمقاس | العرب الماسي',
    metaDescription:
      'دليل عملي لاختيار الثوب السعودي الجاهز (سادة، قلاب، سحاب مخفي أو أزرار) مع رابط دليل المقاسات والشراء من العرب الماسي وزيارة المعارض الثلاثة في جدة.',
    focusKeywords: [
      'كيف تختار ثوب سعودي جاهز',
      'الفرق بين الياقة القلاب والسادة',
      'ثوب رجالي سحاب مخفي السعودية',
      'دليل مقاسات الثوب السعودي',
      'ثوب العرب الماسي جدة',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'تسوق جميع موديلات ثوب العرب الرجالي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'دليل مقاسات ثوب العرب بالتفصيل', url: VERIFIED_LINKS.sizeGuide },
      { label: 'سياسة أول استبدال مجاني خلال 10 أيام', url: VERIFIED_LINKS.exchange },
      { label: 'معاينة الثياب في فروع جدة الثلاثة', url: VERIFIED_LINKS.branchesHub },
    ],
    altPrefixAr: 'تفاصيل اختيار الثوب السعودي الجاهز والياقة والمقاس من العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: 'saudi-occasion-look-guide.jpg',
      seoFilename: 'saudi-ready-thobe-guide-alarabalmasi.webp',
      altAr: 'صورة تحريرية لثوب سعودي أبيض مرتب مع مستلزماته الرسمية — دليل اختيار الثوب الجاهز من العرب الماسي',
      altEn: 'Editorial guide image for choosing a ready-made Saudi white thobe - Al Arab Al Masi',
      note: 'المقال يملك featured_media=537؛ يمكن إضافة الصورة التحريرية كصورة داخلية بعد العنوان الثاني.',
    },
    faq: [
      {
        q: 'هل الياقة السادة أم القلاب أفضل للاستخدام اليومي؟',
        a: 'كلاهما عملي ويعتمد على تفضيلك؛ الياقة السادة تمنح واجهة هادئة وبسيطة، بينما الياقة القلاب تعطي تحديداً أوضح حول الرقبة وتنسجم مع الكثير من إطلالات الشماغ.',
      },
      {
        q: 'ماذا لو اخترت مقاساً غير مناسب عند الطلب أونلاين؟',
        a: 'يتيح متجر العرب الماسي أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط، كما يمكن التنسيق للاستبدال عبر مركز السالم بحي السامر في جدة بعد تأكيد الجاهزية.',
      },
    ],
  },
  780: {
    improvedTitle: 'دليل المستلزمات الرجالية في السعودية 2026 | متجر العرب الماسي وفروع جدة',
    seoTitle: 'دليل المستلزمات الرجالية في السعودية | العرب الماسي جدة',
    metaDescription:
      'دليلك الشامل لشراء الثوب السعودي والأشمغة والغتر والجلابيات والهدايا الرجالية أونلاين من متجر العرب الماسي أو عبر معارضنا الثلاثة في جدة (السامر وسوق المرجان).',
    focusKeywords: [
      'دليل المستلزمات الرجالية في السعودية',
      'متجر مستلزمات رجالية سعودي',
      'متجر العرب الماسي ثياب وأشمغة',
      'محلات مستلزمات رجالية في جدة',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الأشمغة والغتر الأصلية', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'الجلابيات وملابس النوم الرجالية', url: VERIFIED_LINKS.categories.jalabiyas },
      { label: 'الشراقي والأحذية الشرقية', url: VERIFIED_LINKS.categories.shoes },
      { label: 'فروع العرب الماسي الثلاثة في جدة', url: VERIFIED_LINKS.branchesHub },
    ],
    altPrefixAr: 'دليل المستلزمات الرجالية السعودية من متجر العرب الماسي',
    featuredImage: {
      needsUpload: true,
      localFilename: 'saudi-occasion-look-guide.jpg',
      seoFilename: 'saudi-menswear-guide-alarabalmasi.webp',
      altAr: 'مجموعة مستلزمات رجالية سعودية متكاملة (ثوب أبيض، شماغ، حذاء، سبحة وقلم) — العرب الماسي',
      altEn: 'Complete Saudi menswear guide flat-lay with thobe, shemagh, shoes, misbaha, and pen - Al Arab Al Masi',
      note: 'استبدال الصورة المكررة featured_media=612 (المستخدمة أيضاً في مقال الهدايا 610) بصورة مخصصة لهذا الدليل.',
    },
    faq: [
      {
        q: 'هل متجر العرب الماسي موثق ورسمي في السعودية؟',
        a: 'نعم، المتجر تابع لمؤسسة العرب الماسي للتجارة بسجل تجاري 4030113177 وتوثيق المركز السعودي للأعمال 0000341910 وعلامة تجارية مسجلة رقم TM-01-00-34943-26.',
      },
    ],
  },
  782: {
    improvedTitle: 'قبل أن تشتري الثوب والشماغ والهدية: الدليل الكامل من العرب الماسي',
    seoTitle: 'دليل شراء الثوب والشماغ والهدية الرجالية | العرب الماسي',
    metaDescription:
      'مرجع شامل قبل شراء الثوب السعودي والشماغ وأطقم الهدايا الرجالية من العرب الماسي: المقاسات، الموديلات، روابط الفروع المعتمدة في جدة، الشحن المجاني وتمارا.',
    focusKeywords: [
      'دليل شراء الثوب والشماغ السعودية',
      'كيف تختار شماغ وثوب رجالي',
      'هدايا رجالية سعودية أونلاين',
      'متجر العرب الماسي الرسمي',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الأشمغة والغتر', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'الساعات وأطقم الهدايا الرجالية', url: VERIFIED_LINKS.categories.gifts },
      { label: 'دليل مقاسات ثوب العرب', url: VERIFIED_LINKS.sizeGuide },
      { label: 'صفحة الفروع المعتمدة في جدة', url: VERIFIED_LINKS.branchesHub },
    ],
    altPrefixAr: 'دليل اختيار الثوب والشماغ والهدية الرجالية من العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: null,
      seoFilename: null,
      altAr: 'دليل اختيار الثوب والشماغ والهدية الرجالية من العرب الماسي',
      altEn: 'Saudi thobe, shemagh, and men gift buying guide by Al Arab Al Masi',
      note: 'يحتفظ بـ featured_media=789 مع توحيد روابط الخرائط والواتساب للفروع الثلاثة.',
    },
    faq: [
      {
        q: 'كيف أتأكد من سياسة الشحن والاستبدال قبل الشراء؟',
        a: 'الشحن مجاني للطلبات من 195 ريال بعد الخصم عبر ريدبوكس والبريد السعودي، وأول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق السياسة المنشورة.',
      },
    ],
  },
  623: {
    improvedTitle: 'مستلزمات رجالية في جدة: دليل فروع حي السامر وسوق المرجان | العرب الماسي',
    seoTitle: 'فروع العرب الماسي في جدة: السالم والدفة (السامر والمرجان)',
    metaDescription:
      'مقارنة واضحة بين فروع العرب الماسي الثلاثة في جدة (مركز السالم السامر، مركز الدفة السامر، مركز الدفة سوق المرجان بوابة 2 محل 205) مع روابط الخرائط وأرقام الواتساب.',
    focusKeywords: [
      'فروع العرب الماسي في جدة',
      'مستلزمات رجالية حي السامر جدة',
      'محل ثياب سوق المرجان جدة',
      'مركز السالم والدفة جدة',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'صفحة مقارنة الفروع الرسمية على المتجر', url: VERIFIED_LINKS.branchesHub },
      { label: 'مركز السالم (حي السامر)', url: VERIFIED_LINKS.branches.alsalem.pageUrl },
      { label: 'مركز الدفة (حي السامر)', url: VERIFIED_LINKS.branches.aldaffahSamer.pageUrl },
      { label: 'مركز الدفة (سوق المرجان)', url: VERIFIED_LINKS.branches.aldaffahMarjan.pageUrl },
    ],
    altPrefixAr: 'فروع مستلزمات رجالية في جدة حي السامر وسوق المرجان — العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: null,
      seoFilename: null,
      altAr: 'فروع العرب الماسي للمستلزمات الرجالية في جدة: السالم والدفة',
      altEn: 'Al Arab Al Masi menswear branches in Jeddah Al Samer and Al Marjan',
      note: 'يحتفظ بـ featured_media=625 مع إضافة روابط الواتساب الرسمية وتفاصيل استقلال كل فرع.',
    },
    faq: [
      {
        q: 'أي فرع أزوره لاستلام طلب المتجر الإلكتروني في جدة؟',
        a: 'مركز السالم بحي السامر (شارع وهيب بن عمير أمام قاعة الرفيدي — واتساب 0539939530) هو الفرع المعتمد لاستلام واستبدال طلبات المتجر الإلكتروني بعد تأكيد الجاهزية.',
      },
    ],
  },
  610: {
    improvedTitle: 'كيف تختار هدية رجالية فخمة من قلم وسبحة ومحفظة؟ دليل التنسيق والشراء',
    seoTitle: 'هدايا رجالية فخمة (قلم وسبحة ومحفظة) في جدة والسعودية | العرب الماسي',
    metaDescription:
      'دليل عملي لتنسيق هدية رجالية راقية من قلم وسبحة ومحفظة وساعة في السعودية، مع روابط أطقم الهدايا في العرب الماسي ومعارض جدة الثلاثة.',
    focusKeywords: [
      'هدايا رجالية فخمة السعودية',
      'طقم قلم وسبحة ومحفظة رجالي',
      'محل هدايا رجالية جدة',
      'أطقم هدايا رجالية العرب الماسي',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'الساعات وأطقم الهدايا الرجالية', url: VERIFIED_LINKS.categories.gifts },
      { label: 'الأشمغة الفاخرة للهدايا', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'المشالح والسديريات', url: VERIFIED_LINKS.categories.bishts },
      { label: 'معارض الهدايا في جدة (السامر والمرجان)', url: VERIFIED_LINKS.branchesHub },
    ],
    altPrefixAr: 'أطقم هدايا رجالية فخمة من قلم وسبحة ومحفظة — العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: null,
      seoFilename: null,
      altAr: 'تنسيق هدية رجالية من قلم وسبحة ومحفظة — العرب الماسي',
      altEn: 'Luxury Saudi men gift set with pen, misbaha, and wallet - Al Arab Al Masi',
      note: 'يحتفظ بـ featured_media=612 مع إزالة تكرارها من المقال 780.',
    },
    faq: [
      {
        q: 'هل تتوفر خيارات هدايا رجالية لا تحتاج معرفة مقاس الشخص؟',
        a: 'نعم، الأقلام والسبح والمحافظ والساعات والأطقم المنسقة، بالإضافة إلى ميزة «أرسل كهدية» في متجر العرب الماسي، تسهل الإهداء دون الحاجة لمعرفة المقاس.',
      },
    ],
  },
  597: {
    improvedTitle: 'كيف تختار سكراب طبي مريح للدوام الطويل؟ دليل المقاس والخامة والجيوب',
    seoTitle: 'دليل اختيار السكراب الطبي للدوام في السعودية | العرب الماسي',
    metaDescription:
      'نصائح عملية لاختيار السكراب الطبي الرجالي والنسائي المريح لساعات الدوام الطويلة في السعودية مع رابط الطلب المباشر من العرب الماسي وخدمة العملاء.',
    focusKeywords: [
      'سكراب طبي مريح السعودية',
      'سكراب طبي رجالي ونسائي جدة',
      'كيف تختار مقاس السكراب الطبي',
      'شراء سكراب طبي أونلاين السعودية',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'صفحة السكراب الطبي في متجر العرب الماسي', url: 'https://alarabalmasi.com/products/man-scrubs-%D8%B3%D9%83%D8%B1%D8%A7%D8%A8-%D8%B7%D8%A8%D9%8A-%D8%B1%D8%AC%D8%A7%D9%84%D9%8A-%D9%86%D8%B3%D8%A7%D8%A6%D9%8A' },
      { label: 'الملابس الداخلية القطنية المريحة تحت الدوام', url: VERIFIED_LINKS.categories.underwear },
      { label: 'سياسة الشحن والاستبدال', url: VERIFIED_LINKS.exchange },
    ],
    altPrefixAr: 'اختيار السكراب الطبي المريح للدوام من العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: null,
      seoFilename: null,
      altAr: 'سكراب طبي مريح للدوام اليومي في السعودية — العرب الماسي',
      altEn: 'Comfortable medical scrubs guide in Saudi Arabia - Al Arab Al Masi',
      note: 'يحتفظ بـ featured_media=472 مع إضافة روابط الفروع المعتمدة وخدمة العملاء.',
    },
    faq: [
      {
        q: 'هل يمكن استبدال مقاس السكراب الطبي بعد الاستلام؟',
        a: 'نعم، يخضع الاستبدال لسياسة متجر العرب الماسي التي توفر أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط.',
      },
    ],
  },
  583: {
    improvedTitle: 'شماغ أم غترة؟ دليل الاختيار والتنسيق مع الثوب السعودي | العرب الماسي',
    seoTitle: 'الفرق بين الشماغ والغترة وكيف تختار مع الثوب | العرب الماسي',
    metaDescription:
      'مقارنة عملية بين الشماغ والغترة البيضاء مع الثوب السعودي للدوام والمناسبات في السعودية، مع روابط الأشمغة الأصلية (البسام، التاج، فالنتينو، بنتلي) وفروع جدة.',
    focusKeywords: [
      'الفرق بين الشماغ والغترة',
      'شماغ أم غترة مع الثوب السعودي',
      'أشمغة أصلية جدة البسام والتاج',
      'شراء شماغ أونلاين السعودية',
    ],
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'تصفح جميع الأشمغة والغتر الأصلية', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'ثوب العرب الرجالي الجاهز', url: VERIFIED_LINKS.categories.thobes },
      { label: 'فروع معاينة الأشمغة في جدة', url: VERIFIED_LINKS.branchesHub },
    ],
    altPrefixAr: 'مقارنة الشماغ والغترة وتنسيقهما مع الثوب السعودي — العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: null,
      seoFilename: null,
      altAr: 'شماغ وغترة أصلية للتنسيق مع الثوب السعودي — العرب الماسي',
      altEn: 'Saudi shemagh vs ghutra styling guide with thobe - Al Arab Al Masi',
      note: 'يحتفظ بـ featured_media=586 مع إضافة روابط الفروع والواتساب الرسمي.',
    },
    faq: [
      {
        q: 'ما أشهر ماركات الأشمغة والغتر المتوفرة في العرب الماسي؟',
        a: 'تضم التشكيلة أشمغة البسام، التاج، ماريو فالنتينو، بنتلي، ميلانو إيطاليا، ريتشي لندن، دنهل، بالإضافة إلى الغتر البيضاء والشتوية حسب التوفر الفعلي في المتجر والفروع.',
      },
    ],
  },
};

function countMatches(html: string, regex: RegExp): number {
  return (html.match(regex) || []).length;
}

function measureHtml(html: string) {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const imgs = [...html.matchAll(/<img[^>]*>/g)];
  const missingAltCount = imgs.filter((m) => {
    const alt = (m[0].match(/alt="([^"]*)"/) || [])[1] || '';
    return !alt.trim();
  }).length;
  return {
    h2Count: countMatches(html, /<h2\b/gi),
    h3Count: countMatches(html, /<h3\b/gi),
    imgCount: imgs.length,
    missingAltCount,
    storeLinksCount: links.filter((l) => l.includes('alarabalmasi.com')).length,
    hasWhatsApp: links.some((l) => l.includes('wa.me') || l.includes('whatsapp')),
    hasMaps: links.some((l) => l.includes('maps.google') || l.includes('google.com/maps') || l.includes('maps.app.goo.gl')),
  };
}

/**
 * ترقية الفقرات التي تُستخدم كعناوين داخل المقالات الخالية من H2/H3 (465، 486، 533، 766)
 */
function promoteHeadingsInLegacyHtml(html: string, fixes: string[]): string {
  let out = html;
  let promoted = 0;

  // 1) تحويل <p><strong>عنوان قصير</strong></p> إلى <h2>
  out = out.replace(/<p[^>]*>\s*<(?:strong|b)>([^<]{8,140})<\/(?:strong|b)>\s*<\/p>/gi, (_m, title) => {
    const clean = title.trim();
    if (/^\d+\./.test(clean)) {
      promoted++;
      return `\n<!-- wp:heading {"level":3} -->\n<h3>${clean}</h3>\n<!-- /wp:heading -->\n`;
    }
    promoted++;
    return `\n<!-- wp:heading -->\n<h2>${clean}</h2>\n<!-- /wp:heading -->\n`;
  });

  // 2) تحويل فقرات قصيرة جداً تنتهي بعلامة استفهام أو نقطتين وتبدأ برقم أو سؤال إلى H2/H3
  out = out.replace(/<p[^>]*>([^<]{10,120})<\/p>/gi, (full, inner) => {
    const clean = inner.trim();
    const isNumberedHeading = /^[1-9]\.\s+[^.]{6,90}$/.test(clean);
    const isQuestionHeading = /^(?:أين|كيف|لماذا|ما|متى|هل)\s+[^.]{8,95}[؟?]$/.test(clean);
    if (isNumberedHeading) {
      promoted++;
      return `\n<!-- wp:heading -->\n<h2>${clean}</h2>\n<!-- /wp:heading -->\n`;
    }
    if (isQuestionHeading) {
      promoted++;
      return `\n<!-- wp:heading {"level":3} -->\n<h3>${clean}</h3>\n<!-- /wp:heading -->\n`;
    }
    return full;
  });

  if (promoted > 0) {
    fixes.push(`ترقية ${promoted} عنواناً إلى وسوم H2/H3 الدلالية (Gutenberg) لتحسين هيكلة SEO وسهولة القراءة على الجوال.`);
  }
  return out;
}

/**
 * إصلاح جميع وسوم الصور الفارغة من ALT دون المساس بروابط الصور الأصلية
 */
function fixMissingImageAlts(html: string, altPrefixAr: string, fixes: string[]): string {
  let idx = 0;
  let fixedCount = 0;
  const angleHints = [
    'عرض الثياب السعودية والأقمشة',
    'تشكيلة الأشمغة والغتر الأصلية',
    'تفاصيل المستلزمات الرجالية بالمعرض',
    'ركن المشالح والهدايا والشرقيات',
    'لقطة ميدانية من المعرض',
  ];

  const updated = html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    idx++;
    const hasNonEmptyAlt = /\balt="[^"]+"/i.test(attrs);
    if (hasNonEmptyAlt) return full;

    fixedCount++;
    const hint = angleHints[(idx - 1) % angleHints.length];
    const newAlt = `${altPrefixAr} — ${hint} (${idx})`;
    if (/\balt=""/i.test(attrs)) {
      return `<img${attrs.replace(/\balt=""/i, `alt="${newAlt}"`)}>`;
    }
    return `<img alt="${newAlt}"${attrs}>`;
  });

  if (fixedCount > 0) {
    fixes.push(`إضافة وصف بديل (ALT) عربي دقيق ومميز لـ ${fixedCount} صورة داخل المقال مع الحفاظ على الصور الأصلية.`);
  }
  return updated;
}

function buildStoreAndBranchesBlock(spec: PostSpec): string {
  const catsHtml = spec.recommendedCategories
    .map((c) => `<li><a href="${c.url}" target="_blank" rel="noopener">${c.label}</a></li>`)
    .join('\n');

  const branchCards =
    spec.branchFocus === 'all'
      ? [VERIFIED_LINKS.branches.alsalem, VERIFIED_LINKS.branches.aldaffahSamer, VERIFIED_LINKS.branches.aldaffahMarjan]
      : [VERIFIED_LINKS.branches[spec.branchFocus]];

  const branchesHtml = branchCards
    .map(
      (b) => `
<!-- wp:heading {"level":3} -->
<h3>${b.name}</h3>
<!-- /wp:heading -->
<ul>
  <li><strong>العنوان:</strong> ${b.address}.</li>
  <li><strong>ملاحظة الاستقلال والخدمة:</strong> ${b.role}</li>
  <li><strong>الموقع على الخريطة:</strong> <a href="${b.mapsUrl}" target="_blank" rel="noopener">افتح موقع الفرع في خرائط Google</a></li>
  <li><strong>واتساب الفرع المباشر:</strong> <a href="${b.waUrl}" target="_blank" rel="noopener">${b.phone}</a> · الحساب الرسمي: <code>${b.handle}</code></li>
  <li><strong>صفحة تفاصيل الفرع:</strong> <a href="${b.pageUrl}" target="_blank" rel="noopener">عرض التفاصيل الكاملة على متجر العرب الماسي</a></li>
</ul>`,
    )
    .join('\n');

  const faqHtml = spec.faq
    .map(
      (item) => `
<!-- wp:heading {"level":3} -->
<h3>${item.q}</h3>
<!-- /wp:heading -->
<p>${item.a}</p>`,
    )
    .join('\n');

  return `
<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

<!-- wp:heading -->
<h2>روابط التسوق المباشر من متجر العرب الماسي</h2>
<!-- /wp:heading -->
<p>تسوّق مباشرة عبر المتجر الرسمي <a href="${VERIFIED_LINKS.home}" target="_blank" rel="noopener"><strong>العرب الماسي (alarabalmasi.com)</strong></a> مع المزايا المنشورة رسمياً: ${STORE_IDENTITY.publishedPolicies.freeShippingThreshold}، ${STORE_IDENTITY.publishedPolicies.firstExchange}، و${STORE_IDENTITY.publishedPolicies.installments}.</p>
<ul>
${catsHtml}
</ul>

<!-- wp:heading -->
<h2>مواقع الفروع والتواصل المباشر في جدة</h2>
<!-- /wp:heading -->
<p>تحافظ منظومة العرب الماسي على استقلال حسابات ومخزون كل معرض في جدة؛ يمكنك التأكد من توفر المقاس عبر واتساب الفرع قبل الزيارة أو الاطلاع على <a href="${VERIFIED_LINKS.branchesHub}" target="_blank" rel="noopener">صفحة جميع فروع العرب الماسي بجدة</a>.</p>
${branchesHtml}
<p><strong>خدمة عملاء المتجر الإلكتروني الموحدة:</strong> <a href="${VERIFIED_LINKS.supportWa}" target="_blank" rel="noopener">${STORE_IDENTITY.legal.unifiedCustomerCareWhatsApp}</a> · ${STORE_IDENTITY.legal.entityName} (السجل التجاري: ${STORE_IDENTITY.legal.crNumber} · العلامة المسجلة: ${STORE_IDENTITY.legal.trademarkNumber}).</p>

<!-- wp:heading -->
<h2>أسئلة شائعة</h2>
<!-- /wp:heading -->
${faqHtml}
`.trim();
}

export function enhanceWordPressPosts(rawPosts: WpRawPost[]): EnhancedWpArticle[] {
  return rawPosts.map((post) => {
    const spec = POST_SPECS[post.id];
    const originalTitle = post.title.rendered.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    let html = post.content.rendered || '';
    const metricsBefore = measureHtml(html);
    const fixes: string[] = [];

    // 1. إصلاح الخطأ الإملائي المثبت في أول كلمة بالمقال 572
    if (post.id === 572 && html.includes('ختر الثوب الجاهز')) {
      html = html.replace('ختر الثوب الجاهز', 'اختر الثوب الجاهز');
      fixes.push('تصحيح الخطأ الإملائي في افتتاحية المقال («ختر الثوب» ← «اختر الثوب»).');
    }

    // 2. ترقية العناوين إذا كان المقال بلا H2
    if (metricsBefore.h2Count === 0) {
      html = promoteHeadingsInLegacyHtml(html, fixes);
    }

    // 3. إصلاح جميع وسوم الصور الفارغة من ALT
    if (metricsBefore.missingAltCount > 0) {
      html = fixMissingImageAlts(html, spec?.altPrefixAr || originalTitle, fixes);
    }

    // 4. توحيد وإضافة قسم الروابط الموثقة للمتجر والفروع وخرائط Google والواتساب والأسئلة الشائعة
    if (spec) {
      html = `${html.trim()}\n\n${buildStoreAndBranchesBlock(spec)}`;
      fixes.push('إضافة قسم روابط التصنيفات الموثقة (HTTP 200) + مواقع الفروع في جدة مع خرائط Google وأرقام الواتساب + قسم FAQ قابل للاقتباس في محركات الذكاء الاصطناعي (GEO/AEO).');
      if (spec.featuredImage.needsUpload) {
        fixes.push(`تجهيز صورة غلاف تحريرية جديدة (${spec.featuredImage.seoFilename}) مع ALT عربي وإنجليزي (${spec.featuredImage.note}).`);
      }
    }

    const metricsAfter = measureHtml(html);

    return {
      id: post.id,
      originalUrl: post.link,
      slug: post.slug,
      originalTitle,
      improvedTitle: spec?.improvedTitle || originalTitle,
      seoTitle: spec?.seoTitle || originalTitle,
      metaDescription: spec?.metaDescription || '',
      focusKeywords: spec?.focusKeywords || [],
      featuredImagePlan: spec?.featuredImage || {
        needsUpload: false,
        localFilename: null,
        seoFilename: null,
        altAr: originalTitle,
        altEn: originalTitle,
        note: 'يحتفظ بالصورة الحالية.',
      },
      fixesApplied: fixes,
      metricsBefore,
      metricsAfter,
      htmlContent: html,
    };
  });
}

export function buildAllWordPressArtifacts(repoRoot: string): {
  count: number;
  manifestPath: string;
  articles: EnhancedWpArticle[];
} {
  const backupPath = path.join(repoRoot, 'wordpress', 'backup-2026-11-27.json');
  const rawPosts = JSON.parse(fs.readFileSync(backupPath, 'utf8')) as WpRawPost[];
  const enhanced = enhanceWordPressPosts(rawPosts);

  const articlesDir = path.join(repoRoot, 'wordpress', 'articles');
  fs.mkdirSync(articlesDir, { recursive: true });

  for (const art of enhanced) {
    const outHtmlPath = path.join(articlesDir, `post-${art.id}.html`);
    const headerComment = [
      `<!--`,
      `  Post ID: ${art.id}`,
      `  Permalink (DO NOT CHANGE): ${art.originalUrl}`,
      `  Improved Title: ${art.improvedTitle}`,
      `  SEO Title: ${art.seoTitle}`,
      `  Meta Description: ${art.metaDescription}`,
      `  Focus Keywords: ${art.focusKeywords.join(' | ')}`,
      `  Featured Image: ${art.featuredImagePlan.seoFilename || 'keep existing'} | ALT AR: ${art.featuredImagePlan.altAr}`,
      `-->`,
    ].join('\n');
    fs.writeFileSync(outHtmlPath, `${headerComment}\n${art.htmlContent}\n`, 'utf8');
  }

  const manifest = enhanced.map(({ htmlContent: _omit, ...summary }) => ({
    ...summary,
    htmlFile: `wordpress/articles/post-${summary.id}.html`,
  }));
  const manifestPath = path.join(repoRoot, 'wordpress', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return { count: enhanced.length, manifestPath, articles: enhanced };
}
