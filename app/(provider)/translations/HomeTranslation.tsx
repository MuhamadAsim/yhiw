// translations.ts
// Central language config for English & Arabic
// Usage: import { t, serviceNameToArabic } from './i18n/translations';

export type Language = 'en' | 'ar';

// ─────────────────────────────────────────────
// SERVICE TRANSLATIONS
// Keys match exactly what the backend returns in English
// ─────────────────────────────────────────────
export const SERVICE_TRANSLATIONS: Record<string, { en: string; ar: string; id: number }> = {
  'Towing': {
    id: 1,
    en: 'Towing',
    ar: 'سحب السيارة',
  },
  'Roadside Assistance': {
    id: 2,
    en: 'Roadside Assistance',
    ar: 'المساعدة على الطريق',
  },
  'Fuel Delivery': {
    id: 3,
    en: 'Fuel Delivery',
    ar: 'توصيل الوقود',
  },
  'Battery Replacement': {
    id: 4,
    en: 'Battery Replacement',
    ar: 'تبديل البطارية',
  },
  'AC Gas Refill': {
    id: 5,
    en: 'AC Gas Refill',
    ar: 'إعادة شحن غاز التكييف',
  },
  'Tire Replacement': {
    id: 6,
    en: 'Tire Replacement',
    ar: 'تبديل الإطارات',
  },
  'Oil Change': {
    id: 7,
    en: 'Oil Change',
    ar: 'تغيير الزيت',
  },
  'Inspection / Repair': {
    id: 8,
    en: 'Inspection / Repair',
    ar: 'الفحص والإصلاح',
  },
  'Car Wash': {
    id: 9,
    en: 'Car Wash',
    ar: 'غسيل السيارة',
  },
  'Car Detailing': {
    id: 10,
    en: 'Car Detailing',
    ar: 'تلميع وتنظيف السيارة',
  },
  'Car Rental': {
    id: 11,
    en: 'Car Rental',
    ar: 'تأجير السيارات',
  },
  'Spare Parts': {
    id: 12,
    en: 'Spare Parts',
    ar: 'قطع الغيار',
  },
};

// ─────────────────────────────────────────────
// HELPER: Translate a service name from backend
// Usage: serviceNameToArabic('Towing') → 'سحب السيارة'
// If not found, returns the original English name (safe fallback)
// ─────────────────────────────────────────────
export const getServiceName = (englishName: string, lang: Language): string => {
  const match = SERVICE_TRANSLATIONS[englishName];
  if (!match) return englishName; // safe fallback
  return lang === 'ar' ? match.ar : match.en;
};

