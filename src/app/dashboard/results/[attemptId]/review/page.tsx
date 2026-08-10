'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getData } from '../../../../../services/apiClient';
import { ENDPOINTS } from '../../../../../constants/apiEndpoints';
import { Loader2 } from 'lucide-react';
import './reviewInterface.css';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [reviewData, setReviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const data = await getData(`${ENDPOINTS.ATTEMPTS}/${attemptId}/answers`);
        setReviewData(data);
      } catch (err: any) {
        const errData = err.response?.data;
        setError(typeof errData === 'string' ? errData : errData?.message || 'Failed to fetch review data');
      } finally {
        setIsLoading(false);
      }
    };
    if (attemptId) fetchReview();
  }, [attemptId]);

  const backToResult = () => {
    router.push(`/dashboard/results/${attemptId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 min-h-screen bg-[#f6f7fb]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading review...</p>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="max-w-2xl mx-auto py-20 min-h-screen bg-[#f6f7fb]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
          <h2 className="font-bold text-lg mb-2">Error</h2>
          <p>{error || 'No review data found'}</p>
          <button 
            onClick={backToResult}
            className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { questions = [] } = reviewData;
  const totalQuestions = questions.length;
  const qData = questions[currentQuestionIdx];

  const loadQuestion = (idx: number) => {
    setCurrentQuestionIdx(idx);
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleFilter = (status: string) => {
    setFilter(status);
  };

  const getStatus = (q: any) => {
    if (q.is_skipped) return 'skipped';
    return q.is_correct ? 'correct' : 'wrong';
  };

  const currentStatus = qData ? getStatus(qData) : 'skipped';

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#172033]">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <div className="logo">Q</div>
          <div className="brand-info">
            <h2>Quizly</h2>
            <span>Answer Review</span>
          </div>
        </div>
        <button className="back-btn" onClick={backToResult}>
          ← Back to Result
        </button>
      </header>

      {/* MAIN */}
      <main className="container">
        {/* PAGE HEADER */}
        <div className="page-header">
          <div>
            <h1>Review Answers</h1>
            <p>{reviewData.test_title || 'Mathematics'} · Attempt #{attemptId}</p>
          </div>
          <div className="progress-info">
            <strong>{currentQuestionIdx + 1} / {totalQuestions}</strong>
            <span>Questions Reviewed</span>
          </div>
        </div>

        {/* REVIEW LAYOUT */}
        <div className="review-layout">
          {/* QUESTION NAV */}
          <aside className="question-nav">
            <div className="nav-header">
              <h3>Questions</h3>
              <span>{totalQuestions} Total</span>
            </div>

            {/* FILTER */}
            <div className="status-filter">
              <button
                className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-chip ${filter === 'correct' ? 'active' : ''}`}
                onClick={() => handleFilter('correct')}
              >
                Correct
              </button>
              <button
                className={`filter-chip ${filter === 'wrong' ? 'active' : ''}`}
                onClick={() => handleFilter('wrong')}
              >
                Wrong
              </button>
              <button
                className={`filter-chip ${filter === 'skipped' ? 'active' : ''}`}
                onClick={() => handleFilter('skipped')}
              >
                Skip
              </button>
            </div>

            {/* QUESTION NUMBERS */}
            <div className="question-grid">
              {questions.map((q: any, idx: number) => {
                const status = getStatus(q);
                const isVisible = filter === 'all' || status === filter;
                const isActive = currentQuestionIdx === idx;
                
                if (!isVisible) return null;

                return (
                  <button
                    key={q.question_id}
                    className={`question-number ${status} ${isActive ? 'active' : ''}`}
                    onClick={() => loadQuestion(idx)}
                  >
                    {q.question_number}
                  </button>
                );
              })}
            </div>

            {/* LEGEND */}
            <div className="legend">
              <div className="legend-item">
                <div className="legend-dot correct"></div>
                Correct
              </div>
              <div className="legend-item">
                <div className="legend-dot wrong"></div>
                Incorrect
              </div>
              <div className="legend-item">
                <div className="legend-dot skipped"></div>
                Skipped
              </div>
            </div>
          </aside>

          {/* QUESTION CONTENT */}
          <section>
            {qData && (
              <div className="question-card">
                {/* QUESTION TOP */}
                <div className="question-top">
                  <div className="question-title">
                    <strong>Question {qData.question_number}</strong>
                    <span className={`status-badge ${currentStatus}`}>
                      {currentStatus === 'correct' ? '✓ Correct' : currentStatus === 'wrong' ? '✕ Incorrect' : '○ Skipped'}
                    </span>
                  </div>
                  <span className="marks">
                    {qData.marks_obtained > 0 ? '+' : ''}{qData.marks_obtained} Marks
                  </span>
                </div>

                {/* QUESTION BODY */}
                <div className="question-body">
                  <div className="question-category">
                    {reviewData.test_title || 'General'}
                  </div>
                  <div className="question-text">
                    {qData.question}
                  </div>

                  {/* OPTIONS */}
                  <div className="options">
                    {qData.options.map((opt: any, index: number) => {
                      const letter = String.fromCharCode(65 + index);
                      const isCorrectAnswer = opt.id === qData.correct_answer;
                      const isUserAnswer = opt.id === qData.user_answer;
                      
                      let optionClass = '';
                      if (isCorrectAnswer) {
                        optionClass = 'correct-answer';
                      } else if (isUserAnswer && !qData.is_correct) {
                        optionClass = 'user-wrong';
                      }

                      return (
                        <div key={opt.id} className={`option ${optionClass}`}>
                          <div className="option-letter">{letter}</div>
                          <div className="option-text">{opt.text}</div>
                          {isCorrectAnswer && <span className="answer-label">✓ Correct Answer</span>}
                          {isUserAnswer && !qData.is_correct && <span className="wrong-label">✕ Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* EXPLANATION */}
                  {qData.explanation && (
                    <div className="answer-info-box">
                      <div className="answer-info-title">
                        <span>💡</span>
                        <strong>Explanation</strong>
                      </div>
                      <p>{qData.explanation}</p>
                    </div>
                  )}

                  {/* META */}
                  <div className="question-meta">
                    <div className="meta">
                      <span>YOUR ANSWER</span>
                      <strong>
                        {qData.user_answer 
                          ? String.fromCharCode(65 + qData.options.findIndex((o:any) => o.id === qData.user_answer)) 
                          : 'None'}
                      </strong>
                    </div>
                    <div className="meta">
                      <span>CORRECT ANSWER</span>
                      <strong>
                        {qData.correct_answer 
                          ? String.fromCharCode(65 + qData.options.findIndex((o:any) => o.id === qData.correct_answer)) 
                          : 'None'}
                      </strong>
                    </div>
                    <div className="meta">
                      <span>TIME TAKEN</span>
                      <strong>{qData.time_taken_seconds || 0} sec</strong>
                    </div>
                    <div className="meta">
                      <span>MARKS</span>
                      <strong>
                        {qData.marks_obtained > 0 ? '+' : ''}{qData.marks_obtained}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="question-footer">
                  <button className="nav-btn" onClick={previousQuestion} disabled={currentQuestionIdx === 0}>
                    ← Previous
                  </button>
                  <span className="question-position">
                    Question {currentQuestionIdx + 1} of {totalQuestions}
                  </span>
                  <button className="nav-btn primary" onClick={nextQuestion} disabled={currentQuestionIdx === totalQuestions - 1}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* SUMMARY */}
            <div className="summary-card">
              <div className="summary-header">
                <h2>Test Summary</h2>
                <span>{reviewData.test_title || 'Mathematics'}</span>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>{reviewData.correct_answers || 0}</strong>
                  <span>Correct</span>
                </div>
                <div className="summary-item">
                  <strong>{reviewData.wrong_answers || 0}</strong>
                  <span>Incorrect</span>
                </div>
                <div className="summary-item">
                  <strong>{reviewData.skipped_answers !== undefined ? reviewData.skipped_answers : (reviewData.total_questions - (reviewData.correct_answers + reviewData.wrong_answers)) || 0}</strong>
                  <span>Skipped</span>
                </div>
                <div className="summary-item">
                  <strong>{reviewData.obtained_marks || 0}/{reviewData.total_marks || (reviewData.total_questions ? reviewData.total_questions * 4 : 0)}</strong>
                  <span>Final Score</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
