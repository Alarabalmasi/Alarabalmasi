/**
 * محرك تدقيق وإصلاح وتحسين مقالات ووردبريس لمنظومة العرب الماسي — الإصدار العميق (SEO + GEO + AEO + Local SEO)
 * مبني على:
 *  - بيانات Google Search Console الفعلية لمتجر alarabalmasi.com (32,190 ظهور / 532 نقرة)
 *  - تحليل المنافسين السعوديين (ikaf.net, almuniei.com, shemaghshop.sa, raseel.gift)
 *  - الحقائق الرسمية الموثقة من alarabalmasi.com و/pages/branches (HTTP 200)
 * مع الحفاظ الكامل على الروابط المفهرسة (Slugs) والصور الأصلية وإصلاح 53 وسم ALT مفقوداً.
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
  readonly gscBackedKeywords: string[];
  readonly canonicalRole: string;
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
    readonly hasGeoDirectAnswer: boolean;
    readonly hasComparisonTable: boolean;
  };
  readonly metricsAfter: {
    readonly h2Count: number;
    readonly h3Count: number;
    readonly imgCount: number;
    readonly missingAltCount: number;
    readonly storeLinksCount: number;
    readonly hasWhatsApp: boolean;
    readonly hasMaps: boolean;
    readonly hasGeoDirectAnswer: boolean;
    readonly hasComparisonTable: boolean;
  };
  readonly schemaJsonLd: Record<string, unknown>;
  readonly htmlContent: string;
}

/** روابط المتجر والمنتجات والفروع الموثقة والمفحوصة (HTTP 200) */
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
  topProducts: {
    thobeQallab: 'https://alarabalmasi.com/products/thobe-qallab-zipper-plain',
    thobeWhitePlain: 'https://alarabalmasi.com/products/white-thobe-plain-hidden-zipper',
    thobeEmbroidered: 'https://alarabalmasi.com/products/embroidered-saudi-thobe',
    scrubs: 'https://alarabalmasi.com/products/man-scrubs-%D8%B3%D9%83%D8%B1%D8%A7%D8%A8-%D8%B7%D8%A8%D9%8A-%D8%B1%D8%AC%D8%A7%D9%84%D9%8A-%D9%86%D8%B3%D8%A7%D8%A6%D9%8A',
  },
  branches: {
    alsalem: {
      name: 'مركز السالم للمستلزمات الرجالية — حي السامر، جدة',
      address: 'جدة، حي السامر، شارع وهيب بن عمير، أمام قاعة الرفيدي مباشرة',
      lat: 21.589247861474387,
      lng: 39.23759110271931,
      pageUrl: 'https://alarabalmasi.com/pages/alsalem-menswear-jeddah',
      mapsUrl: 'https://maps.app.goo.gl/Uf5xzkMGYXrNcyy57?g_st=ic',
      waUrl: 'https://wa.me/966539939530',
      phone: '0539939530',
      phoneIntl: '+966539939530',
      handle: '@alsalemsa1',
      hours: 'السبت والأربعاء والخميس (9:30 ص – 12 ص) | الأحد والاثنين والثلاثاء (فترتان حتى 12 ص) | الجمعة (4 م – 12 ص)',
      role: 'الفرع المعتمد لاستلام واستبدال طلبات متجر العرب الماسي الإلكتروني بعد تأكيد الجاهزية، مع استقلال حساباته ومخزونه.',
    },
    aldaffahSamer: {
      name: 'مركز الدفة للمستلزمات الرجالية — حي السامر، جدة',
      address: 'جدة، حي السامر، شارع وهيب بن عمير، بجوار بنك البلاد مباشرة',
      lat: 21.5911511,
      lng: 39.2365084,
      pageUrl: 'https://alarabalmasi.com/pages/aldaffah-al-samer-jeddah',
      mapsUrl: 'https://www.google.com/maps/place/21.5911511,39.2365084',
      waUrl: 'https://wa.me/966561560303',
      phone: '0561560303',
      phoneIntl: '+966561560303',
      handle: '@aldaffahsa1',
      hours: 'يُنصح بتأكيد أوقات الدوام اليوم وتوفر المقاس عبر واتساب الفرع قبل الزيارة',
      role: 'معرض ميداني مستقل للثياب السعودية والأشمغة والغتر والشرقيات والمستلزمات الرجالية.',
    },
    aldaffahMarjan: {
      name: 'مركز الدفة للمستلزمات الرجالية — سوق المرجان، جدة',
      address: 'جدة، حي الصفا، داخل سوق المرجان، بوابة 2، محل رقم 205',
      lat: 21.5802312,
      lng: 39.2233659,
      pageUrl: 'https://alarabalmasi.com/pages/aldaffah-al-safa-marjan-jeddah',
      mapsUrl: 'https://www.google.com/maps/place/21.5802312,39.2233659',
      waUrl: 'https://wa.me/966558977126',
      phone: '0558977126',
      phoneIntl: '+966558977126',
      handle: '@aldaffahsa',
      hours: 'يُنصح بتأكيد مواعيد سوق المرجان والفرع عبر واتساب قبل الزيارة',
      role: 'معرض ميداني مستقل داخل سوق المرجان للثياب والمشالح والجلابيات وأطقم الهدايا الرجالية.',
    },
  },
} as const;

interface ComparisonTableSpec {
  readonly heading: string;
  readonly headers: string[];
  readonly rows: string[][];
}

