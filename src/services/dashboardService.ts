import { AxiosError } from 'axios';
import { getData, patchData, postData } from './apiClient';
import { ENDPOINTS } from '../constants/apiEndpoints';
import type {
  AttemptResultDetail,
  AttemptsHistoryResponse,
  AvailableTestItem,
  AvailableTestsBuckets,
  CombinedDashboardData,
  DashboardSummary,
  NotificationType,
  NotificationsResponse,
  PaginationMeta,
  PerformanceAnalytics,
  PerformanceMetrics,
  PerformanceStatus,
  QuestionReviewItem,
  RecentAttemptItem,
  ScoreTrendPoint,
  StartTestSuccess,
  StartTestValidationError,
  StudentTestSeries,
  SubjectPerformanceItem,
  TestSeriesStatus,
  UserNotification,
} from '../types/dashboard';

type RawRecord = Record<string, unknown>;

const asRecord = (val: unknown): RawRecord =>
  val && typeof val === 'object' && !Array.isArray(val) ? (val as RawRecord) : {};

const asArray = (val: unknown): RawRecord[] =>
  Array.isArray(val) ? val.map(asRecord) : [];

const asString = (val: unknown, fallback = ''): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' && !Number.isNaN(val)) return String(val);
  return fallback;
};

const asNumber = (val: unknown, fallback = 0): number => {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asOptionalNumber = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = asNumber(val, Number.NaN);
  return Number.isFinite(num) ? num : null;
};

const asBool = (val: unknown, fallback = false): boolean => {
  if (typeof val === 'boolean') return val;
  if (val === 1 || val === 'true') return true;
  if (val === 0 || val === 'false') return false;
  return fallback;
};

const unwrap = (raw: unknown): RawRecord => {
  const rec = asRecord(raw);
  if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
    return asRecord(rec.data);
  }
  return rec;
};

const unwrapList = (raw: unknown, keys: string[]): RawRecord[] => {
  if (Array.isArray(raw)) return asArray(raw);
  const rec = asRecord(raw);
  for (const key of keys) {
    if (Array.isArray(rec[key])) return asArray(rec[key]);
  }
  if (rec.data) {
    if (Array.isArray(rec.data)) return asArray(rec.data);
    const nested = asRecord(rec.data);
    for (const key of keys) {
      if (Array.isArray(nested[key])) return asArray(nested[key]);
    }
  }
  return [];
};

const normalizeSeriesStatus = (val: unknown, fallback: TestSeriesStatus = 'ACTIVE'): TestSeriesStatus => {
  const upper = asString(val).toUpperCase();
  if (upper === 'ACTIVE' || upper === 'EXPIRED' || upper === 'PENDING' || upper === 'CANCELLED') {
    return upper;
  }
  if (upper === 'PAID' || upper === 'COMPLETED' || upper === 'ENROLLED') return 'ACTIVE';
  return fallback;
};

const derivePerformanceStatus = (
  percentage: number,
  explicitStatus?: unknown,
): PerformanceStatus => {
  const raw = asString(explicitStatus).toLowerCase();
  if (raw === 'strong') return 'Strong';
  if (raw === 'average') return 'Average';
  if (raw.includes('need')) return 'Needs improvement';
  if (percentage >= 80) return 'Strong';
  if (percentage >= 60) return 'Average';
  return 'Needs improvement';
};

export const normalizeSummary = (raw: unknown): DashboardSummary => {
  const rec = unwrap(raw);
  const src = rec.summary ? asRecord(rec.summary) : rec;
  return {
    testsAttempted: asNumber(src.testsAttempted ?? src.tests_attempted ?? src.completedTests, 0),
    averageScore: asNumber(src.averageScore ?? src.average_score, 0),
    accuracy: asNumber(src.accuracy ?? src.overallAccuracy ?? src.overall_accuracy, 0),
    activeTestSeries: asNumber(
      src.activeTestSeries ?? src.active_test_series ?? src.activeSeriesCount,
      0,
    ),
  };
};

