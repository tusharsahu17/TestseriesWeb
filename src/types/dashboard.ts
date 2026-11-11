export type TestSeriesStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';

export type PerformanceStatus = 'Strong' | 'Average' | 'Needs improvement';

export type NotificationType =
  | 'NEW_TEST'
  | 'RESULT_PUBLISHED'
  | 'SERIES_EXPIRING'
  | 'PAYMENT_CONFIRMED'
  | 'ANNOUNCEMENT';

export interface DashboardSummary {
  testsAttempted: number;
  averageScore: number;
  accuracy: number;
  activeTestSeries: number;
}

export interface AvailableTestItem {
  id: string;
  testId: string;
  title: string;
  description: string;
  subjectName: string;
  examId?: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  isFree: boolean;
  difficulty?: string;
  startTime?: string | null;
  endTime?: string | null;
  publishedAt?: string | null;
  maxAttempts?: number | null;
  attemptsUsed: number;
  attemptStatus: string;
  activeAttemptId?: string | null;
  latestAttemptId?: string | null;
  latestScore?: number | null;
  canStart: boolean;
  actionLabel: string;
  disabledReason?: string | null;
  marksPerQuestion?: number;
  negativeMarks?: number;
}

export interface AvailableTestsBuckets {
  newlyPublished: AvailableTestItem[];
  upcoming: AvailableTestItem[];
  recommended: AvailableTestItem[];
  freePractice: AvailableTestItem[];
  fromPurchasedSeries: AvailableTestItem[];
  all: AvailableTestItem[];
}

export interface StudentTestSeries {
  id: string;
  seriesId: string;
  title: string;
  description: string;
  examName: string;
  category: string;
  totalTests: number;
  completedTests: number;
  progress: number;
  enrollmentStatus: TestSeriesStatus;
  paymentStatus: TestSeriesStatus;
  effectiveStatus: TestSeriesStatus;
  expiresAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  canAttempt: boolean;
  disabledReason?: string | null;
  price?: number | null;
  tests?: AvailableTestItem[];
}

export interface RecentAttemptItem {
  id: string;
  attemptId: string;
  testId: string;
  testTitle: string;
  subjectName: string;
  seriesTitle?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  status: string;
  evaluationStatus?: string;
  timeSpentSeconds: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalQuestions: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AttemptsHistoryResponse {
  attempts: RecentAttemptItem[];
  pagination: PaginationMeta;
}

export interface SubjectPerformanceItem {
  subject: string;
  subjectId?: string | null;
  percentage: number;
  accuracy: number;
  status: PerformanceStatus;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalQuestions: number;
  obtainedMarks: number;
  totalMarks: number;
  attemptsCount: number;
}

export interface ScoreTrendPoint {
  label: string;
  attemptId?: string;
  testId?: string;
  testTitle: string;
  percentage: number;
  score: number;
  submittedAt?: string | null;
}

export interface PerformanceMetrics {
  highestScore: number;
  averageScore: number;
  overallAccuracy: number;
  averageTimePerTestSeconds: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  totalEvaluatedTests: number;
}

export interface PerformanceAnalytics {
  scoreTrend: ScoreTrendPoint[];
  subjectWisePerformance: SubjectPerformanceItem[];
  metrics: PerformanceMetrics;
}

export interface QuestionReviewOption {
  id: string;
  text: string;
}

export interface QuestionReviewItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  subjectName?: string | null;
  options: QuestionReviewOption[];
  userAnswerId?: string | null;
  correctAnswerId?: string | null;
  userAnswerText?: string | null;
  correctAnswerText?: string | null;
  isCorrect: boolean;
  isSkipped: boolean;
  marksObtained: number;
  maxMarks?: number;
  timeSpentSeconds: number;
  explanation?: string | null;
}

export interface AttemptResultDetail {
  attemptId: string;
  testId: string;
  testTitle: string;
  seriesTitle?: string | null;
  subjectName?: string | null;
  status: string;
  submittedAt?: string | null;
  startedAt?: string | null;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  attemptedCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  rank?: number | null;
  percentile?: number | null;
  subjectWiseScores: SubjectPerformanceItem[];
  questions: QuestionReviewItem[];
}

export interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationsResponse {
  notifications: UserNotification[];
  unreadCount: number;
  pagination?: PaginationMeta;
}

export interface StartTestSuccess {
  attemptId: string;
  testId: string;
  resumed?: boolean;
  test?: {
    id: string;
    title: string;
    subjectName?: string;
    durationMinutes?: number;
    totalQuestions?: number;
    totalMarks?: number;
    marksPerQuestion?: number;
    negativeMarks?: number;
  };
  remainingSeconds?: number;
  questions?: unknown[];
  savedAnswers?: Array<{ questionId: string; optionId: string }>;
}

export interface StartTestValidationError {
  status: number;
  code: string;
  message: string;
  isConflict: boolean;
  activeAttemptId?: string;
  conflictingTestId?: string;
  conflictingTestTitle?: string;
}

export interface CombinedDashboardData {
  user?: {
    id?: string | number;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  };
  summary: DashboardSummary;
  testSeries: StudentTestSeries[];
  availableTests: AvailableTestsBuckets;
  recentAttempts: RecentAttemptItem[];
  performance: PerformanceAnalytics;
  notifications: NotificationsResponse;
}

