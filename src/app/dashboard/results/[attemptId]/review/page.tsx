"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { getData } from "../../../../../services/apiClient";
import { ENDPOINTS } from "../../../../../constants/apiEndpoints";
import {
  dashboardService,
  formatDurationSeconds,
  isEvaluationPendingError,
  normalizeAttemptResult,
} from "../../../../../services/dashboardService";
import type {
  AttemptResultDetail,
  QuestionReviewItem,
} from "../../../../../types/dashboard";
import "./reviewInterface.css";

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [reviewData, setReviewData] = useState<AttemptResultDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">(
    "all",
  );

  const fetchReview = useCallback(async () => {
    if (!attemptId) return;
    try {
      const resultDetail = await dashboardService.getAttemptResult(attemptId);
      setPendingMessage(null);
      setError(null);
      if (resultDetail.questions.length > 0) {
        setReviewData(resultDetail);
        return;
      }

      // Fallback to legacy answers endpoint only if result endpoint omitted questions
      try {
        const legacyRaw = await getData(
          `${ENDPOINTS.ATTEMPTS}/${attemptId}/answers`,
        );
        const merged = normalizeAttemptResult({
          ...(typeof legacyRaw === "object" && legacyRaw ? legacyRaw : {}),
          attemptId: resultDetail.attemptId,
          testTitle: resultDetail.testTitle,
          obtainedMarks: resultDetail.obtainedMarks,
          totalMarks: resultDetail.totalMarks,
          correctCount: resultDetail.correctCount,
          wrongCount: resultDetail.wrongCount,
          skippedCount: resultDetail.skippedCount,
        });
        setReviewData(merged);
      } catch {
        setReviewData(resultDetail);
      }
    } catch (err: unknown) {
      const pending = isEvaluationPendingError(err);
      if (pending.pending) {
        setPendingMessage(pending.message);
      } else {
        setError("Failed to load question review data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  const handleRefresh = () => {
    setIsLoading(true);
    setPendingMessage(null);
    setError(null);
    void fetchReview();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReview();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReview]);

  const backToResult = () => {
    router.push(`/dashboard/results/${attemptId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">
          Loading question-wise review...
        </p>
      </div>
    );
  }

  if (pendingMessage) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Clock size={32} className="mx-auto mb-3 text-amber-700" />
          <h2 className="text-lg font-bold text-amber-900">
            Evaluation Pending
          </h2>
          <p className="mt-2 text-sm text-amber-800">{pendingMessage}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
            >
              Refresh
            </button>
            <Link
              href="/dashboard/results"
              className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900"
            >
              Back to Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 text-center">
          <h2 className="font-bold text-lg mb-2">Error</h2>
          <p className="text-sm">{error || "No review data found"}</p>
          <button
            type="button"
            onClick={backToResult}
            className="mt-4 bg-rose-100 text-rose-800 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-rose-200 cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const questions = reviewData.questions;
  const totalQuestions = questions.length;
  const qData: QuestionReviewItem | undefined = questions[currentQuestionIdx];

  const getStatus = (
    q: QuestionReviewItem,
  ): "correct" | "wrong" | "skipped" => {
    if (q.isSkipped) return "skipped";
    return q.isCorrect ? "correct" : "wrong";
  };

  const currentStatus = qData ? getStatus(qData) : "skipped";

  return (
    <div className="text-[#172033]">
      <main className="container">
        <div className="page-header">
          <div>
            <h1>Review Answers &amp; Explanations</h1>
            <p>
              {reviewData.testTitle} · Attempt #{attemptId} · Time Spent:{" "}
              {formatDurationSeconds(reviewData.timeSpentSeconds)}
            </p>
          </div>
          <div className="progress-info">
            <strong>
              {totalQuestions > 0 ? currentQuestionIdx + 1 : 0} /{" "}
              {totalQuestions}
            </strong>
            <span>Questions Reviewed</span>
          </div>
        </div>

        {totalQuestions === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No question-wise breakdown is available for this attempt.
          </div>
        ) : (
          <div className="review-layout">
            <aside className="question-nav">
              <div className="nav-header">
                <h3>Questions</h3>
                <span>{totalQuestions} Total</span>
              </div>

              <div className="status-filter">
                {(["all", "correct", "wrong", "skipped"] as const).map(
                  (chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`filter-chip ${filter === chip ? "active" : ""}`}
                      onClick={() => setFilter(chip)}
                    >
                      {chip === "skipped"
                        ? "Skip"
                        : chip.charAt(0).toUpperCase() + chip.slice(1)}
                    </button>
                  ),
                )}
              </div>

              <div className="question-grid">
                {questions.map((q, idx) => {
                  const status = getStatus(q);
                  if (filter !== "all" && status !== filter) return null;
                  return (
                    <button
                      key={`${q.questionId}-${idx}`}
                      type="button"
                      className={`question-number ${status} ${
                        currentQuestionIdx === idx ? "active" : ""
                      }`}
                      onClick={() => setCurrentQuestionIdx(idx)}
                    >
                      {q.questionNumber}
                    </button>
                  );
                })}
              </div>

              <div className="legend">
                <div className="legend-item">
                  <div className="legend-dot correct" /> Correct
                </div>
                <div className="legend-item">
                  <div className="legend-dot wrong" /> Incorrect
                </div>
                <div className="legend-item">
                  <div className="legend-dot skipped" /> Skipped
                </div>
              </div>
            </aside>

            <section>
              {qData && (
                <div className="question-card">
                  <div className="question-top">
                    <div className="question-title">
                      <strong>Question {qData.questionNumber}</strong>
                      <span className={`status-badge ${currentStatus}`}>
                        {currentStatus === "correct"
                          ? "✓ Correct"
                          : currentStatus === "wrong"
                            ? "✕ Incorrect"
                            : "○ Skipped"}
                      </span>
                    </div>
                    <span className="marks">
                      {qData.marksObtained > 0 ? "+" : ""}
                      {qData.marksObtained} Marks
                    </span>
                  </div>

                  <div className="question-body">
                    <div className="question-category">
                      {qData.subjectName ||
                        reviewData.subjectName ||
                        reviewData.testTitle}
                    </div>
                    <div className="question-text">{qData.questionText}</div>

                    <div className="options">
                      {qData.options.map((opt, index) => {
                        const letter = String.fromCharCode(65 + index);
                        const isCorrectAnswer =
                          opt.id === qData.correctAnswerId;
                        const isUserAnswer = opt.id === qData.userAnswerId;

                        let optionClass = "";
                        if (isCorrectAnswer) optionClass = "correct-answer";
                        else if (isUserAnswer && !qData.isCorrect)
                          optionClass = "user-wrong";

                        return (
                          <div key={opt.id} className={`option ${optionClass}`}>
                            <div className="option-letter">{letter}</div>
                            <div className="option-text">{opt.text}</div>
                            {isCorrectAnswer && (
                              <span className="answer-label">
                                ✓ Correct Answer
                              </span>
                            )}
                            {isUserAnswer && !qData.isCorrect && (
                              <span className="wrong-label">✕ Your Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {qData.explanation && (
                      <div className="answer-info-box">
                        <div className="answer-info-title">
                          <span>💡</span>
                          <strong>Explanation</strong>
                        </div>
                        <p>{qData.explanation}</p>
                      </div>
                    )}

                    <div className="question-meta">
                      <div className="meta">
                        <span>YOUR ANSWER</span>
                        <strong>
                          {qData.userAnswerId
                            ? (() => {
                                const idx = qData.options.findIndex(
                                  (o) => o.id === qData.userAnswerId,
                                );
                                return idx >= 0
                                  ? String.fromCharCode(65 + idx)
                                  : qData.userAnswerText || "Selected";
                              })()
                            : "Skipped"}
                        </strong>
                      </div>
                      <div className="meta">
                        <span>CORRECT ANSWER</span>
                        <strong>
                          {qData.correctAnswerId
                            ? (() => {
                                const idx = qData.options.findIndex(
                                  (o) => o.id === qData.correctAnswerId,
                                );
                                return idx >= 0
                                  ? String.fromCharCode(65 + idx)
                                  : qData.correctAnswerText || "N/A";
                              })()
                            : "N/A"}
                        </strong>
                      </div>
                      <div className="meta">
                        <span>TIME SPENT</span>
                        <strong>
                          {formatDurationSeconds(qData.timeSpentSeconds)}
                        </strong>
                      </div>
                      <div className="meta">
                        <span>MARKS</span>
                        <strong>
                          {qData.marksObtained > 0 ? "+" : ""}
                          {qData.marksObtained}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="question-footer">
                    <button
                      type="button"
                      className={`nav-btn ${
                        totalQuestions > 1 &&
                        currentQuestionIdx === totalQuestions - 1
                          ? "primary"
                          : ""
                      }`}
                      onClick={() =>
                        setCurrentQuestionIdx((p) => Math.max(0, p - 1))
                      }
                      disabled={currentQuestionIdx === 0}
                    >
                      ← Previous
                    </button>
                    <span className="question-position">
                      Question {currentQuestionIdx + 1} of {totalQuestions}
                    </span>
                    <button
                      type="button"
                      className={`nav-btn ${
                        currentQuestionIdx < totalQuestions - 1 ? "primary" : ""
                      }`}
                      onClick={() =>
                        setCurrentQuestionIdx((p) =>
                          Math.min(totalQuestions - 1, p + 1),
                        )
                      }
                      disabled={currentQuestionIdx >= totalQuestions - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              <div className="summary-card">
                <div className="summary-header">
                  <h2>Test Summary</h2>
                  <span>{reviewData.testTitle}</span>
                </div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>{reviewData.correctCount}</strong>
                    <span>Correct</span>
                  </div>
                  <div className="summary-item">
                    <strong>{reviewData.wrongCount}</strong>
                    <span>Incorrect</span>
                  </div>
                  <div className="summary-item">
                    <strong>{reviewData.skippedCount}</strong>
                    <span>Skipped</span>
                  </div>
                  <div className="summary-item">
                    <strong>
                      {reviewData.obtainedMarks}/{reviewData.totalMarks}
                    </strong>
                    <span>Final Score</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