export const normalizeAvailableTest = (raw: RawRecord): AvailableTestItem => {
  const testObj = asRecord(raw.test);
  const subjectObj = asRecord(raw.subject ?? testObj.subject);
  const seriesObj = asRecord(raw.testSeries ?? raw.series ?? testObj.testSeries);

  const id = asString(raw.testId ?? raw.test_id ?? raw.id ?? raw._id ?? testObj.id);
  const attemptsUsed = asNumber(
    raw.attemptsUsed ?? raw.attempts_used ?? raw.attemptCount ?? raw.attempt_count,
    0,
  );
  const maxAttempts = asOptionalNumber(raw.maxAttempts ?? raw.max_attempts);
  const attemptStatus = asString(
    raw.attemptStatus ?? raw.attempt_status ?? raw.status ?? 'NOT_STARTED',
  ).toUpperCase();
  const canStart = asBool(raw.canStart ?? raw.can_start, true);
  const activeAttemptId =
    asString(
      raw.activeAttemptId ?? raw.active_attempt_id ?? raw.inProgressAttemptId ?? raw.in_progress_attempt_id,
    ) || null;
  const latestAttemptId =
    asString(raw.latestAttemptId ?? raw.latest_attempt_id ?? raw.lastAttemptId) || null;

  let fallbackLabel = 'Start Test';
  if (activeAttemptId || attemptStatus === 'IN_PROGRESS') fallbackLabel = 'Resume Test';
  else if (!canStart && latestAttemptId) fallbackLabel = 'View Result';
  else if (!canStart) fallbackLabel = 'Unavailable';
  else if (attemptsUsed > 0) fallbackLabel = 'Retake Test';

  return {
    id,
    testId: id,
    title: asString(raw.title ?? raw.name ?? testObj.title ?? testObj.name, 'Untitled Test'),
    description: asString(raw.description ?? testObj.description, ''),
    subjectName: asString(
      raw.subjectName ?? raw.subject_name ?? subjectObj.name ?? raw.subject,
      'General',
    ),
    examId:
      asString(raw.examId ?? raw.exam_id ?? testObj.examId ?? testObj.exam_id) || null,
    seriesId:
      asString(raw.seriesId ?? raw.series_id ?? raw.testSeriesId ?? seriesObj.id) || null,
    seriesTitle:
      asString(
        raw.seriesTitle ?? raw.series_title ?? raw.seriesName ?? raw.series_name ?? seriesObj.title ?? seriesObj.name,
      ) || null,
    durationMinutes: asNumber(
      raw.durationMinutes ?? raw.duration_minutes ?? raw.duration ?? testObj.duration_minutes,
      60,
    ),
    totalQuestions: asNumber(
      raw.totalQuestions ?? raw.total_questions ?? raw.questionCount ?? testObj.total_questions,
      0,
    ),
    totalMarks: asNumber(
      raw.totalMarks ?? raw.total_marks ?? raw.maxMarks ?? testObj.total_marks,
      0,
    ),
    isFree: asBool(raw.isFree ?? raw.is_free ?? testObj.is_free, false),
    difficulty: asString(raw.difficulty ?? testObj.difficulty, ''),
    startTime: asString(raw.startTime ?? raw.start_time ?? testObj.start_time) || null,
    endTime: asString(raw.endTime ?? raw.end_time ?? testObj.end_time) || null,
    publishedAt: asString(raw.publishedAt ?? raw.published_at ?? raw.createdAt) || null,
    maxAttempts,
    attemptsUsed,
    attemptStatus,
    activeAttemptId,
    latestAttemptId,
    latestScore: asOptionalNumber(raw.latestScore ?? raw.latest_score ?? raw.scorePercentage),
    canStart,
    actionLabel: asString(raw.actionLabel ?? raw.action_label, fallbackLabel),
    disabledReason:
      asString(raw.disabledReason ?? raw.disabled_reason ?? raw.blockReason ?? raw.reason) || null,
    marksPerQuestion: asNumber(raw.marksPerQuestion ?? raw.marks_per_question, 4),
    negativeMarks: asNumber(raw.negativeMarks ?? raw.negative_marks, 1),
  };
};

export const normalizeAvailableTestsArray = (
  raw: unknown,
  defaultSubjectName?: string,
): AvailableTestItem[] => {
  const rows = unwrapList(raw, ['tests', 'availableTests', 'items', 'data']);
  return rows.map((row) =>
    normalizeAvailableTest(
      defaultSubjectName
        ? { ...row, subjectName: row.subjectName ?? row.subject_name ?? defaultSubjectName }
        : row,
    ),
  );
};

export const normalizeAvailableTestsBuckets = (raw: unknown): AvailableTestsBuckets => {
  const root = unwrap(raw);
  const bucketsObj = asRecord(root.buckets ?? root);

  const newlyPublished = unwrapList(bucketsObj.newlyPublished ?? bucketsObj.newly_published, [
    'tests',
    'items',
  ]).map(normalizeAvailableTest);
  const upcoming = unwrapList(bucketsObj.upcoming, ['tests', 'items']).map(normalizeAvailableTest);
  const recommended = unwrapList(bucketsObj.recommended, ['tests', 'items']).map(
    normalizeAvailableTest,
  );
  const freePractice = unwrapList(bucketsObj.freePractice ?? bucketsObj.free_practice, [
    'tests',
    'items',
  ]).map(normalizeAvailableTest);
  const fromPurchasedSeries = unwrapList(
    bucketsObj.fromPurchasedSeries ?? bucketsObj.from_purchased_series,
    ['tests', 'items'],
  ).map(normalizeAvailableTest);

  const explicitAll = unwrapList(raw, ['tests', 'availableTests', 'items', 'data']).map(
    normalizeAvailableTest,
  );

  // Deduplicate combined tests if `all` is not explicitly provided
  const seen = new Set<string>();
  const combined: AvailableTestItem[] = [];
  for (const item of [
    ...explicitAll,
    ...recommended,
    ...fromPurchasedSeries,
    ...newlyPublished,
    ...freePractice,
    ...upcoming,
  ]) {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      combined.push(item);
    }
  }

  return {
    newlyPublished,
    upcoming,
    recommended,
    freePractice,
    fromPurchasedSeries,
    all: combined,
  };
};

