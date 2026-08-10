'use client';
import { useEffect, useState } from 'react';
import { getData, postData } from '../../../../services/apiClient';
import { ENDPOINTS } from '../../../../constants/apiEndpoints';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import './testInterface.css';

export default function QuizInterfacePage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // Store selected answers locally: questionIndex -> optionIndex
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  // Store marked for review: Set of questionIndexes
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  
  const [totalSeconds, setTotalSeconds] = useState(60 * 60); // 60 minutes
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize attempt and fetch questions
  useEffect(() => {
    const initTest = async () => {
      try {
        // 1. Start attempt
        const attemptRes = await postData(`${ENDPOINTS.TESTS}/${testId}/start`, { userId: 1 });
        setAttemptId(attemptRes.attemptId || attemptRes.id);

        // 2. Fetch questions
        const questionsData = await getData(`${ENDPOINTS.TESTS}/${testId}/questions`);
        setQuestions(questionsData);
      } catch (err: any) {
        const errData = err.response?.data;
        setError(typeof errData === 'string' ? errData : errData?.message || 'Failed to start test');
      } finally {
        setIsLoading(false);
      }
    };
    if (testId) initTest();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (isLoading || isSubmitting || questions.length === 0) return;
    
    const interval = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLoading, isSubmitting, questions.length]);

  const handleOptionSelect = async (questionIndex: number, optionIndex: number) => {
    // Optimistic update
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    
    // Save to backend
    if (attemptId) {
      try {
        const qData = questions[questionIndex];
        const option = qData.options[optionIndex];
        await postData(`${ENDPOINTS.ATTEMPTS}/${attemptId}/answer`, {
          questionId: qData.id || qData._id,
          optionId: option.id || option._id
        });
      } catch (err) {
        console.error('Failed to save answer', err);
      }
    }
  };

  const toggleMark = () => {
    setMarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion)) {
        next.delete(currentQuestion);
      } else {
        next.add(currentQuestion);
      }
      return next;
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!attemptId) return;
    
    const answered = Object.keys(selectedAnswers).length;
    if (!confirm(`You have answered ${answered} out of ${questions.length} questions.\n\nAre you sure you want to submit?`)) return;
    
    setIsSubmitting(true);
    try {
      await postData(`${ENDPOINTS.ATTEMPTS}/${attemptId}/submit`, {});
      // Navigate to results
      router.push(`/dashboard/results/${attemptId}`);
    } catch (err: any) {
      alert('Failed to submit test');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Preparing your test...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
          <h2 className="font-bold text-lg mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard/exams')}
            className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-gray-500">
        No questions available for this test.
      </div>
    );
  }

  const qData = questions[currentQuestion];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isMarked = markedQuestions.has(currentQuestion);

  return (
    <div className="max-w-[1350px] mx-auto pt-2">
      <header className="test-header">
        <div className="test-brand">
          <div className="test-logo">Q</div>
          <div className="test-brand-info">
            <h2>JEE Main — Mathematics</h2>
            <span>Mathematics Test 01</span>
          </div>
        </div>

        <div className="test-timer">
          <div className="test-timer-icon">⏱</div>
          <div className="test-timer-info">
            <span>Time Remaining</span>
            <strong>{timeString}</strong>
          </div>
        </div>
      </header>

      <main className="test-main">
        
        <section className="test-question-card">
          <div className="test-question-top">
            <div className="test-question-number">
              Question <strong>{currentQuestion + 1} of {questions.length}</strong>
            </div>
            <div className="test-question-type">Single Choice</div>
          </div>

          <h1 className="test-question-text">
            {qData.text || qData.question_text || qData.question}
          </h1>

          <div className="test-options">
            {qData.options?.map((option: any, optIndex: number) => {
              const isSelected = selectedAnswers[currentQuestion] === optIndex;
              const letter = String.fromCharCode(65 + optIndex);
              
              return (
                <div 
                  key={optIndex}
                  className={`test-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(currentQuestion, optIndex)}
                >
                  <div className="test-option-letter">{letter}</div>
                  <div className="test-option-text">
                    {option.text || option.option_text || option}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="test-question-footer">
            <button 
              className={`test-mark-btn ${isMarked ? 'marked' : ''}`}
              onClick={toggleMark}
            >
              {isMarked ? '★ Marked for Review' : '☆ Mark for Review'}
            </button>
            <div className="test-actions">
              <button className="test-btn" onClick={previousQuestion}>← Previous</button>
              <button className="test-btn primary" onClick={nextQuestion}>Save & Next →</button>
              <button className="test-btn submit" onClick={handleSubmitTest} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </section>

        <aside className="test-sidebar">
          
          <div className="test-side-card">
            <div className="test-side-title">
              <h3>Test Progress</h3>
              <span>{answeredCount} / {questions.length}</span>
            </div>
            <div className="test-progress">
              <div className="test-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="test-progress-text">
              <span>{answeredCount} Answered</span>
              <span>{questions.length - answeredCount} Remaining</span>
            </div>
          </div>

          <div className="test-side-card">
            <div className="test-side-title">
              <h3>Questions</h3>
              <span>{questions.length} Total</span>
            </div>
            
            <div className="test-question-grid">
              {questions.map((_, idx) => {
                const answered = selectedAnswers[idx] !== undefined;
                const marked = markedQuestions.has(idx);
                const current = currentQuestion === idx;
                
                let classes = "test-q-number";
                if (answered) classes += " answered";
                if (marked) classes += " marked";
                if (current) classes += " current";
                
                return (
                  <div key={idx} className={classes} onClick={() => setCurrentQuestion(idx)}>
                    {idx + 1}
                  </div>
                );
              })}
            </div>
            
            <div className="test-legend">
              <div className="test-legend-item">
                <span className="test-legend-dot answered"></span> Answered
              </div>
              <div className="test-legend-item">
                <span className="test-legend-dot"></span> Not Answered
              </div>
              <div className="test-legend-item">
                <span className="test-legend-dot marked"></span> Review
              </div>
              <div className="test-legend-item">
                <span className="test-legend-dot current"></span> Current
              </div>
            </div>
          </div>

          <div className="test-side-card">
            <div className="test-side-title">
              <h3>Test Information</h3>
            </div>
            <div className="test-subject-row">
              <span>Subject</span>
              <strong>Mathematics</strong>
            </div>
            <div className="test-subject-row">
              <span>Questions</span>
              <strong>{questions.length}</strong>
            </div>
            <div className="test-subject-row">
              <span>Duration</span>
              <strong>60 Minutes</strong>
            </div>
            <div className="test-subject-row">
              <span>Marks</span>
              <strong>+4 / -1</strong>
            </div>
          </div>

        </aside>

      </main>
    </div>
  );
}