// ─────────────────────────────────────────────
// ALL UI TRANSLATIONS
// ─────────────────────────────────────────────
export const TRANSLATIONS = {
  // ── Header ──────────────────────────────────
  providerIdLabel: {
    en: 'PROVIDER ID',
    ar: 'معرف المزود',
  },

  // ── Profile ─────────────────────────────────
  verified: {
    en: 'VERIFIED',
    ar: 'موثق',
  },
  unverified: {
    en: 'UNVERIFIED',
    ar: 'غير موثق',
  },
  jobs: {
    en: 'Jobs',
    ar: 'وظائف',
  },

  // ── Status ──────────────────────────────────
  online: {
    en: 'ONLINE',
    ar: 'متصل',
  },
  offline: {
    en: 'OFFLINE',
    ar: 'غير متصل',
  },
  acceptingJobs: {
    en: 'ACCEPTING JOBS',
    ar: 'قبول الوظائف',
  },
  notAccepting: {
    en: 'NOT ACCEPTING',
    ar: 'عدم القبول',
  },

  // ── Performance ─────────────────────────────
  todaysPerformance: {
    en: "TODAY'S PERFORMANCE",
    ar: 'أداء اليوم',
  },
  viewAll: {
    en: 'VIEW ALL',
    ar: 'عرض الكل',
  },
  bhd: {
    en: 'BHD',
    ar: 'د.ب',
  },
  jobsLabel: {
    en: 'JOBS',
    ar: 'وظائف',
  },
  hoursLabel: {
    en: 'HOURS',
    ar: 'ساعات',
  },
  ratingLabel: {
    en: 'RATING',
    ar: 'التقييم',
  },

  // ── Recent Jobs ─────────────────────────────
  recentJobs: {
    en: 'RECENT JOBS',
    ar: 'الوظائف الأخيرة',
  },
  history: {
    en: 'HISTORY',
    ar: 'السجل',
  },
  noRecentJobs: {
    en: 'No recent jobs',
    ar: 'لا توجد وظائف حديثة',
  },
  completed: {
    en: 'COMPLETED',
    ar: 'مكتمل',
  },
  cancelled: {
    en: 'CANCELLED',
    ar: 'ملغي',
  },
  inProgress: {
    en: 'IN PROGRESS',
    ar: 'قيد التنفيذ',
  },

  // ── Location Card ────────────────────────────
  currentLocation: {
    en: 'CURRENT LOCATION',
    ar: 'الموقع الحالي',
  },
  manualLocation: {
    en: 'MANUAL LOCATION',
    ar: 'الموقع اليدوي',
  },
  notSet: {
    en: 'Not set',
    ar: 'غير محدد',
  },
  updateLocation: {
    en: 'UPDATE LOCATION',
    ar: 'تحديث الموقع',
  },
  changeLocation: {
    en: 'CHANGE LOCATION',
    ar: 'تغيير الموقع',
  },

  // ── Bottom Buttons ───────────────────────────
  viewEarnings: {
    en: 'VIEW EARNINGS',
    ar: 'عرض الأرباح',
  },
  mySchedule: {
    en: 'MY SCHEDULE',
    ar: 'جدولي',
  },

  // ── Location Modal ───────────────────────────
  selectLocationMode: {
    en: 'Select Location Mode',
    ar: 'اختر وضع الموقع',
  },
  autoUpdateLocation: {
    en: 'Auto-update Location',
    ar: 'تحديث الموقع تلقائياً',
  },
  autoUpdateDescription: {
    en: 'Your location will update every 10 seconds automatically',
    ar: 'سيتم تحديث موقعك كل 10 ثوانٍ تلقائياً',
  },
  manualLocationTitle: {
    en: 'Manual Location',
    ar: 'الموقع اليدوي',
  },
  manualLocationDescription: {
    en: 'Pick a location on the map (will be sent every 10 seconds)',
    ar: 'اختر موقعاً على الخريطة (سيتم إرساله كل 10 ثوانٍ)',
  },
  cancel: {
    en: 'Cancel',
    ar: 'إلغاء',
  },

  // ── Map Picker ───────────────────────────────
  selectLocation: {
    en: 'Select Location',
    ar: 'اختر الموقع',
  },
  done: {
    en: 'Done',
    ar: 'تم',
  },
  searchPlaceholder: {
    en: 'Search for a location',
    ar: 'ابحث عن موقع',
  },
  selectedLocation: {
    en: 'Selected Location',
    ar: 'الموقع المحدد',
  },

  // ── Alerts ───────────────────────────────────
  locationSet: {
    en: 'Location Set',
    ar: 'تم تحديد الموقع',
  },
  locationSetMessage: {
    en: 'Manual location has been set successfully.',
    ar: 'تم تعيين الموقع اليدوي بنجاح.',
  },
  noJobRequests: {
    en: 'No Job Requests',
    ar: 'لا توجد طلبات وظائف',
  },
  noPendingJobs: {
    en: 'No pending job requests at the moment.',
    ar: 'لا توجد طلبات وظائف معلقة في الوقت الحالي.',
  },
  loadingNextRequest: {
    en: 'Loading next request...',
    ar: 'جارٍ تحميل الطلب التالي...',
  },
  ok: {
    en: 'OK',
    ar: 'حسناً',
  },
  locationPermissionRequired: {
    en: 'Location Permission Required',
    ar: 'مطلوب إذن الموقع',
  },
  locationPermissionMessage: {
    en: 'Please enable location services to use auto-update location.',
    ar: 'يرجى تفعيل خدمات الموقع لاستخدام التحديث التلقائي.',
  },
  settings: {
    en: 'Settings',
    ar: 'الإعدادات',
  },
  statusUpdateFailed: {
    en: 'Status Update Failed',
    ar: 'فشل تحديث الحالة',
  },
  statusUpdateMessage: {
    en: 'Could not update your status. Please check your connection and try again.',
    ar: 'تعذر تحديث حالتك. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
  },
  error: {
    en: 'Error',
    ar: 'خطأ',
  },
  locationError: {
    en: 'Failed to get your current location. Please try again.',
    ar: 'فشل الحصول على موقعك الحالي. يرجى المحاولة مرة أخرى.',
  },
  // Add these to your translations object
  success: {
    en: 'Success',
    ar: 'نجاح'
  },
  autoLocationActivated: {
    en: 'Auto location activated. Getting your current position...',
    ar: 'تم تفعيل الموقع التلقائي. جاري الحصول على موقعك الحالي...'
  },
  updatingLocation: {
    en: 'Updating location...',
    ar: 'جاري تحديث الموقع...'
  },
  fetchingLocation: {
    en: 'Fetching GPS...',
    ar: 'جلب نظام تحديد المواقع...'
  },

  // ── Job Status (for job cards from backend) ──
  jobStatus: {
    completed: { en: 'COMPLETED', ar: 'مكتمل' },
    cancelled: { en: 'CANCELLED', ar: 'ملغي' },
    in_progress: { en: 'IN PROGRESS', ar: 'قيد التنفيذ' },
    accepted: { en: 'ACCEPTED', ar: 'مقبول' },
    pending: { en: 'PENDING', ar: 'قيد الانتظار' },
  },
} as const;

// ─────────────────────────────────────────────
// MAIN TRANSLATE FUNCTION
// Usage: t('online', lang)  →  'متصل'  or  'ONLINE'
// ─────────────────────────────────────────────
export const t = (
  key: keyof typeof TRANSLATIONS,
  lang: Language
): string => {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  // Handle nested objects like jobStatus
  if (typeof entry === 'object' && !('en' in entry)) return key;
  return (entry as { en: string; ar: string })[lang];
};

// ─────────────────────────────────────────────
// JOB STATUS TRANSLATE FUNCTION
// Usage: tStatus('completed', lang)
// ─────────────────────────────────────────────
type JobStatusKey = keyof typeof TRANSLATIONS.jobStatus;

export const tStatus = (
  status: string,
  lang: Language
): string => {
  const statusMap = TRANSLATIONS.jobStatus;
  const key = status?.toLowerCase().replace(' ', '_') as JobStatusKey;
  return statusMap[key]?.[lang] ?? status;
};