export const normalizeTestSeries = (raw: RawRecord): StudentTestSeries => {
  const seriesObj = asRecord(raw.series ?? raw.testSeries ?? raw.test_series);
  const id = asString(raw.seriesId ?? raw.series_id ?? raw.id ?? raw._id ?? seriesObj.id);

  const totalTests = asNumber(
    raw.totalTests ?? raw.total_tests ?? raw.testsCount ?? seriesObj.total_tests,
    0,
  );
  const completedTests = asNumber(
    raw.completedTests ??
      raw.completed_tests ??
      raw.evaluatedTests ??
      raw.evaluated_tests ??
      raw.completedCount,
    0,
  );
  const computedProgress =
    totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
  const progress = asNumber(
    raw.progress ?? raw.progressPercentage ?? raw.progress_percentage,
    computedProgress,
  );

  const enrollmentStatus = normalizeSeriesStatus(
    raw.enrollmentStatus ?? raw.enrollment_status ?? raw.status,
    'ACTIVE',
  );
  const paymentStatus = normalizeSeriesStatus(
    raw.paymentStatus ?? raw.payment_status ?? enrollmentStatus,
    enrollmentStatus,
  );

  const expiresAt =
    asString(
      raw.expiresAt ??
        raw.expires_at ??
        raw.enrollmentExpiresAt ??
        raw.enrollment_expires_at ??
        raw.validUntil,
    ) || null;
  const endDate =
    asString(raw.endDate ?? raw.end_date ?? raw.seriesEndDate ?? seriesObj.end_date) || null;

  const isExpiredByDate =
    (expiresAt && new Date(expiresAt).getTime() < Date.now()) ||
    (endDate && new Date(endDate).getTime() < Date.now());

  let effectiveStatus: TestSeriesStatus = paymentStatus;
  if (enrollmentStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') {
    effectiveStatus = 'CANCELLED';
  } else if (enrollmentStatus === 'EXPIRED' || paymentStatus === 'EXPIRED' || isExpiredByDate) {
    effectiveStatus = 'EXPIRED';
  } else if (enrollmentStatus === 'PENDING' || paymentStatus === 'PENDING') {
    effectiveStatus = 'PENDING';
  }

  const canAttempt = asBool(
    raw.canAttempt ?? raw.can_attempt,
    effectiveStatus === 'ACTIVE',
  );

  const rawTests = Array.isArray(raw.tests) ? raw.tests.map(asRecord) : undefined;

  return {
    id,
    seriesId: id,
    title: asString(raw.title ?? raw.name ?? seriesObj.title ?? seriesObj.name, 'Test Series'),
    description: asString(raw.description ?? seriesObj.description, ''),
    examName: asString(raw.examName ?? raw.exam_name ?? raw.exam ?? seriesObj.exam_name, ''),
    category: asString(raw.category ?? seriesObj.category, ''),
    totalTests,
    completedTests,
    progress: Math.min(100, Math.max(0, progress)),
    enrollmentStatus,
    paymentStatus,
    effectiveStatus: canAttempt ? 'ACTIVE' : effectiveStatus === 'ACTIVE' ? 'EXPIRED' : effectiveStatus,
    expiresAt,
    startDate: asString(raw.startDate ?? raw.start_date ?? seriesObj.start_date) || null,
    endDate,
    canAttempt,
    disabledReason:
      asString(raw.disabledReason ?? raw.disabled_reason ?? raw.reason) ||
      (!canAttempt
        ? effectiveStatus === 'EXPIRED'
          ? 'This test series or enrollment has expired. Past results remain available.'
          : effectiveStatus === 'PENDING'
            ? 'Payment is pending confirmation.'
            : 'This enrollment was cancelled.'
        : null),
    price: asOptionalNumber(raw.price ?? seriesObj.price),
    tests: rawTests?.map(normalizeAvailableTest),
  };
};

export const normalizeRecentAttempt = (raw: RawRecord): RecentAttemptItem => {
  const testObj = asRecord(raw.test);
  const subjectObj = asRecord(raw.subject ?? testObj.subject);
  const seriesObj = asRecord(raw.series ?? raw.testSeries);

  const id = asString(raw.attemptId ?? raw.attempt_id ?? raw.id ?? raw._id);
  const obtainedMarks = asNumber(
    raw.obtainedMarks ?? raw.obtained_marks ?? raw.score ?? raw.marksObtained,
    0,
  );
  const totalMarks = asNumber(
    raw.totalMarks ?? raw.total_marks ?? raw.maxMarks ?? testObj.total_marks,
    0,
  );
  const percentage = asNumber(
    raw.percentage ?? raw.scorePercentage ?? raw.score_percentage,
    totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0,
  );

  return {
    id,
    attemptId: id,
    testId: asString(raw.testId ?? raw.test_id ?? testObj.id),
    testTitle: asString(
      raw.testTitle ?? raw.test_title ?? raw.title ?? testObj.title ?? testObj.name,
      `Test #${asString(raw.testId ?? raw.test_id, id)}`,
    ),
    subjectName: asString(
      raw.subjectName ?? raw.subject_name ?? subjectObj.name ?? raw.subject,
      'General',
    ),
    seriesTitle:
      asString(
        raw.seriesTitle ?? raw.series_title ?? raw.seriesName ?? seriesObj.title ?? seriesObj.name,
      ) || null,
    startedAt: asString(raw.startedAt ?? raw.started_at ?? raw.start_time) || null,
    submittedAt:
      asString(raw.submittedAt ?? raw.submitted_at ?? raw.completedAt ?? raw.end_time) || null,
    obtainedMarks,
    totalMarks,
    percentage,
    accuracy: asNumber(raw.accuracy, 0),
    status: asString(raw.status ?? 'EVALUATED').toUpperCase(),
    evaluationStatus: asString(raw.evaluationStatus ?? raw.evaluation_status, ''),
    timeSpentSeconds: asNumber(
      raw.timeSpentSeconds ?? raw.time_spent_seconds ?? raw.durationSeconds,
      0,
    ),
    correctCount: asNumber(raw.correctCount ?? raw.correct_answers ?? raw.correct, 0),
    wrongCount: asNumber(raw.wrongCount ?? raw.wrong_answers ?? raw.incorrectCount ?? raw.wrong, 0),
    skippedCount: asNumber(raw.skippedCount ?? raw.skipped_questions ?? raw.skipped, 0),
    totalQuestions: asNumber(raw.totalQuestions ?? raw.total_questions, 0),
  };
};

