/**
 * الهوية الرسمية الثابتة لمنظومة العرب الماسي — AL ARAB AL MASI EXECUTIVE GROWTH OS
 * الإصدار الموحّد: 27 نوفمبر 2026
 */

export interface BranchProfile {
  readonly id: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly city: string;
  readonly district: string;
  readonly addressAr: string;
  readonly independentIdentity: true;
  readonly notes: string;
}

export interface StrategicTarget {
  readonly id: string;
  readonly metric: string;
  readonly targetLabel: string;
  readonly threshold: number | null;
  readonly unit: string;
  readonly governanceNote: string;
}

export const EXECUTIVE_OS_VERSION = '2026-11-27';

export const STORE_IDENTITY = {
  brandAr: 'العرب الماسي',
  brandEn: 'Al Arab Al Masi',
  officialUrl: 'https://alarabalmasi.com/',
  blogUrl: 'https://alarabalmasi.com/blogs',
  platform: 'Zid (زد)',
  referenceTheme: 'Soft 1.0.0',
  themeVerificationRule: 'يجب التحقق من الإصدار الحالي للثيم قبل أي تعديل تقني.',
  market: 'المملكة العربية السعودية',
  primaryCity: 'جدة',
  timezone: 'Asia/Riyadh',
  currency: 'SAR',
  legal: {
    entityName: 'مؤسسة العرب الماسي للتجارة',
    crNumber: '4030113177',
    unifiedNationalNumber: '7015089399',
    vatNumber: '312669206500003',
    trademarkNumber: 'TM-01-00-34943-26 (الفئة 25)',
    unifiedCustomerCareWhatsApp: '0539939570',
    socialHandle: '@alarabalmasi',
  },
  publishedPolicies: {
    freeShippingThreshold: 'شحن مجاني من 195 ريال بعد الخصم عبر ريدبوكس والبريد السعودي',
    firstExchange: 'أول استبدال للمقاس أو اللون مجاني الشحن خلال 10 أيام وفق الشروط',
    installments: 'قسّم مشترياتك على 4 دفعات مع تمارا (Tamara)',
    onlineOrderPickupBranch: 'مركز السالم بحي السامر (بعد تأكيد الجاهزية وتوفر البديل)',
  },
  executiveSheetId: '1GtRjDlzEBy62EOjMBV9Zeyuj5vS-aR_hxlPtK2M_e1w',
  executiveSheetUrl: 'https://docs.google.com/spreadsheets/d/1GtRjDlzEBy62EOjMBV9Zeyuj5vS-aR_hxlPtK2M_e1w/edit',
  referenceDocs: {
    searchReport: 'https://docs.google.com/spreadsheets/d/1yelHDWAevnxvD8bMBpNPV6KsM1e60TcqUSkkpIFRujk/edit',
    operationsGuide: 'https://docs.google.com/document/d/1p5IeQ8cb-rMXKj0qW_tjdWf3Ifj876CNnXcStmeCA7w/edit',
    settlementsV2: 'https://docs.google.com/document/d/17HZDSCfdwKu8F1gIGu_FI-PCielGtWB3Y7noCToEG30/edit',
    revenueReport: 'https://docs.google.com/document/d/1aISAPsNea2KjJtXumqTXTUS68-JLSx3heB1ZpEJlXAc/edit',
  },
} as const;

/**
 * الفروع الأرضية المستقلة — يحافظ الوكيل على استقلال هوية وحسابات ومخزون وحملات كل فرع.
 */
export const BRANCHES: readonly BranchProfile[] = [
  {
    id: 'alsalem-alsamer',
    nameAr: 'مركز السالم للمستلزمات الرجالية — حي السامر',
    nameEn: 'Al Salem Center — Al Samer',
    city: 'جدة',
    district: 'حي السامر',
    addressAr: 'جدة، حي السامر، شارع وهيب بن عمير، أمام قاعة الرفيدي (واتساب الفرع: 0539939530)',
    independentIdentity: true,
    notes: 'الفرع المعتمد لاستلام واستبدال طلبات المتجر الإلكتروني بعد تأكيد الجاهزية، مع استقلال حساباته ومخزونه وحملاته.',
  },
  {
    id: 'aldaffah-alsamer',
    nameAr: 'مركز الدفة للمستلزمات الرجالية — حي السامر',
    nameEn: 'Al Daffah Center — Al Samer',
    city: 'جدة',
    district: 'حي السامر',
    addressAr: 'جدة، حي السامر، شارع وهيب بن عمير، بجوار بنك البلاد (واتساب الفرع: 0561560303)',
    independentIdentity: true,
    notes: 'خبرة تزيد على 20 عاماً — حسابات ومخزون وهوية وحملات إعلانية مستقلة.',
  },
  {
    id: 'aldaffah-almarjan',
    nameAr: 'مركز الدفة للمستلزمات الرجالية — سوق المرجان',
    nameEn: 'Al Daffah Center — Al Marjan Souq',
    city: 'جدة',
    district: 'حي الصفا — سوق المرجان',
    addressAr: 'جدة، حي الصفا، سوق المرجان، بوابة 2، محل 205 (واتساب الفرع: 0558977126)',
    independentIdentity: true,
    notes: 'حسابات ومخزون وهوية وحملات إعلانية مستقلة.',
  },
] as const;

