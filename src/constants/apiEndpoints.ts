export const ENDPOINTS = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  QUIZZES: '/api/quizzes',
  EXAMS: '/api/exams',
  SUBJECTS: '/api/subjects',
  TESTS: '/api/tests',
  ATTEMPTS: '/api/attempts',

  // Student Dashboard APIs
  USER_DASHBOARD: '/api/user/dashboard',
  USER_DASHBOARD_SUMMARY: '/api/user/dashboard/summary',
  USER_DASHBOARD_AVAILABLE_TESTS: '/api/user/dashboard/available-tests',
  USER_TESTS: '/api/user/tests',
  USER_DASHBOARD_RECENT_ATTEMPTS: '/api/user/dashboard/recent-attempts',
  USER_ATTEMPTS: '/api/user/attempts',
  USER_DASHBOARD_PERFORMANCE: '/api/user/dashboard/performance',
  USER_DASHBOARD_NOTIFICATIONS: '/api/user/dashboard/notifications',
  USER_NOTIFICATIONS: '/api/user/notifications',
  ADMIN_DASHBOARD_NOTIFICATIONS: '/api/admin/dashboard/notifications',

  // PDF & Study Material APIs
  PDFS: '/api/pdfs',
  PDF_CATEGORIES: '/api/pdf-categories',
} as const;