const normalizeSubjectPerformance = (raw: RawRecord): SubjectPerformanceItem => {
  const percentage = asNumber(
    raw.percentage ?? raw.scorePercentage ?? raw.score_percentage ?? raw.averageScore ?? raw.accuracy,
    0,
  );
  const accuracy = asNumber(raw.accuracy ?? percentage, percentage);
  return {
    subject: asString(raw.subject ?? raw.subjectName ?? raw.subject_name ?? raw.name, 'General'),
    subjectId: asString(raw.subjectId ?? raw.subject_id ?? raw.id) || null,
    percentage,
    accuracy,
    status: derivePerformanceStatus(percentage, raw.status),
    correctCount: asNumber(raw.correctCount ?? raw.correct ?? raw.correct_answers, 0),
    wrongCount: asNumber(
      raw.wrongCount ?? raw.incorrectCount ?? raw.wrong ?? raw.wrong_answers,
      0,
    ),
    skippedCount: asNumber(raw.skippedCount ?? raw.skipped ?? raw.skipped_questions, 0),
    totalQuestions: asNumber(raw.totalQuestions ?? raw.total_questions, 0),
    obtainedMarks: asNumber(raw.obtainedMarks ?? raw.obtained_marks ?? raw.score, 0),
    totalMarks: asNumber(raw.totalMarks ?? raw.total_marks, 0),
    attemptsCount: asNumber(raw.attemptsCount ?? raw.attempts_count ?? raw.testsCount, 0),
  };
};

export const normalizePerformanceAnalytics = (raw: unknown): PerformanceAnalytics => {
  const root = unwrap(raw);
  const perf = root.performance ? asRecord(root.performance) : root;

  const rawTrend = unwrapList(perf.scoreTrend ?? perf.score_trend, ['items', 'data']);
  const scoreTrend: ScoreTrendPoint[] = rawTrend.map((pt, idx) => {
    const pct = asNumber(
      pt.percentage ?? pt.scorePercentage ?? pt.normalizedScore ?? pt.score,
      0,
    );
    return {
      label: asString(pt.label ?? pt.tag, `T${idx + 1}`),
      attemptId: asString(pt.attemptId ?? pt.attempt_id ?? pt.id) || undefined,
      testId: asString(pt.testId ?? pt.test_id) || undefined,
      testTitle: asString(pt.testTitle ?? pt.test_title ?? pt.title, `Attempt ${idx + 1}`),
      percentage: Math.min(100, Math.max(0, pct)),
      score: asNumber(pt.score ?? pt.obtainedMarks ?? pct, pct),
      submittedAt: asString(pt.submittedAt ?? pt.submitted_at ?? pt.date) || null,
    };
  });

  const rawSubjects = unwrapList(
    perf.subjectWisePerformance ?? perf.subject_wise_performance ?? perf.subjects,
    ['items', 'data'],
  );
  const subjectWisePerformance = rawSubjects.map(normalizeSubjectPerformance);

  const metricsObj = asRecord(
    perf.metrics ?? perf.aggregateMetrics ?? perf.aggregate ?? perf.summary ?? perf,
  );
  const metrics: PerformanceMetrics = {
    highestScore: asNumber(metricsObj.highestScore ?? metricsObj.highest_score, 0),
    averageScore: asNumber(metricsObj.averageScore ?? metricsObj.average_score, 0),
    overallAccuracy: asNumber(
      metricsObj.overallAccuracy ?? metricsObj.overall_accuracy ?? metricsObj.accuracy,
      0,
    ),
    averageTimePerTestSeconds: asNumber(
      metricsObj.averageTimePerTestSeconds ??
        metricsObj.average_time_per_test_seconds ??
        metricsObj.avgTimeSeconds,
      0,
    ),
    totalCorrect: asNumber(
      metricsObj.totalCorrect ?? metricsObj.correctTotal ?? metricsObj.correctCount ?? metricsObj.correct,
      0,
    ),
    totalIncorrect: asNumber(
      metricsObj.totalIncorrect ??
        metricsObj.incorrectTotal ??
        metricsObj.wrongTotal ??
        metricsObj.wrongCount ??
        metricsObj.incorrect,
      0,
    ),
    totalSkipped: asNumber(
      metricsObj.totalSkipped ?? metricsObj.skippedTotal ?? metricsObj.skippedCount ?? metricsObj.skipped,
      0,
    ),
    totalEvaluatedTests: asNumber(
      metricsObj.totalEvaluatedTests ??
        metricsObj.testsEvaluated ??
        metricsObj.testsAttempted ??
        scoreTrend.length,
      scoreTrend.length,
    ),
  };

  return { scoreTrend, subjectWisePerformance, metrics };
};