export const STRATEGIC_TARGETS: readonly StrategicTarget[] = [
  {
    id: 'roas-admin',
    metric: 'ROAS الإداري',
    targetLabel: '>= 3.0x (هدف إداري) مع مراعاة Break-even والربحية الفعلية',
    threshold: 3.0,
    unit: 'x',
    governanceNote: 'الدليل التشغيلي يشير أيضًا لمستهدف 4.5x؛ لا تُزاد الميزانية قبل إثبات القياس والتحويلات.',
  },
  {
    id: 'cvr',
    metric: 'معدل التحويل CVR',
    targetLabel: 'رفع مستدام مبني على اختبارات CRO الفعلية',
    threshold: null,
    unit: '%',
    governanceNote: 'يحسب فقط من الطلبات المؤكدة ÷ الجلسات المطابقة × 100.',
  },
  {
    id: 'ctr',
    metric: 'معدل النقر المؤهل CTR',
    targetLabel: 'جلب نقرات ذات نية شراء حقيقية (مقارنة آخر 28 يومًا مكتملة)',
    threshold: null,
    unit: '%',
    governanceNote: 'ارتفاع CTR مع انخفاض الربحية أو ارتفاع CPA يُعد فشلًا للنسخة.',
  },
  {
    id: 'cac-cpa',
    metric: 'تكلفة الاكتساب CAC والطلب CPA',
    targetLabel: 'خفض مستمر ضمن هامش المساهمة الآمن',
    threshold: null,
    unit: 'SAR',
    governanceNote: 'الإنفاق الإعلاني ÷ الطلبات المنسوبة الحقيقية في زد.',
  },
  {
    id: 'aov',
    metric: 'متوسط قيمة الطلب AOV',
    targetLabel: 'رفع عبر الباقات والمكملات دون ضغط مضلل',
    threshold: null,
    unit: 'SAR',
    governanceNote: 'صافي إيرادات الطلبات ÷ عدد الطلبات المطابقة.',
  },
] as const;

export const SOURCE_OF_TRUTH_ORDER = [
  'زد (Zid) للبيانات الحالية للأسعار والمخزون والخيارات والطلبات',
  'المورد والعينة الأصلية للمواصفات والخامات',
  'السياسات المنشورة للشحن والاستبدال والاسترجاع',
  'Google Search Console لبيانات البحث العضوي',
  'Google Merchant Center لأهلية المنتجات',
  'منصات الإعلانات للإنفاق والأداء الإعلاني',
  'الطلبات الفعلية والتكاليف لحساب الربحية',
  'المراجع الرسمية للمتجر للهوية والفروع والضوابط الثابتة',
] as const;

export const EXPERT_LENSES = [
  'الإدارة التنفيذية والتخطيط الاستراتيجي',
  'التجارة الإلكترونية ومنصة زد',
  'SEO التقني والتجاري',
  'GEO وAEO ومحركات الذكاء الاصطناعي',
  'Local SEO وخرائط Google',
  'تحسين معدل النقر CTR',
  'تحسين معدل التحويل CRO',
  'علم نفس المستهلك السعودي',
  'الاقتصاد السلوكي والتسويق العاطفي',
  'كتابة المحتوى التجاري والإقناعي',
  'Google Merchant Center',
  'Google Ads',
  'TikTok Ads',
  'Snapchat Ads',
  'Meta Ads',
  'تحليل البيانات والإسناد التسويقي',
  'البرمجة وتحسين سرعة المتجر',
  'الذكاء التنافسي',
  'إدارة المنتجات والمخزون',
  'خدمة العملاء واسترجاع السلات المتروكة',
  'التصميم والمونتاج والإخراج السينمائي',
  'الربحية والحوكمة ومراقبة الجودة',
] as const;
