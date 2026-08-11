'use client';
import { useEffect, useState } from 'react';
import { getData } from '../../../../services/apiClient';
import { ENDPOINTS } from '../../../../constants/apiEndpoints';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import './resultInterface.css';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await getData(`${ENDPOINTS.ATTEMPTS}/${attemptId}/result`);
        setResult(data);
      } catch (err: any) {
        const errData = err.response?.data;
        setError(typeof errData === 'string' ? errData : errData?.message || 'Failed to fetch result');
      } finally {
        setIsLoading(false);
      }
    };
    if (attemptId) fetchResult();
  }, [attemptId]);

  const viewSolutions = () => {
    router.push(`/dashboard/results/${attemptId}/review`);
  };

  const retakeTest = () => {
    const confirmed = confirm("Do you want to retake this test?");
    if (confirmed) {
      router.push('/dashboard/exams'); // fallback route
    }
  };

  const goToTests = () => {
    router.push('/dashboard/exams');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 min-h-screen bg-[#f6f7fb]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your result...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 min-h-screen bg-[#f6f7fb]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
          <h2 className="font-bold text-lg mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={goToTests}
            className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Derive stats from API
  const score = parseFloat(result?.score || '0');
  const totalMarks = result?.total_marks || (result?.total_questions ? result.total_questions * 4 : 0); // fallback to 4 marks per q if not provided
  const percentage = result?.percentage || (totalMarks > 0 ? (score / totalMarks) * 100 : 0);
  const totalQuestions = result?.total_questions || 0;
  const correct = result?.correct_answers || 0;
  const wrong = result?.wrong_answers || 0;
  const answered = result?.attempted_questions || 0;
  const skipped = result?.skipped_questions !== undefined ? result.skipped_questions : (totalQuestions - answered);
  
  const completedDate = result?.submitted_at 
    ? new Date(result.submitted_at).toLocaleString('en-US', { 
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true 
      }) 
    : (result?.started_at ? new Date(result.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric' }) : 'N/A');

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#172033]">

      <main className="container">
        <div className="page-title">
          <h1>Test Result</h1>
          <p>Here's your performance summary for the completed test.</p>
        </div>

        <section className="result-hero">
          <div className="score-section">
            <div className="score-circle">
              <div className="score-value">{Math.round(percentage)}%</div>
              <div className="score-label">Overall Score</div>
            </div>
            <div className={`result-status ${percentage >= 50 ? 'bg-[#eafaf4] text-[#079669]' : 'bg-[#fff1f1] text-[#e5484d]'}`}>
              {percentage >= 50 ? '✓ Test Passed' : '✕ Needs Improvement'}
            </div>
          </div>

          <div className="result-details">
            <h2>JEE Mathematics — Algebra</h2>
            <p>Completed on {completedDate}</p>

            <div className="detail-grid">
              <div className="detail-box">
                <span>Score</span>
                <strong>{score} / {totalMarks}</strong>
              </div>
              <div className="detail-box">
                <span>Percentage</span>
                <strong>{Number(percentage).toFixed(2)}%</strong>
              </div>
              <div className="detail-box">
                <span>Rank</span>
                <strong>#---</strong>
              </div>
              <div className="detail-box">
                <span>Percentile</span>
                <strong>---%</strong>
              </div>
            </div>
          </div>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">✓</div>
            </div>
            <h3>{correct}</h3>
            <p>Correct Answers</p>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">✕</div>
            </div>
            <h3>{wrong}</h3>
            <p>Incorrect Answers</p>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">○</div>
            </div>
            <h3>{skipped}</h3>
            <p>Questions Skipped</p>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">✓</div>
            </div>
            <h3>{answered}</h3>
            <p>Total Attempted</p>
          </div>
        </div>

        <div className="content-grid">
          <div>
            <div className="card">
              <div className="card-header">
                <h2>Subject Performance</h2>
                <span>Accuracy</span>
              </div>
              <div className="performance-row">
                <span>📐</span>
                <div>
                  <div className="subject-name">Overall Mathematics</div>
                  <div className="performance-bar">
                    <div className="performance-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
                <div className="performance-score">{Math.round(percentage)}%</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Answer Summary</h2>
                <span>{totalQuestions} Questions</span>
              </div>
              <div className="answer-summary">
                <div className="answer-box correct">
                  <div className="answer-icon">✓</div>
                  <div className="answer-info">
                    <strong>{correct}</strong>
                    <span>Correct</span>
                  </div>
                </div>
                <div className="answer-box wrong">
                  <div className="answer-icon">✕</div>
                  <div className="answer-info">
                    <strong>{wrong}</strong>
                    <span>Incorrect</span>
                  </div>
                </div>
                <div className="answer-box skipped">
                  <div className="answer-icon">—</div>
                  <div className="answer-info">
                    <strong>{skipped}</strong>
                    <span>Skipped</span>
                  </div>
                </div>
                <div className="answer-box review">
                  <div className="answer-icon">★</div>
                  <div className="answer-info">
                    <strong>{answered}</strong>
                    <span>Total Attempted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <h2>Score Breakdown</h2>
              </div>
              <div className="score-row">
                <span>Correct Answers</span>
                <strong>{correct}</strong>
              </div>
              <div className="score-row">
                <span>Incorrect Answers</span>
                <strong>{wrong}</strong>
              </div>
              <div className="score-row">
                <span>Unattempted</span>
                <strong>{skipped}</strong>
              </div>
              <div className="score-row total">
                <span>Total Score</span>
                <strong>{score} / {totalMarks}</strong>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>What's Next?</h2>
              </div>
              <div className="actions">
                <button className="btn btn-primary" onClick={viewSolutions}>
                  View Solutions
                </button>
                <button className="btn btn-secondary" onClick={retakeTest}>
                  Retake Test
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Test Information</h2>
              </div>
              <div className="score-row">
                <span>Test</span>
                <strong>{result?.test_id ? `Test #${result.test_id}` : 'Mathematics'}</strong>
              </div>
              <div className="score-row">
                <span>Questions</span>
                <strong>{totalQuestions}</strong>
              </div>
              <div className="score-row">
                <span>Attempt</span>
                <strong>#{result?.id || '-'}</strong>
              </div>
              <div className="score-row">
                <span>Date</span>
                <strong>{completedDate}</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