export const normalizeNotification = (raw: RawRecord): UserNotification => {
  const rawType = asString(raw.type ?? raw.notificationType ?? 'ANNOUNCEMENT').toUpperCase();
  const validTypes: NotificationType[] = [
    'NEW_TEST',
    'RESULT_PUBLISHED',
    'SERIES_EXPIRING',
    'PAYMENT_CONFIRMED',
    'ANNOUNCEMENT',
  ];
  const type = validTypes.includes(rawType as NotificationType)
    ? (rawType as NotificationType)
    : 'ANNOUNCEMENT';

  const metadata = asRecord(raw.metadata ?? raw.meta ?? raw.payload);
  let link = asString(raw.link ?? raw.actionUrl ?? raw.action_url ?? metadata.link) || null;
  if (!link) {
    const attemptId = asString(metadata.attemptId ?? metadata.attempt_id ?? raw.attemptId);
    const testId = asString(metadata.testId ?? metadata.test_id ?? raw.testId);
    const seriesId = asString(metadata.seriesId ?? metadata.series_id ?? raw.seriesId);
    if (type === 'RESULT_PUBLISHED' && attemptId) link = `/dashboard/results/${attemptId}`;
    else if (type === 'NEW_TEST' && testId) link = `/dashboard/tests/${testId}`;
    else if (type === 'SERIES_EXPIRING' && seriesId) link = `/dashboard/test-series/${seriesId}`;
    else if (type === 'PAYMENT_CONFIRMED' && seriesId) link = `/dashboard/test-series/${seriesId}`;
  }

  return {
    id: asString(raw.id ?? raw._id ?? raw.notificationId),
    type,
    title: asString(raw.title ?? raw.heading, 'Notification'),
    message: asString(raw.message ?? raw.body ?? raw.content, ''),
    isRead: asBool(raw.isRead ?? raw.is_read ?? raw.read, false),
    createdAt: asString(raw.createdAt ?? raw.created_at ?? raw.timestamp, new Date().toISOString()),
    link,
    metadata,
  };
};

export const normalizeNotificationsResponse = (raw: unknown): NotificationsResponse => {
  const root = unwrap(raw);
  const items = unwrapList(raw, ['notifications', 'items', 'data']).map(normalizeNotification);
  const unreadFallback = items.filter((n) => !n.isRead).length;
  const unreadCount = asNumber(
    root.unreadCount ?? root.unread_count ?? root.unread,
    unreadFallback,
  );
  const paginationRaw = asRecord(root.pagination ?? root.meta);
  const pagination: PaginationMeta | undefined =
    Object.keys(paginationRaw).length > 0
      ? {
          page: asNumber(paginationRaw.page, 1),
          limit: asNumber(paginationRaw.limit, 20),
          total: asNumber(paginationRaw.total, items.length),
          totalPages: asNumber(paginationRaw.totalPages ?? paginationRaw.total_pages, 1),
        }
      : undefined;

  return { notifications: items, unreadCount, pagination };
};

export const normalizeQuestionReview = (raw: RawRecord, index: number): QuestionReviewItem => {
  const qObj = asRecord(raw.question);
  const rawOptions = Array.isArray(raw.options)
    ? raw.options
    : Array.isArray(qObj.options)
      ? qObj.options
      : [];

  const options = rawOptions.map((opt, optIdx) => {
    if (typeof opt === 'string') {
      return { id: String(optIdx), text: opt };
    }
    const o = asRecord(opt);
    return {
      id: asString(o.id ?? o.optionId ?? o.option_id ?? o._id, String(optIdx)),
      text: asString(o.text ?? o.optionText ?? o.option_text ?? o.label, ''),
    };
  });

  const userAnswerId =
    asString(
      raw.userAnswer ??
        raw.user_answer ??
        raw.selectedOptionId ??
        raw.selected_option_id ??
        raw.selectedOption,
    ) || null;
  const correctAnswerId =
    asString(
      raw.correctAnswer ??
        raw.correct_answer ??
        raw.correctOptionId ??
        raw.correct_option_id ??
        raw.correctOption,
    ) || null;

  const isSkipped = asBool(
    raw.isSkipped ?? raw.is_skipped ?? raw.skipped,
    userAnswerId === null || userAnswerId === '',
  );
  const isCorrect = isSkipped
    ? false
    : asBool(
        raw.isCorrect ?? raw.is_correct,
        !!(userAnswerId && correctAnswerId && userAnswerId === correctAnswerId),
      );

  const userOpt = options.find((o) => o.id === userAnswerId);
  const correctOpt = options.find((o) => o.id === correctAnswerId);

  return {
    questionId: asString(raw.questionId ?? raw.question_id ?? raw.id ?? qObj.id, String(index + 1)),
    questionNumber: asNumber(raw.questionNumber ?? raw.question_number, index + 1),
    questionText: asString(
      raw.questionText ?? raw.question_text ?? raw.question ?? qObj.text ?? qObj.question_text,
      '',
    ),
    subjectName:
      asString(raw.subjectName ?? raw.subject_name ?? raw.subject ?? qObj.subject) || null,
    options,
    userAnswerId,
    correctAnswerId,
    userAnswerText: userOpt?.text ?? (asString(raw.userAnswerText ?? raw.user_answer_text) || null),
    correctAnswerText:
      correctOpt?.text ?? (asString(raw.correctAnswerText ?? raw.correct_answer_text) || null),
    isCorrect,
    isSkipped,
    marksObtained: asNumber(raw.marksObtained ?? raw.marks_obtained ?? raw.marks, 0),
    maxMarks: asOptionalNumber(raw.maxMarks ?? raw.max_marks) ?? undefined,
    timeSpentSeconds: asNumber(
      raw.timeSpentSeconds ?? raw.time_spent_seconds ?? raw.timeTakenSeconds ?? raw.time_taken_seconds,
      0,
    ),
    explanation: asString(raw.explanation ?? qObj.explanation) || null,
  };
};