interface PostSpec {
  readonly improvedTitle: string;
  readonly seoTitle: string;
  readonly metaDescription: string;
  readonly focusKeywords: string[];
  readonly gscBackedKeywords: string[];
  readonly canonicalRole: string;
  readonly geoDirectAnswer: string;
  readonly comparisonTable: ComparisonTableSpec;
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

const BRANCH_COMPARISON_TABLE: ComparisonTableSpec = {
  heading: 'مقارنة سريعة بين فروع العرب الماسي الثلاثة في جدة',
  headers: ['الفرع', 'الحي والمعلم الأقرب', 'أبرز المزايا والمعروضات', 'واتساب وحساب الفرع'],
  rows: [
    [
      'مركز السالم (حي السامر)',
      'حي السامر، شارع وهيب بن عمير، أمام قاعة الرفيدي',
      'الفرع المعتمد لاستلام واستبدال طلبات الأونلاين + ثوب العرب وأشمغة ومشالح وهدايا',
      '0539939530 · @alsalemsa1',
    ],
    [
      'مركز الدفة (حي السامر)',
      'حي السامر، شارع وهيب بن عمير، بجوار بنك البلاد',
      'ثياب رجالية وولادية سادة وقلاب، أشمغة وغتر، أحذية شرقية، ملابس داخلية وبجامات',
      '0561560303 · @aldaffahsa1',
    ],
    [
      'مركز الدفة (سوق المرجان)',
      'حي الصفا، داخل سوق المرجان، بوابة 2، محل 205',
      'ثياب رجالية وولادية، جلابيات مغربية، مشالح وسديريات، شرقيات وأطقم هدايا ومواليد',
      '0558977126 · @aldaffahsa',
    ],
  ],
};

const POST_SPECS: Record<number, PostSpec> = {
  465: {
    improvedTitle: 'مركز السالم للمستلزمات الرجالية بحي السامر جدة | العنوان والموقع وأوقات العمل',
    seoTitle: 'مركز السالم للمستلزمات الرجالية حي السامر جدة | العرب الماسي',
    metaDescription:
      'موقع وأوقات عمل مركز السالم للمستلزمات الرجالية بحي السامر جدة أمام قاعة الرفيدي: ثوب العرب الجاهز، الأشمغة الأصلية، المشالح، واتساب 0539939530 واستلام الأونلاين.',
    focusKeywords: [
      'مركز السالم للمستلزمات الرجالية جدة',
      'محل ثياب حي السامر جدة',
      'ثوب العرب جدة السامر',
      'أشمغة أصلية حي السامر جدة',
      'استلام طلبات العرب الماسي جدة',
    ],
    gscBackedKeywords: ['السالم للمستلزمات الرجالية', 'ثوب العرب', 'ثوب جاهز', 'مشلح اسود ذهبي'],
    canonicalRole: 'مقال داعم محلي (Local SEO) يغذي صفحة الفرع الرسمية /pages/alsalem-menswear-jeddah وتصنيف الثياب.',
    geoDirectAnswer:
      'يقع مركز السالم للمستلزمات الرجالية في مدينة جدة، حي السامر، شارع وهيب بن عمير، أمام قاعة الرفيدي مباشرة (واتساب 0539939530، الحساب @alsalemsa1). وهو المعرض المعتمد لاستلام واستبدال طلبات متجر العرب الماسي الإلكتروني (alarabalmasi.com) بعد تأكيد الجاهزية، مع استقلال مخزونه وحساباته عن باقي الفروع.',
    comparisonTable: BRANCH_COMPARISON_TABLE,
    branchFocus: 'alsalem',
    recommendedCategories: [
      { label: 'تصفح تشكيلة ثوب العرب الرجالي الجاهز', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الأشمغة والغتر الأصلية (البسام، التاج، فالنتينو، بنتلي)', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'المشالح والسديريات (بما فيها المشلح الأسود الذهبي)', url: VERIFIED_LINKS.categories.bishts },
      { label: 'دليل مقاسات ثوب العرب قبل الزيارة', url: VERIFIED_LINKS.sizeGuide },
      { label: 'صفحة تفاصيل مركز السالم الرسمية على المتجر', url: VERIFIED_LINKS.branches.alsalem.pageUrl },
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
        a: 'يقع في شرق جدة بحي السامر على شارع وهيب بن عمير، أمام قاعة الرفيدي مباشرة، ويمكنك فتح الموقع في خرائط Google أو التواصل عبر واتساب الفرع 0539939530.',
      },
      {
        q: 'هل يمكن استلام أو استبدال طلبات متجر العرب الماسي الإلكتروني من مركز السالم؟',
        a: 'نعم، مركز السالم بحي السامر هو الفرع المعتمد لاستلام واستبدال طلبات متجر العرب الماسي الإلكتروني بعد تأكيد الجاهزية وتوفر البديل.',
      },
      {
        q: 'ما أوقات عمل مركز السالم بحي السامر؟',
        a: 'السبت والأربعاء والخميس من 9:30 صباحاً حتى 12 منتصف الليل، والأحد والاثنين والثلاثاء على فترتين حتى 12 منتصف الليل، والجمعة من 4 عصراً حتى 12 منتصف الليل.',
      },
    ],
  },
  486: {
    improvedTitle: 'مركز الدفة للمستلزمات الرجالية بحي السامر جدة | ثوب العرب والشرقيات والأشمغة',
    seoTitle: 'مركز الدفة حي السامر جدة | ثياب جاهزة وأشمغة وأحذية شرقية',
    metaDescription:
      'دليل زيارة مركز الدفة بحي السامر جدة (بجوار بنك البلاد): ثياب رجالية وولادية سادة وقلاب، طاقية الدفة، أشمغة وغتر، شرقيات وملابس داخلية. واتساب 0561560303.',
    focusKeywords: [
      'مركز الدفة حي السامر جدة',
      'محل مستلزمات رجالية شارع وهيب بن عمير',
      'ثياب جاهزة رجالي وولادي جدة',
      'أحذية شرقية شراقي جدة حي السامر',
      'الدفة للمستلزمات الرجالية جدة',
    ],
    gscBackedKeywords: ['طاقية الدفة', 'شراقي', 'ثوب جاهز', 'ثياب ولادي'],
    canonicalRole: 'مقال داعم محلي (Local SEO) يغذي صفحة الفرع الرسمية /pages/aldaffah-al-samer-jeddah وتصنيف الشرقيات والثياب الولادية.',
    geoDirectAnswer:
      'يقع مركز الدفة للمستلزمات الرجالية (فرع حي السامر) في شرق جدة على شارع وهيب بن عمير بجوار بنك البلاد مباشرة (واتساب 0561560303، الحساب @aldaffahsa1). يضم الفرع المستقل ثياباً سعودية رجالية وولادية سادة وقلاب، أشمغة وغتراً، طواقي الدفة، ملابس داخلية قطنية، وأحذية شرقية (شراقي).',
    comparisonTable: BRANCH_COMPARISON_TABLE,
    branchFocus: 'aldaffahSamer',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي الجاهز (سادة وقلاب)', url: VERIFIED_LINKS.categories.thobes },
      { label: 'ثياب العرب الولادية للمدارس والأعياد', url: VERIFIED_LINKS.categories.boysThobes },
      { label: 'الشراقي والأحذية الشرقية', url: VERIFIED_LINKS.categories.shoes },
      { label: 'الملابس الداخلية القطنية (دروش، كنج ميرلاند، الأصيل)', url: VERIFIED_LINKS.categories.underwear },
      { label: 'صفحة تفاصيل فرع الدفة (السامر) الرسمية على المتجر', url: VERIFIED_LINKS.branches.aldaffahSamer.pageUrl },
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
        a: 'يقع على شارع وهيب بن عمير في حي السامر بجدة بجوار بنك البلاد مباشرة، ورقم الواتساب الرسمي للفرع 0561560303 وحسابه @aldaffahsa1.',
      },
      {
        q: 'ما الفرق بين مركز الدفة حي السامر ومركز الدفة سوق المرجان؟',
        a: 'فرع الدفة السامر يقع على شارع وهيب بن عمير بجوار بنك البلاد (0561560303 / @aldaffahsa1)، بينما فرع الدفة المرجان يقع بحي الصفا داخل سوق المرجان بوابة 2 محل 205 (0558977126 / @aldaffahsa)، ولكل منهما مخزون مستقل.',
      },
      {
        q: 'هل تتوفر أحذية شرقية (شراقي) وثياب ولادية في فرع الدفة السامر؟',
        a: 'نعم، تتوفر تشكيلات الثياب الرجالية والولادية والأحذية الشرقية والملابس الداخلية، ويُنصح بتأكيد المقاس عبر واتساب الفرع قبل الزيارة.',
      },
    ],
  },
  533: {
    improvedTitle: 'مركز الدفة سوق المرجان بجدة (بوابة 2 محل 205) | ثياب وجلابيات مغربية وهدايا',
    seoTitle: 'مركز الدفة سوق المرجان جدة بوابة 2 محل 205 | ثياب وجلابيات وهدايا',
    metaDescription:
      'دليل مركز الدفة للمستلزمات الرجالية داخل سوق المرجان بحي الصفا جدة بوابة 2 محل 205: ثياب رجالية وولادية، جلابيات مغربية، مشالح وأطقم هدايا. واتساب 0558977126.',
    focusKeywords: [
      'مركز الدفة سوق المرجان جدة',
      'محل مستلزمات رجالية سوق المرجان بوابة 2',
      'جلابيات مغربية رجالية جدة سوق المرجان',
      'ثياب رجالية حي الصفا جدة',
      'هدايا رجالية جدة الصفا',
    ],
    gscBackedKeywords: ['جلابية مغربية رجالية', 'جلابيات مغربية رجالية فاخرة', 'هدايا رجالية جدة', 'شراقي'],
    canonicalRole: 'مقال داعم محلي (Local SEO) يغذي صفحة فرع سوق المرجان /pages/aldaffah-al-safa-marjan-jeddah وتصنيف الجلابيات والهدايا.',
    geoDirectAnswer:
      'يقع مركز الدفة للمستلزمات الرجالية (فرع سوق المرجان) في مدينة جدة بحي الصفا داخل سوق المرجان عند بوابة 2، محل رقم 205 (واتساب 0558977126، الحساب @aldaffahsa). يوفر الفرع المستقل الثياب الرجالية والولادية، الجلابيات المغربية والإماراتية، المشالح والسديريات، الأحذية الشرقية، وأطقم الهدايا الرجالية.',
    comparisonTable: BRANCH_COMPARISON_TABLE,
    branchFocus: 'aldaffahMarjan',
    recommendedCategories: [
      { label: 'الجلابيات المغربية والإماراتية وملابس النوم الرجالية', url: VERIFIED_LINKS.categories.jalabiyas },
      { label: 'ثوب العرب الرجالي والولادي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'المشالح والسديريات الفاخرة', url: VERIFIED_LINKS.categories.bishts },
      { label: 'الساعات وأطقم الهدايا الرجالية', url: VERIFIED_LINKS.categories.gifts },
      { label: 'صفحة تفاصيل فرع الدفة (سوق المرجان) على المتجر', url: VERIFIED_LINKS.branches.aldaffahMarjan.pageUrl },
    ],
    altPrefixAr: 'مركز الدفة سوق المرجان جدة بوابة 2 محل 205 — مستلزمات رجالية وجلابيات وهدايا',
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
        a: 'ادخل من بوابة 2 في سوق المرجان بحي الصفا بجدة وتوجّه مباشرة إلى محل رقم 205، أو افتح الموقع على خرائط Google وتواصل على واتساب الفرع 0558977126.',
      },
      {
        q: 'هل تتوفر الجلابيات المغربية الرجالية وأطقم الهدايا في فرع سوق المرجان؟',
        a: 'نعم، يجمع الفرع بين الثياب الجاهزة والجلابيات المغربية والمشالح والشرقيات وأطقم الهدايا، كما يمكنك تصفح التشكيلة المتاحة للشحن عبر متجر العرب الماسي الإلكتروني.',
      },
      {
        q: 'هل يمكن الطلب أونلاين مع التوصيل لجميع مدن المملكة؟',
        a: 'نعم، عبر alarabalmasi.com مع شحن مجاني للطلبات من 195 ريال بعد الخصم وتقسيط على 4 دفعات عبر تمارا.',
      },
    ],
  },
  766: {
    improvedTitle: 'عندك مناسبة؟ دليل تجهيز الإطلالة السعودية الكاملة (ثوب وشماغ ومشلح وشراقي)',
    seoTitle: 'تجهيز إطلالة المناسبات السعودية: ثوب ومشلح وشماغ وشراقي | العرب الماسي',
    metaDescription:
      'دليل عملي لتجهيز إطلالتك السعودية للمناسبات من العرب الماسي: تنسيق الثوب القلاب أو المطرز مع الشماغ والمشلح الأسود الذهبي والشراقي، مع دليل المقاسات وفروع جدة.',
    focusKeywords: [
      'تجهيز إطلالة المناسبات السعودية',
      'تنسيق الثوب والشماغ للمناسبات',
      'ثوب مطرز رجالي للمناسبات',
      'مشلح اسود ذهبي السعودية',
      'شراء ثوب وشماغ أونلاين السعودية',
    ],
    gscBackedKeywords: ['ثوب مطرز رجالي', 'مشلح اسود ذهبي', 'شراقي', 'ثوب جاهز', 'جدول مقاسات الثوب السعودي'],
    canonicalRole: 'دليل إطلالة المناسبات (Top-of-Funnel) يوزّع الزيارات إلى صفحات الثياب المطرزة والمشالح والشراقي.',
    geoDirectAnswer:
      'لتجهيز إطلالة سعودية رسمية للمناسبات دون حيرة، ابدأ بمراجعة مقاس الثوب (سادة أو قلاب أو مطرز سجنتشر)، ثم طابق الشماغ أو الغترة مع المناسبة، وأكمل الطقم بالمشلح المناسب والحذاء الشرقي (الشراقي). يوفر متجر العرب الماسي (alarabalmasi.com) جميع هذه القطع مع شحن مجاني من 195 ريال وأول استبدال مجاني خلال 10 أيام.',
    comparisonTable: {
      heading: 'جدول تجهيز الإطلالة السعودية حسب نوع المناسبة',
      headers: ['نوع المناسبة', 'الثوب الأنسب', 'غطاء الرأس', 'القطع المكملة'],
      rows: [
        ['زواج أو مناسبة كبرى', 'ثوب أبيض سادة أو قلاب كبك أو مطرز سجنتشر', 'شماغ أحمر فاخر (البسام، التاج، فالنتينو، دنهل) أو غترة بيضاء', 'مشلح أسود ذهبي + جزمة مناسبات أو شراقي'],
        ['عيد أو زيارة عائلية', 'ثوب أبيض أو سكري بياقة قلاب وسحاب مخفي', 'شماغ أحمر أو أبيض أو غترة شتوية في الشتاء', 'شراقي جلد مريح + طقم سبحة وقلم'],
        ['دوام يومي واجتماعات', 'ثوب جاهز عملي (أبيض، بيج، كحلي، رصاصي)', 'شماغ كلاسيك أو غترة بيضاء خفيفة', 'ملابس داخلية قطنية مريحة + حذاء رسمي'],
      ],
    },
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي القلاب (سحاب مخفي)', url: VERIFIED_LINKS.topProducts.thobeQallab },
      { label: 'الثوب السعودي المطرز سجنتشر', url: VERIFIED_LINKS.topProducts.thobeEmbroidered },
      { label: 'الأشمغة والغتر الرسمية والشتوية', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'المشالح والسديريات (مشلح أسود ذهبي)', url: VERIFIED_LINKS.categories.bishts },
      { label: 'الشراقي والأحذية الشرقية', url: VERIFIED_LINKS.categories.shoes },
    ],
    altPrefixAr: 'تنسيق الإطلالة السعودية الرسمية للمناسبات من العرب الماسي',
    featuredImage: {
      needsUpload: true,
      localFilename: 'saudi-occasion-look-guide.jpg',
      seoFilename: 'saudi-occasion-look-guide.webp',
      altAr: 'تنسيق تحريري لإطلالة سعودية رسمية تضم ثوباً أبيض وشماغاً وحذاءً شرقياً وسبحة وقلماً — العرب الماسي',
      altEn: 'Editorial flat-lay of a complete formal Saudi men outfit with white thobe, shemagh, black dress shoes, misbaha, and pen - Al Arab Al Masi',
      note: 'صورة غلاف تحريرية تعزز التفاعل البصري لمقال 766.',
    },
    faq: [
      {
        q: 'كيف أضمن اختيار مقاس الثوب الصحيح أونلاين قبل المناسبة؟',
        a: 'قِس طول وعرض أريح ثوب تلبسه حالياً وقارنه بجدول دليل مقاسات ثوب العرب على alarabalmasi.com؛ كما يغطي المتجر أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط.',
      },
      {
        q: 'هل يتوفر تقسيط وشحن مجاني على طلبات المناسبات في العرب الماسي؟',
        a: 'نعم، الشحن مجاني للطلبات من 195 ريال بعد الخصم عبر ريدبوكس والبريد السعودي، ويتوفر تقسيم المشتريات على 4 دفعات عبر تمارا.',
      },
    ],
  },
  572: {
    improvedTitle: 'كيف تختار ثوباً سعودياً جاهزاً يناسب دوامك ومناسباتك؟ دليل الياقة والمقاس 2026',
    seoTitle: 'كيف تختار ثوباً سعودياً جاهزاً؟ الياقة القلاب والسادة والمقاس | العرب الماسي',
    metaDescription:
      'دليل اختيار الثوب السعودي الجاهز (ياقة قلاب أم سادة، سحاب مخفي أم أزرار، جدول المقاسات) مع روابط ثوب العرب الجاهز وفروع جدة الثلاثة وأول استبدال مجاني.',
    focusKeywords: [
      'كيف تختار ثوب سعودي جاهز',
      'ثوب جاهز قلاب سحاب مخفي',
      'الفرق بين الياقة القلاب والسادة في الثوب',
      'جدول مقاسات الثوب السعودي الرجالي',
      'ثوب مطرز رجالي سعودي',
    ],
    gscBackedKeywords: ['ثوب جاهز', 'ثوب العرب', 'ثوب مطرز رجالي', 'جدول مقاسات الثوب السعودي', 'دليل مقاسات الثوب الرجالي', 'ثوب كحلي'],
    canonicalRole: 'دليل اختيار الثوب الجاهز على ووردبريس يغذي مباشرة صفحة تصنيف /categories/1325330/saudi-mens-thobes (3,864 ظهور) ودليل المقاسات.',
    geoDirectAnswer:
      'لاختيار ثوب سعودي جاهز بمقاس مضبوط دون تردد، حدّد أولاً الاستخدام (دوام يومي أم مناسبة)، ثم اختر بين الياقة السادة أو القلاب، وبين السحاب المخفي أو الأزرار الأمامية، وطابق الطول وعرض الصدر بجدول مقاسات ثوب العرب في alarabalmasi.com بدلاً من الاعتماد على الرقم وحده.',
    comparisonTable: {
      heading: 'مقارنة سريعة بين موديلات الثوب السعودي الجاهز في العرب الماسي',
      headers: ['التصميم', 'شكل الواجهة والإغلاق', 'الأنسب لـ', 'ملاحظة الاختيار'],
      rows: [
        ['ياقة سادة + سحاب مخفي', 'واجهة ناعمة ومرتبة بدون أزرار ظاهرة', 'الدوام اليومي والمظهر العصري الهادئ', 'مناسب جداً مع الشماغ والغترة بدون ازدحام'],
        ['ياقة قلاب + سحاب مخفي', 'ياقة مطوية بارزة تمنح وقفة واضحة حول الرقبة', 'الزيارات والمناسبات والدوام الرسمي', 'الأكثر طلباً لمن يفضل ثبات الياقة مع الشماغ'],
        ['ياقة سادة أو قلاب + أزرار أمامية', 'إغلاق تقليدي كلاسيكي (مع خيار كم سادة أو كبك)', 'المناسبات الرسمية ومحبي اللمسة الكلاسيكية', 'أكمام الكبك تبرز بشكل أنيق مع البشت والساعة'],
        ['ثوب مطرز سجنتشر', 'تطريز هادئ ومتزن على الياقة والصدر', 'الأعياد والمناسبات الخاصة واللقاءات المسائية', 'اختر المقاس بدقة لظهور التطريز بشكل متناسق'],
      ],
    },
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'تسوق جميع موديلات ثوب العرب الرجالي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'ثوب العرب أبيض قلاب سحاب مخفي', url: VERIFIED_LINKS.topProducts.thobeQallab },
      { label: 'ثوب العرب أبيض سادة سحاب مخفي', url: VERIFIED_LINKS.topProducts.thobeWhitePlain },
      { label: 'ثوب العرب المطرز سجنتشر', url: VERIFIED_LINKS.topProducts.thobeEmbroidered },
      { label: 'جدول ودليل مقاسات ثوب العرب', url: VERIFIED_LINKS.sizeGuide },
    ],
    altPrefixAr: 'تفاصيل اختيار الثوب السعودي الجاهز والياقة والمقاس من العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: 'saudi-occasion-look-guide.jpg',
      seoFilename: 'saudi-ready-thobe-guide-alarabalmasi.webp',
      altAr: 'صورة تحريرية لثوب سعودي أبيض مرتب مع مستلزماته الرسمية — دليل اختيار الثوب الجاهز من العرب الماسي',
      altEn: 'Editorial guide image for choosing a ready-made Saudi white thobe - Al Arab Al Masi',
      note: 'يحتفظ بـ featured_media=537 مع تصحيح الخطأ الإملائي وإضافة جدول المقارنة وروابط الفروع.',
    },
    faq: [
      {
        q: 'هل الياقة السادة أم القلاب أفضل للاستخدام اليومي؟',
        a: 'كلاهما عملي؛ الياقة السادة تمنح بساطة وهدوءاً في الواجهة، بينما القلاب تعطي تحديداً أوضح حول الرقبة وتنسجم مع تنسيق الشماغ اليومي.',
      },
      {
        q: 'كيف أتأكد من مقاس الثوب السعودي قبل الطلب أونلاين؟',
        a: 'افتح دليل مقاسات ثوب العرب على alarabalmasi.com وقس طول وعرض ثوب ترتاح له حالياً، وتذكر أن أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط.',
      },
    ],
  },
  780: {
    improvedTitle: 'دليل المستلزمات الرجالية في السعودية 2026 | متجر العرب الماسي ومعارض جدة',
    seoTitle: 'دليل المستلزمات الرجالية في السعودية 2026 | العرب الماسي',
    metaDescription:
      'مرجعك الشامل لشراء الثياب السعودية، الجلابيات المغربية والإماراتية، الأشمغة، المشالح، الشراقي والهدايا الرجالية من متجر العرب الماسي وفروعه الثلاثة في جدة.',
    focusKeywords: [
      'دليل المستلزمات الرجالية في السعودية',
      'متجر مستلزمات رجالية سعودي',
      'متجر العرب الماسي ثياب وأشمغة',
      'جلابيات مغربية واماراتية رجالية السعودية',
    ],
    gscBackedKeywords: ['العرب الماسي', 'جلابية مغربية رجالية', 'جلابية اماراتي رجالي', 'ثوب العرب', 'شراقي'],
    canonicalRole: 'مقال محوري شامل (Pillar Hub) على ووردبريس يربط كل تصنيفات alarabalmasi.com دون تكرار صورة 612.',
    geoDirectAnswer:
      'يجمع متجر العرب الماسي (alarabalmasi.com — مؤسسة العرب الماسي للتجارة، سجل تجاري 4030113177) أبرز المستلزمات الرجالية في السعودية تحت سقف واحد: ثياب ثوب العرب الرجالية والولادية، الجلابيات المغربية والإماراتية، الأشمغة والغتر، المشالح، الشراقي، والهدايا، مع توصيل داخل المملكة و3 معارض ميدانية مستقلة في جدة.',
    comparisonTable: {
      heading: 'دليل الأقسام الأساسية في متجر العرب الماسي وما يناسب كل احتياج',
      headers: ['القسم', 'الاستخدام الأساسي', 'أبرز الخيارات الموثقة', 'نقطة التحقق قبل الطلب'],
      rows: [
        ['ثوب العرب الرجالي والولادي', 'الدوام، المدارس، المناسبات', 'سادة، قلاب، سحاب مخفي، أزرار، كبك، مطرز سجنتشر', 'مراجعة جدول المقاسات (الطول والعرض)'],
        ['الجلابيات المغربية والإماراتية', 'الراحة المنزلية والاستقبال', 'جلابيات مغربية، جلابيات إماراتية، بجامات قطنية وستان', 'اختيار الخامة المناسبة للصيف أو الشتاء'],
        ['الأشمغة والغتر والمشالح', 'الرسميات والأعياد والزواجات', 'البسام، التاج، المراسيم، فالنتينو، بنتلي، دنهل، مشالح ملكية', 'تحديد المقاس (55–62) واللون المناسب'],
        ['الشراقي والهدايا والملابس الداخلية', 'التنسيق اليومي والإهداء', 'أحذية شرقية، دروش/كنج ميرلاند، ساعات وأقلام وسبح', 'تحديد مقاس الحذاء أو اختيار هدية بلا مقاس'],
      ],
    },
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'الجلابيات المغربية والإماراتية وملابس النوم', url: VERIFIED_LINKS.categories.jalabiyas },
      { label: 'ثوب العرب الرجالي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الأشمغة والغتر الأصلية', url: VERIFIED_LINKS.categories.shemaghs },
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
      {
        q: 'ما هي شروط الشحن المجاني والاستبدال في العرب الماسي؟',
        a: 'الشحن مجاني للطلبات من 195 ريال بعد الخصم عبر ريدبوكس والبريد السعودي، وأول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط المنشورة.',
      },
    ],
  },
  782: {
    improvedTitle: 'قبل أن تشتري الثوب والشماغ والهدية: الدليل الشامل من العرب الماسي 2026',
    seoTitle: 'قبل شراء الثوب والشماغ والهدية الرجالية | دليل العرب الماسي',
    metaDescription:
      'قائمة فحص عملية قبل شراء الثوب السعودي والشماغ والجلابية والهدية الرجالية من العرب الماسي: تجنب أخطاء المقاس والياقة والموديل مع روابط المتجر وفروع جدة.',
    focusKeywords: [
      'دليل شراء الثوب والشماغ السعودية',
      'نصائح قبل شراء ثوب جاهز أونلاين',
      'كيف تختار شماغ وثوب وهدية رجالية',
      'متجر العرب الماسي الرسمي',
    ],
    gscBackedKeywords: ['ثوب العرب', 'ثوب جاهز', 'جلابية مغربية رجالية', 'هدايا رجالية جدة', 'جدول مقاسات الثوب السعودي'],
    canonicalRole: 'دليل قرار الشراء العميق (1,790+ كلمة) يربط القارئ المتردد مباشرة بالمنتجات الأكثر بحثاً وسياسة الاستبدال المجاني.',
    geoDirectAnswer:
      'لتجنب أخطاء الشراء الإلكتروني في المستلزمات الرجالية السعودية، تحقق من 3 نقاط قبل إتمام الطلب: نوع الياقة والإغلاق ومقاس الطول/العرض في الثوب، رقم المقاس والإصدار الدقيق في الشماغ، وملاءمة الهدية للاستخدام اليومي للمُهدى إليه — مع الاستفادة من ميزة أول استبدال مجاني خلال 10 أيام في العرب الماسي.',
    comparisonTable: {
      heading: 'أكثر 4 أخطاء شائعة عند شراء المستلزمات الرجالية أونلاين وكيف تتفاداها',
      headers: ['القطعة', 'الخطأ الشائع', 'الحل العملي قبل الدفع'],
      rows: [
        ['الثوب الجاهز', 'الاعتماد على رقم المقاس فقط دون مراجعة عرض الصدر أو الياقة', 'مراجعة دليل مقاسات ثوب العرب وفحص صور الياقة والإغلاق'],
        ['الشماغ والغترة', 'اختيار ماركة مشهورة دون تحديد الإصدار أو المقاس (55–62)', 'تحديد الطول المناسب والتمييز بين الاستخدام اليومي والمناسبات'],
        ['الجلابية المنزلية', 'الخلط بين جلابية الاستقبال المغربية وجلابية النوم الخفيفة', 'التحقق من الخامة (صيفية/شتوية) والمقاس المريح للحركة'],
        ['الهدية الرجالية', 'اختيار قطعة تعتمد على مقاس غير مؤكد', 'اختيار قلم/سبحة/محفظة/ساعة أو استخدام ميزة «أرسل كهدية»'],
      ],
    },
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'ثوب العرب الرجالي', url: VERIFIED_LINKS.categories.thobes },
      { label: 'الجلابيات المغربية والإماراتية', url: VERIFIED_LINKS.categories.jalabiyas },
      { label: 'الأشمغة والغتر الأصلية', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'الساعات وأطقم الهدايا الرجالية', url: VERIFIED_LINKS.categories.gifts },
      { label: 'دليل مقاسات ثوب العرب', url: VERIFIED_LINKS.sizeGuide },
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
        q: 'كيف أطمئن عند الطلب لأول مرة من متجر العرب الماسي؟',
        a: 'الشحن مجاني للطلبات من 195 ريال بعد الخصم، وأول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط، مع إمكانية الاستلام والاستبدال عبر مركز السالم بحي السامر بجدة.',
      },
    ],
  },
  623: {
    improvedTitle: 'مستلزمات رجالية في جدة: دليل فروع حي السامر وسوق المرجان | العرب الماسي',
    seoTitle: 'فروع العرب الماسي في جدة: السالم والدفة (حي السامر وسوق المرجان)',
    metaDescription:
      'مقارنة واضحة بين معارض العرب الماسي الثلاثة في جدة (مركز السالم حي السامر، مركز الدفة حي السامر، مركز الدفة سوق المرجان بوابة 2 محل 205) مع الخرائط والواتساب.',
    focusKeywords: [
      'فروع العرب الماسي في جدة',
      'مستلزمات رجالية حي السامر جدة',
      'محل ثياب سوق المرجان جدة',
      'مركز السالم والدفة جدة',
    ],
    gscBackedKeywords: ['السالم للمستلزمات الرجالية', 'العرب الماسي', 'هدايا رجالية جدة', 'ثوب جاهز'],
    canonicalRole: 'دليل المقارنة المحلي لمدينة جدة يغذي صفحة /pages/branches وصفحات الفروع الثلاثة دون خلط جغرافي.',
    geoDirectAnswer:
      'ترتبط منظومة العرب الماسي بثلاثة معارض مستقلة في مدينة جدة: مركز السالم بحي السامر (أمام قاعة الرفيدي، 0539939530، المعتمد لاستلام واستبدال الأونلاين)، ومركز الدفة بحي السامر (بجوار بنك البلاد، 0561560303)، ومركز الدفة بسوق المرجان في حي الصفا بوابة 2 محل 205 (0558977126).',
    comparisonTable: BRANCH_COMPARISON_TABLE,
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
      note: 'يحتفظ بـ featured_media=625 مع إضافة جدول التمييز وروابط الواتساب الرسمية.',
    },
    faq: [
      {
        q: 'أي فرع أزوره لاستلام أو استبدال طلب المتجر الإلكتروني في جدة؟',
        a: 'مركز السالم بحي السامر (شارع وهيب بن عمير أمام قاعة الرفيدي — واتساب 0539939530) هو الفرع المعتمد لاستلام واستبدال طلبات المتجر الإلكتروني بعد تأكيد الجاهزية.',
      },
    ],
  },
  610: {
    improvedTitle: 'كيف تختار هدية رجالية فخمة (قلم وسبحة ومحفظة)؟ دليل الإهداء في السعودية وجدة',
    seoTitle: 'هدايا رجالية فخمة (قلم وسبحة ومحفظة) في جدة والسعودية | العرب الماسي',
    metaDescription:
      'أفكار ودليل عملي لاختيار هدية رجالية راقية للأب أو الزوج أو الأخ أو المدير (قلم، سبحة، محفظة، ساعة، شماغ) بدون حيرة المقاس، من العرب الماسي ومعارض جدة.',
    focusKeywords: [
      'هدايا رجالية فخمة السعودية',
      'هدايا رجالية جدة',
      'طقم قلم وسبحة ومحفظة رجالي',
      'أفكار هدايا رجالية بدون مقاس',
      'أطقم هدايا رجالية العرب الماسي',
    ],
    gscBackedKeywords: ['هدايا رجالية جدة', 'مشلح اسود ذهبي', 'شماغ المراسيم', 'العرب الماسي'],
    canonicalRole: 'دليل الإهداء الرجالي المستلهم من نية البحث السعودية (حسب المُهدى إليه وبلا مقاس) يغذي تصنيف الساعات والهدايا.',
    geoDirectAnswer:
      'لإهداء رجل في السعودية دون مخاطرة المقاس، اختر طقماً عملياً يجمع بين قلم راقٍ وسبحة ومحفظة أو ساعة، أو أضف شماغاً من ماركة معروفة إذا كنت تعرف مقاسه. يتيح متجر العرب الماسي (alarabalmasi.com) ميزة «أرسل كهدية» وتصنيف الساعات وأطقم الهدايا مع توفرها أيضاً في معارض جدة.',
    comparisonTable: {
      heading: 'دليل اختيار الهدية الرجالية حسب الشخص والمناسبة (بدون حيرة المقاس)',
      headers: ['لمن الهدية؟', 'الاقتراح العملي الأنسب', 'هل تحتاج معرفة المقاس؟'],
      rows: [
        ['للأب أو الجد', 'سبحة فاخرة + قلم أنيق + مشلح أو غترة/شماغ كلاسيك', 'السبحة والقلم لا تحتاج مقاساً'],
        ['للزوج أو العريس', 'طقم ساعة وقلم ومحفظة، أو طقم بيجامة عرسان فاخر', 'الأطقم والإكسسوارات لا تحتاج مقاساً'],
        ['للمدير أو زميل العمل', 'قلم معدني فاخر + محفظة جلدية رسمية بتغليف مرتب', 'لا تحتاج مقاساً وتناسب الذوق الرسمي'],
        ['للأخ أو الصديق (تخرج/ترقية)', 'طقم سبحة وقلم، أو شماغ إصدار 2026 مع علبة أنيقة', 'تُختار بسهولة حسب ذوقه اليومي'],
      ],
    },
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'الساعات وأطقم الهدايا الرجالية', url: VERIFIED_LINKS.categories.gifts },
      { label: 'الأشمغة الفاخرة للهدايا', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'المشالح والسديريات', url: VERIFIED_LINKS.categories.bishts },
      { label: 'معارض الهدايا في جدة (السامر وسوق المرجان)', url: VERIFIED_LINKS.branchesHub },
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
        q: 'ما أفضل هدية رجالية إذا لم أكن أعرف مقاس الشخص؟',
        a: 'أطقم القلم والسبحة والمحفظة والساعات الرجالية هي الخيار الأكثر أماناً، كما يوفر متجر العرب الماسي خيار «أرسل كهدية» مباشرة عند الطلب.',
      },
      {
        q: 'أين أجد محلات هدايا رجالية جاهزة في جدة؟',
        a: 'يمكنك زيارة مركز السالم بحي السامر (0539939530) أو مركز الدفة بسوق المرجان بوابة 2 محل 205 (0558977126) لمعاينة أطقم الهدايا قبل الشراء.',
      },
    ],
  },
  597: {
    improvedTitle: 'كيف تختار سكراب طبي مريح للدوام الطويل؟ دليل المقاس والخامة والجيوب في السعودية',
    seoTitle: 'دليل اختيار السكراب الطبي للدوام في السعودية | العرب الماسي',
    metaDescription:
      'كيف تختار سكراباً طبياً رجالياً أو نسائياً مريحاً للمناوبات الطويلة في السعودية: المقاس، حرية الحركة، توزيع الجيوب، مع رابط الطلب من العرب الماسي وأول استبدال مجاني.',
    focusKeywords: [
      'سكراب طبي مريح السعودية',
      'سكراب طبي رجالي ونسائي جدة',
      'كيف تختار مقاس السكراب الطبي',
      'شراء سكراب طبي أونلاين السعودية',
    ],
    gscBackedKeywords: ['سكراب طبي رجالي نسائي', 'العرب الماسي'],
    canonicalRole: 'دليل شراء السكراب الطبي يغذي مباشرة صفحة المنتج (4.82% CTR في GSC) وتصنيف الملابس الداخلية القطنية.',
    geoDirectAnswer:
      'السكراب الطبي المناسب للمناوبات الطويلة هو الذي يمنحك حرية كاملة في حركة الكتف والجلوس دون شد، مع توزيع عملي للجيوب ومطابقة لون الزي المعتمد في جهة عملك. يتوفر السكراب الطبي الرجالي والنسائي في متجر العرب الماسي (alarabalmasi.com) مع أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام.',
    comparisonTable: {
      heading: 'معايير فحص السكراب الطبي قبل الشراء للمناوبات الطويلة',
      headers: ['المعيار', 'ما يجب التأكد منه', 'لماذا يفرق في الدوام؟'],
      rows: [
        ['القصّة وحرية الحركة', 'اتساع الكتف والذراعين والجلوس دون شد', 'يمنع الإرهاق خلال المناوبات الممتدة 8–12 ساعة'],
        ['توزيع الجيوب', 'جيوب عملية للأقلام والبطاقة والجوال دون ترهل', 'يحفظ أدواتك الأساسية قريبة ومنظمة طوال الشفت'],
        ['الطبقة الداخلية', 'ارتداء فنيلة قطنية خفيفة ومريحة تحت السكراب', 'يزيد التهوية والراحة طوال اليوم في أجواء العمل'],
      ],
    },
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'صفحة السكراب الطبي في متجر العرب الماسي', url: VERIFIED_LINKS.topProducts.scrubs },
      { label: 'الملابس الداخلية القطنية المريحة تحت الدوام', url: VERIFIED_LINKS.categories.underwear },
      { label: 'سياسة الشحن وأول استبدال مجاني خلال 10 أيام', url: VERIFIED_LINKS.exchange },
    ],
    altPrefixAr: 'اختيار السكراب الطبي المريح للدوام من العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: null,
      seoFilename: null,
      altAr: 'سكراب طبي مريح للدوام اليومي في السعودية — العرب الماسي',
      altEn: 'Comfortable medical scrubs guide in Saudi Arabia - Al Arab Al Masi',
      note: 'يحتفظ بـ featured_media=472 مع إضافة جدول المعايير وروابط الفروع وخدمة العملاء.',
    },
    faq: [
      {
        q: 'هل يمكن استبدال مقاس السكراب الطبي بعد الاستلام من العرب الماسي؟',
        a: 'نعم، يوفر متجر العرب الماسي أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق السياسة المنشورة.',
      },
    ],
  },
  583: {
    improvedTitle: 'شماغ أم غترة؟ 5 فروق عملية ودليل الاختيار مع الثوب السعودي 2026 | العرب الماسي',
    seoTitle: 'الفرق بين الشماغ والغترة وأفضل الماركات في السعودية | العرب الماسي',
    metaDescription:
      'مقارنة عملية بين الشماغ الأحمر والأبيض والغترة (الصيفية والشتوية) مع الثوب السعودي: البسام، التاج، المراسيم، فالنتينو، بنتلي ودنهل مع روابط الشراء وفروع جدة.',
    focusKeywords: [
      'الفرق بين الشماغ والغترة',
      'شماغ أم غترة مع الثوب السعودي',
      'أفضل ماركة شماغ في السعودية',
      'شماغ البسام والمراسيم والتاج جدة',
      'غترة بيضاء وغترة شتوية رجالية',
    ],
    gscBackedKeywords: ['شماغ المراسيم', 'غترة اللقاء', 'غترة شتوية', 'شماغ البسام', 'ثوب العرب'],
    canonicalRole: 'دليل مقارنة الشماغ والغترة المستلهم من المنافسين (جدول فروق + ماركات) يغذي تصنيف /categories/1325316/shemaghs-ghutras-shawls-collection.',
    geoDirectAnswer:
      'الفرق العملي بين الشماغ والغترة يعود إلى النقشة والاستخدام: الشماغ يتميز بنقشة بارزة (أحمر أو أبيض) ويمنح حضوراً رسمياً قوياً مع الثوب السادة، بينما الغترة البيضاء أو الشتوية تمنح مظهرًا أهدأ وأخف للدوام أو الأجواء الباردة. يوفر متجر العرب الماسي (alarabalmasi.com) تشكيلة أصلية تشمل البسام، التاج، المراسيم، فالنتينو، بنتلي، دنهل، والغتر الصيفية والشتوية.',
    comparisonTable: {
      heading: 'مقارنة 5 فروق جوهرية بين الشماغ والغترة قبل الشراء',
      headers: ['وجه المقارنة', 'الشماغ (أحمر / أبيض)', 'الغترة (بيضاء / شتوية)'],
      rows: [
        ['النقشة والشكل', 'نقشة منسوجة واضحة تبرز تفاصيل الإطلالة', 'قماش أبيض سادة هادئ (أو مطرز/دافئ في الغترة الشتوية)'],
        ['أفضل استخدام', 'المناسبات الرسمية، الأعياد، والدوام الرسمي', 'الدوام اليومي، الأجواء الحارة، أو الغترة الشتوية للبرد'],
        ['التنسيق مع الثوب', 'يتوازن بقوة مع الثوب الأبيض أو السكري السادة', 'ممتاز مع الثوب الأبيض أو الملون أو المطرز الهادئ'],
        ['الثبات والتشخيصة', 'نسيج قطني متماسك يساعد على ثبات التشخيصة', 'خفيفة وسلسة في الترتيب اليومي السريع'],
        ['أبرز الخيارات في العرب الماسي', 'البسام، التاج، المراسيم، ماريو فالنتينو، بنتلي، ميلانو، دنهل', 'الغتر البيضاء (مثل العطار واللقاء) والغتر الشتوية المطرزة'],
      ],
    },
    branchFocus: 'all',
    recommendedCategories: [
      { label: 'تصفح جميع الأشمغة والغتر الأصلية والشتوية', url: VERIFIED_LINKS.categories.shemaghs },
      { label: 'ثوب العرب الرجالي الجاهز', url: VERIFIED_LINKS.categories.thobes },
      { label: 'معاينة الأشمغة والغتر في فروع جدة الثلاثة', url: VERIFIED_LINKS.branchesHub },
    ],
    altPrefixAr: 'مقارنة الشماغ والغترة وتنسيقهما مع الثوب السعودي — العرب الماسي',
    featuredImage: {
      needsUpload: false,
      localFilename: null,
      seoFilename: null,
      altAr: 'شماغ وغترة أصلية للتنسيق مع الثوب السعودي — العرب الماسي',
      altEn: 'Saudi shemagh vs ghutra styling guide with thobe - Al Arab Al Masi',
      note: 'يحتفظ بـ featured_media=586 مع إضافة جدول الفروق الـ 5 وروابط الفروع والواتساب.',
    },
    faq: [
      {
        q: 'ما أشهر ماركات الأشمغة والغتر المتوفرة في متجر العرب الماسي؟',
        a: 'تضم التشكيلة أشمغة البسام، التاج، المراسيم، ماريو فالنتينو، بنتلي، ميلانو إيطاليا، ريتشي لندن، دنهل، بالإضافة إلى الغتر البيضاء والغتر الشتوية حسب التوفر الفعلي في المتجر والفروع.',
      },
      {
        q: 'كيف أختار مقاس الشماغ المناسب لطولي؟',
        a: 'يُختار مقاس الشماغ (55، 58، 60، 62) بناءً على طولك وتفضيلك في طول الأطراف؛ وتتوفر المقاسات الفعلية مباشرة في صفحة كل منتج على alarabalmasi.com.',
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
    hasMaps: links.some(
      (l) => l.includes('maps.google') || l.includes('google.com/maps') || l.includes('maps.app.goo.gl'),
    ),
    hasGeoDirectAnswer: html.includes('data-geo-summary="true"'),
    hasComparisonTable: /<table\b/i.test(html),
  };
}

function promoteHeadingsInLegacyHtml(html: string, fixes: string[]): string {
  let out = html;
  let promoted = 0;

  out = out.replace(/<p[^>]*>\s*<(?:strong|b)>([^<]{8,140})<\/(?:strong|b)>\s*<\/p>/gi, (_m, title) => {
    const clean = title.trim();
    if (/^\d+\./.test(clean)) {
      promoted++;
      return `\n<!-- wp:heading {"level":3} -->\n<h3>${clean}</h3>\n<!-- /wp:heading -->\n`;
    }
    promoted++;
    return `\n<!-- wp:heading -->\n<h2>${clean}</h2>\n<!-- /wp:heading -->\n`;
  });

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

function buildGeoDirectAnswerBox(spec: PostSpec): string {
  return `<!-- wp:quote -->
<blockquote class="wp-block-quote" data-geo-summary="true">
  <p><strong>الخلاصة السريعة:</strong> ${spec.geoDirectAnswer}</p>
</blockquote>
<!-- /wp:quote -->`;
}

function buildComparisonTableHtml(table: ComparisonTableSpec): string {
  const ths = table.headers.map((h) => `<th>${h}</th>`).join('');
  const trs = table.rows
    .map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('\n    ');
  return `<!-- wp:heading -->
<h2>${table.heading}</h2>
<!-- /wp:heading -->
<!-- wp:table -->
<figure class="wp-block-table">
<table>
  <thead><tr>${ths}</tr></thead>
  <tbody>
    ${trs}
  </tbody>
</table>
</figure>
<!-- /wp:table -->`;
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
  <li><strong>أوقات العمل / التنسيق:</strong> ${b.hours}.</li>
  <li><strong>الاستقلال والخدمة:</strong> ${b.role}</li>
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

${buildComparisonTableHtml(spec.comparisonTable)}

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
<p><strong>خدمة عملاء المتجر الإلكتروني الموحدة:</strong> <a href="${VERIFIED_LINKS.supportWa}" target="_blank" rel="noopener">${STORE_IDENTITY.legal.unifiedCustomerCareWhatsApp}</a> · ${STORE_IDENTITY.legal.entityName} (السجل التجاري: ${STORE_IDENTITY.legal.crNumber} · توثيق الأعمال: 0000341910 · العلامة المسجلة: ${STORE_IDENTITY.legal.trademarkNumber}).</p>

<!-- wp:heading -->
<h2>أسئلة شائعة</h2>
<!-- /wp:heading -->
${faqHtml}
`.trim();
}

function buildArticleSchemaJsonLd(post: WpRawPost, spec: PostSpec): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: spec.improvedTitle,
      description: spec.metaDescription,
      inLanguage: 'ar-SA',
      mainEntityOfPage: post.link,
      datePublished: post.date,
      dateModified: '2026-11-27',
      keywords: [...new Set([...spec.focusKeywords, ...spec.gscBackedKeywords])].join(', '),
      author: {
        '@type': 'Organization',
        name: STORE_IDENTITY.brandAr,
        url: STORE_IDENTITY.officialUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: STORE_IDENTITY.legal.entityName,
        url: STORE_IDENTITY.officialUrl,
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: spec.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    },
  ];

  if (spec.branchFocus !== 'all') {
    const b = VERIFIED_LINKS.branches[spec.branchFocus];
    graph.push({
      '@type': 'ClothingStore',
      name: b.name,
      url: b.pageUrl,
      telephone: b.phoneIntl,
      hasMap: b.mapsUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: b.address,
        addressLocality: 'جدة',
        addressCountry: 'SA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: b.lat,
        longitude: b.lng,
      },
      parentOrganization: {
        '@type': 'Organization',
        name: STORE_IDENTITY.brandAr,
        url: STORE_IDENTITY.officialUrl,
      },
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function enhanceWordPressPosts(rawPosts: WpRawPost[]): EnhancedWpArticle[] {
  return rawPosts.map((post) => {
    const spec = POST_SPECS[post.id];
    const originalTitle = post.title.rendered.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    let html = post.content.rendered || '';
    const metricsBefore = measureHtml(html);
    const fixes: string[] = [];

    if (post.id === 572 && html.includes('ختر الثوب الجاهز')) {
      html = html.replace('ختر الثوب الجاهز', 'اختر الثوب الجاهز');
      fixes.push('تصحيح الخطأ الإملائي في افتتاحية المقال («ختر الثوب» ← «اختر الثوب»).');
    }

    if (metricsBefore.h2Count === 0) {
      html = promoteHeadingsInLegacyHtml(html, fixes);
    }

    if (metricsBefore.missingAltCount > 0) {
      html = fixMissingImageAlts(html, spec?.altPrefixAr || originalTitle, fixes);
    }

    if (spec) {
      html = `${buildGeoDirectAnswerBox(spec)}\n\n${html.trim()}\n\n${buildStoreAndBranchesBlock(spec)}`;
      fixes.push(
        'إضافة صندوق «الخلاصة السريعة» القابل للاقتباس في محركات الذكاء الاصطناعي (GEO/AEO) في أعلى المقال.',
      );
      fixes.push(
        'إضافة جدول مقارنة عملي مستلهم من أفضل المقالات المنافسة في السعودية ومدعوم بكلمات Search Console الفعلية.',
      );
      fixes.push(
        'إضافة روابط التصنيفات الموثقة (HTTP 200) + مواقع الفروع في جدة مع خرائط Google وأرقام الواتساب + قسم FAQ + ملف Schema JSON-LD نظيف.',
      );
      if (spec.featuredImage.needsUpload) {
        fixes.push(
          `تجهيز صورة غلاف تحريرية جديدة (${spec.featuredImage.seoFilename}) مع ALT عربي وإنجليزي (${spec.featuredImage.note}).`,
        );
      }
    }

    const metricsAfter = measureHtml(html);
    const schemaJsonLd = spec
      ? buildArticleSchemaJsonLd(post, spec)
      : { '@context': 'https://schema.org', '@type': 'Article', headline: originalTitle };

    return {
      id: post.id,
      originalUrl: post.link,
      slug: post.slug,
      originalTitle,
      improvedTitle: spec?.improvedTitle || originalTitle,
      seoTitle: spec?.seoTitle || originalTitle,
      metaDescription: spec?.metaDescription || '',
      focusKeywords: spec?.focusKeywords || [],
      gscBackedKeywords: spec?.gscBackedKeywords || [],
      canonicalRole: spec?.canonicalRole || '',
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
      schemaJsonLd,
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
  const schemaDir = path.join(repoRoot, 'wordpress', 'schema');
  fs.mkdirSync(articlesDir, { recursive: true });
  fs.mkdirSync(schemaDir, { recursive: true });

  for (const art of enhanced) {
    const outHtmlPath = path.join(articlesDir, `post-${art.id}.html`);
    const outSchemaPath = path.join(schemaDir, `post-${art.id}.jsonld`);
    const headerComment = [
      `<!--`,
      `  Post ID: ${art.id}`,
      `  Permalink (DO NOT CHANGE): ${art.originalUrl}`,
      `  Canonical Role: ${art.canonicalRole}`,
      `  Improved Title: ${art.improvedTitle}`,
      `  SEO Title: ${art.seoTitle}`,
      `  Meta Description: ${art.metaDescription}`,
      `  Focus Keywords: ${art.focusKeywords.join(' | ')}`,
      `  GSC-Backed Keywords: ${art.gscBackedKeywords.join(' | ')}`,
      `  Featured Image: ${art.featuredImagePlan.seoFilename || 'keep existing'} | ALT AR: ${art.featuredImagePlan.altAr}`,
      `-->`,
    ].join('\n');
    fs.writeFileSync(outHtmlPath, `${headerComment}\n${art.htmlContent}\n`, 'utf8');
    fs.writeFileSync(outSchemaPath, `${JSON.stringify(art.schemaJsonLd, null, 2)}\n`, 'utf8');
  }

  const manifest = enhanced.map(({ htmlContent: _omitHtml, schemaJsonLd: _omitSchema, ...summary }) => ({
    ...summary,
    htmlFile: `wordpress/articles/post-${summary.id}.html`,
    schemaFile: `wordpress/schema/post-${summary.id}.jsonld`,
  }));
  const manifestPath = path.join(repoRoot, 'wordpress', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return { count: enhanced.length, manifestPath, articles: enhanced };
}