export const normalizeAttemptResult = (raw: unknown): AttemptResultDetail => {
  const root = unwrap(raw);
  const attempt = asRecord(root.attempt);
  const test = asRecord(root.test);
  const summary = asRecord(root.summary ?? root.marks ?? root.evaluation);

  const obtainedMarks = asNumber(
    root.obtainedMarks ??
      root.obtained_marks ??
      root.score ??
      summary.obtainedMarks ??
      attempt.score,
    0,
  );
  const totalMarks = asNumber(
    root.totalMarks ?? root.total_marks ?? summary.totalMarks ?? test.total_marks,
    0,
  );
  const totalQuestions = asNumber(
    root.totalQuestions ??
      root.total_questions ??
      summary.totalQuestions ??
      test.total_questions,
    0,
  );
  const correctCount = asNumber(
    root.correctCount ??
      root.correct_answers ??
      root.correctAnswers ??
      summary.correctCount ??
      summary.correct,
    0,
  );
  const wrongCount = asNumber(
    root.wrongCount ??
      root.wrong_answers ??
      root.wrongAnswers ??
      root.incorrectCount ??
      summary.wrongCount ??
      summary.incorrect,
    0,
  );
  const skippedCount = asNumber(
    root.skippedCount ??
      root.skipped_questions ??
      root.skippedAnswers ??
      summary.skippedCount ??
      summary.skipped,
    Math.max(0, totalQuestions - (correctCount + wrongCount)),
  );
  const attemptedCount = asNumber(
    root.attemptedCount ?? root.attempted_questions ?? root.attemptedQuestions,
    correctCount + wrongCount,
  );

  const percentage = asNumber(
    root.percentage ?? root.scorePercentage ?? summary.percentage,
    totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0,
  );
  const accuracy = asNumber(
    root.accuracy ?? summary.accuracy,
    attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(2)) : 0,
  );

  const rawSubjectScores = unwrapList(
    root.subjectWiseScores ??
      root.subject_wise_scores ??
      root.subjectWisePerformance ??
      root.subjects,
    ['items'],
  );

  const rawQuestions = unwrapList(
    root.questions ?? root.questionReview ?? root.question_review ?? root.answers ?? root.review,
    ['items'],
  );

  return {
    attemptId: asString(root.attemptId ?? root.attempt_id ?? root.id ?? attempt.id),
    testId: asString(root.testId ?? root.test_id ?? test.id ?? attempt.test_id),
    testTitle: asString(
      root.testTitle ?? root.test_title ?? test.title ?? test.name,
      'Test Result',
    ),
    seriesTitle:
      asString(root.seriesTitle ?? root.series_title ?? root.seriesName ?? test.seriesTitle) ||
      null,
    subjectName:
      asString(root.subjectName ?? root.subject_name ?? root.subject ?? test.subjectName) || null,
    status: asString(root.status ?? attempt.status, 'EVALUATED').toUpperCase(),
    submittedAt:
      asString(root.submittedAt ?? root.submitted_at ?? attempt.submitted_at ?? attempt.end_time) ||
      null,
    startedAt:
      asString(root.startedAt ?? root.started_at ?? attempt.started_at ?? attempt.start_time) ||
      null,
    obtainedMarks,
    totalMarks,
    percentage,
    accuracy,
    correctCount,
    wrongCount,
    skippedCount,
    attemptedCount,
    totalQuestions: totalQuestions || rawQuestions.length,
    timeSpentSeconds: asNumber(
      root.timeSpentSeconds ?? root.time_spent_seconds ?? summary.timeSpentSeconds ?? attempt.time_spent_seconds,
      0,
    ),
    rank: asOptionalNumber(root.rank),
    percentile: asOptionalNumber(root.percentile),
    subjectWiseScores: rawSubjectScores.map(normalizeSubjectPerformance),
    questions: rawQuestions.map(normalizeQuestionReview),
  };
};

export const isEvaluationPendingError = (err: unknown): { pending: boolean; message: string } => {
  const axiosErr = err as AxiosError<{ code?: string; error?: string; message?: string } | string>;
  const status = axiosErr.response?.status;
  const data = axiosErr.response?.data;
  const code = typeof data === 'object' && data ? asString(data.code ?? data.error).toUpperCase() : '';
  const msg =
    typeof data === 'string'
      ? data
      : data?.message || 'Evaluation for this attempt is still in progress.';

  const pending =
    status === 403 &&
    (code === 'EVALUATION_PENDING' ||
      code.includes('EVALUATION') ||
      msg.toLowerCase().includes('evaluation') ||
      msg.toLowerCase().includes('pending'));

  return { pending: pending || code === 'EVALUATION_PENDING', message: msg };
};

export const extractStartValidationError = (err: unknown): StartTestValidationError => {
  const axiosErr = err as AxiosError<RawRecord | string>;
  const status = axiosErr.response?.status ?? 500;
  const data = axiosErr.response?.data;

  if (typeof data === 'string') {
    return {
      status,
      code: 'START_FAILED',
      message: data,
      isConflict: status === 409,
    };
  }

  const rec = asRecord(data);
  const details = asRecord(rec.details ?? rec.data ?? rec.conflictingAttempt ?? rec.activeAttempt);
  const code = asString(rec.code ?? rec.errorCode ?? rec.error, 'START_FAILED').toUpperCase();
  const message = asString(
    rec.message ?? rec.error,
    'Unable to start this test. Please check eligibility and schedule.',
  );

  const activeAttemptId =
    asString(
      rec.activeAttemptId ??
        rec.active_attempt_id ??
        rec.attemptId ??
        details.attemptId ??
        details.id,
    ) || undefined;

  const isConflict =
    status === 409 ||
    code.includes('IN_PROGRESS') ||
    code.includes('ACTIVE_ATTEMPT') ||
    code.includes('CONFLICT') ||
    !!activeAttemptId;

  return {
    status,
    code,
    message,
    isConflict,
    activeAttemptId,
    conflictingTestId:
      asString(rec.testId ?? rec.conflictingTestId ?? details.testId ?? details.test_id) ||
      undefined,
    conflictingTestTitle:
      asString(
        rec.testTitle ?? rec.conflictingTestTitle ?? details.testTitle ?? details.test_title,
      ) || undefined,
  };
};

export const dashboardService = {
  async getCombinedDashboard(): Promise<CombinedDashboardData> {
    const raw = await getData<unknown>(ENDPOINTS.USER_DASHBOARD);
    const root = unwrap(raw);

    const userRaw = asRecord(root.user ?? root.student ?? root.profile);
    const user =
      Object.keys(userRaw).length > 0
        ? {
            id: userRaw.id as string | number | undefined,
            name: asString(userRaw.name ?? userRaw.fullName ?? userRaw.username) || undefined,
            username: asString(userRaw.username) || undefined,
            email: asString(userRaw.email) || undefined,
            role: asString(userRaw.role) || undefined,
          }
        : undefined;

    const summary = normalizeSummary(root.summary ?? root.overview ?? root);
    const testSeries = unwrapList(
      root.testSeries ?? root.myTestSeries ?? root.test_series ?? root.series,
      ['series', 'items', 'testSeries'],
    ).map(normalizeTestSeries);

    const availableTests = normalizeAvailableTestsBuckets(
      root.availableTests ?? root.available_tests ?? root.tests ?? {},
    );

    const recentAttempts = unwrapList(
      root.recentAttempts ?? root.recent_attempts ?? root.attempts,
      ['attempts', 'items'],
    ).map(normalizeRecentAttempt);

    const performance = normalizePerformanceAnalytics(
      root.performance ?? root.performanceAnalytics ?? root.analytics ?? {},
    );

    const notifications = normalizeNotificationsResponse(
      root.notifications ?? root.recentNotifications ?? { notifications: [], unreadCount: 0 },
    );

    return {
      user,
      summary,
      testSeries,
      availableTests,
      recentAttempts,
      performance,
      notifications,
    };
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const raw = await getData<unknown>(ENDPOINTS.USER_DASHBOARD_SUMMARY);
    return normalizeSummary(raw);
  },

  async getDashboardTestSeries(): Promise<StudentTestSeries[]> {
    const raw = await getData<unknown>(ENDPOINTS.USER_DASHBOARD_TEST_SERIES);
    return unwrapList(raw, ['testSeries', 'myTestSeries', 'series', 'items', 'data']).map(
      normalizeTestSeries,
    );
  },

  async getAllTestSeries(params: Record<string, unknown> = {}): Promise<StudentTestSeries[]> {
    const raw = await getData<unknown>(ENDPOINTS.USER_TEST_SERIES, params);
    return unwrapList(raw, ['testSeries', 'myTestSeries', 'series', 'items', 'data']).map(
      normalizeTestSeries,
    );
  },

  async getTestSeriesDetail(seriesId: string): Promise<StudentTestSeries> {
    const raw = await getData<unknown>(`${ENDPOINTS.USER_TEST_SERIES}/${seriesId}`);
    const root = unwrap(raw);
    const seriesObj = root.testSeries ?? root.series ?? root.test_series;
    const base = seriesObj ? { ...asRecord(seriesObj), tests: root.tests ?? asRecord(seriesObj).tests } : root;
    return normalizeTestSeries(base);
  },

  async getDashboardAvailableTests(): Promise<AvailableTestsBuckets> {
    const raw = await getData<unknown>(ENDPOINTS.USER_DASHBOARD_AVAILABLE_TESTS);
    return normalizeAvailableTestsBuckets(raw);
  },

  async getAvailableTests(params: Record<string, unknown> = {}): Promise<AvailableTestsBuckets> {
    const raw = await getData<unknown>(ENDPOINTS.USER_TESTS, params);
    return normalizeAvailableTestsBuckets(raw);
  },

  async startTest(testId: string): Promise<StartTestSuccess> {
    const raw = await postData<unknown>(`${ENDPOINTS.USER_TESTS}/${testId}/start`, {});
    const root = unwrap(raw);
    const attemptObj = asRecord(root.attempt);
    const testObj = asRecord(root.test);

    const attemptId = asString(
      root.attemptId ?? root.attempt_id ?? root.id ?? attemptObj.id ?? attemptObj.attempt_id,
    );

    const savedRaw = Array.isArray(root.savedAnswers ?? root.answers ?? attemptObj.answers)
      ? ((root.savedAnswers ?? root.answers ?? attemptObj.answers) as unknown[]).map(asRecord)
      : [];

    return {
      attemptId,
      testId: asString(root.testId ?? root.test_id ?? testObj.id, testId),
      resumed: asBool(root.resumed, false),
      test:
        Object.keys(testObj).length > 0
          ? {
              id: asString(testObj.id, testId),
              title: asString(testObj.title ?? testObj.name, 'Test'),
              subjectName: asString(testObj.subjectName ?? testObj.subject_name) || undefined,
              durationMinutes: asOptionalNumber(
                testObj.durationMinutes ?? testObj.duration_minutes ?? testObj.duration,
              ) ?? undefined,
              totalQuestions: asOptionalNumber(
                testObj.totalQuestions ?? testObj.total_questions,
              ) ?? undefined,
              totalMarks: asOptionalNumber(testObj.totalMarks ?? testObj.total_marks) ?? undefined,
              marksPerQuestion: asOptionalNumber(
                testObj.marksPerQuestion ?? testObj.marks_per_question,
              ) ?? undefined,
              negativeMarks: asOptionalNumber(
                testObj.negativeMarks ?? testObj.negative_marks,
              ) ?? undefined,
            }
          : undefined,
      remainingSeconds: asOptionalNumber(
        root.remainingSeconds ?? root.remaining_seconds,
      ) ?? undefined,
      questions: Array.isArray(root.questions) ? root.questions : undefined,
      savedAnswers: savedRaw.map((ans) => ({
        questionId: asString(ans.questionId ?? ans.question_id),
        optionId: asString(ans.optionId ?? ans.option_id ?? ans.selectedOptionId),
      })),
    };
  },

  async abandonAttempt(attemptId: string): Promise<void> {
    await postData(`${ENDPOINTS.USER_ATTEMPTS}/${attemptId}/abandon`, {});
  },

  async getRecentAttempts(): Promise<RecentAttemptItem[]> {
    const raw = await getData<unknown>(ENDPOINTS.USER_DASHBOARD_RECENT_ATTEMPTS);
    return unwrapList(raw, ['recentAttempts', 'attempts', 'items', 'data']).map(
      normalizeRecentAttempt,
    );
  },

  async getAllAttempts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    seriesId?: string;
    subject?: string;
  } = {}): Promise<AttemptsHistoryResponse> {
    const cleanParams: Record<string, unknown> = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.search) cleanParams.search = params.search;
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params.seriesId && params.seriesId !== 'ALL') cleanParams.seriesId = params.seriesId;
    if (params.subject && params.subject !== 'ALL') cleanParams.subject = params.subject;

    const raw = await getData<unknown>(ENDPOINTS.USER_ATTEMPTS, cleanParams);
    const root = unwrap(raw);
    const attempts = unwrapList(raw, ['attempts', 'items', 'results', 'data']).map(
      normalizeRecentAttempt,
    );
    const paginationRaw = asRecord(root.pagination ?? root.meta);
    const page = asNumber(paginationRaw.page ?? root.page, params.page ?? 1);
    const limit = asNumber(paginationRaw.limit ?? root.limit, params.limit ?? 10);
    const total = asNumber(paginationRaw.total ?? root.total, attempts.length);
    const totalPages = asNumber(
      paginationRaw.totalPages ?? paginationRaw.total_pages ?? root.totalPages,
      Math.max(1, Math.ceil(total / Math.max(1, limit))),
    );

    return {
      attempts,
      pagination: { page, limit, total, totalPages },
    };
  },

  async getAttemptResult(attemptId: string): Promise<AttemptResultDetail> {
    const raw = await getData<unknown>(`${ENDPOINTS.USER_ATTEMPTS}/${attemptId}/result`);
    return normalizeAttemptResult(raw);
  },

  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    const raw = await getData<unknown>(ENDPOINTS.USER_DASHBOARD_PERFORMANCE);
    return normalizePerformanceAnalytics(raw);
  },

  async getDashboardNotifications(): Promise<NotificationsResponse> {
    const raw = await getData<unknown>(ENDPOINTS.USER_DASHBOARD_NOTIFICATIONS);
    return normalizeNotificationsResponse(raw);
  },

  async getNotifications(params: {
    page?: number;
    limit?: number;
    type?: string;
    unreadOnly?: boolean;
  } = {}): Promise<NotificationsResponse> {
    const cleanParams: Record<string, unknown> = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.type && params.type !== 'ALL') cleanParams.type = params.type;
    if (params.unreadOnly) cleanParams.unreadOnly = true;

    const raw = await getData<unknown>(ENDPOINTS.USER_NOTIFICATIONS, cleanParams);
    return normalizeNotificationsResponse(raw);
  },

  async markNotificationRead(id: string): Promise<void> {
    await patchData(`${ENDPOINTS.USER_NOTIFICATIONS}/${id}/read`, {});
  },

  async markAllNotificationsRead(): Promise<void> {
    await patchData(`${ENDPOINTS.USER_NOTIFICATIONS}/read-all`, {});
  },

  async createAdminNotification(payload: {
    title: string;
    message: string;
    type?: NotificationType;
    userId?: string | number;
    seriesId?: string | number;
    testId?: string | number;
  }): Promise<unknown> {
    return postData(ENDPOINTS.ADMIN_DASHBOARD_NOTIFICATIONS, payload);
  },
};

export const formatDurationSeconds = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  return `${secs}s`;
};

export const formatDisplayDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

