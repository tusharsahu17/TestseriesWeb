'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getData } from '@/services/apiClient';
import { ENDPOINTS } from '@/constants/apiEndpoints';

// Define a type for Attempt, adjust based on actual API response
interface Attempt {
  id: number;
  test_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  score: number;
  status: string;
  // If the backend joins with the test to give test title
  test?: {
    id: number;
    title: string;
    subject?: {
      name: string;
    }
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        // Using the user_id from token is handled by the backend typically.
        // Assuming /api/attempts returns all attempts for the current user.
        const data = await getData(ENDPOINTS.ATTEMPTS);
        
        // Sometimes backend wraps response in { attempts: [...] } or { data: [...] }
        if (Array.isArray(data)) {
           setAttempts(data);
        } else if (data.attempts && Array.isArray(data.attempts)) {
           setAttempts(data.attempts);
        } else if (data.data && Array.isArray(data.data)) {
           setAttempts(data.data);
        } else {
           console.warn("Unexpected API response structure for attempts:", data);
           setAttempts([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch attempts:', err);
        setError('Failed to load your test results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #6c5ce7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style jsx>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-card" style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button className="dashboard-continue-btn" onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Your Results 📊</h1>
          <p>Review your past test attempts and track your progress.</p>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3>Test History</h3>
        </div>

        {attempts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <p>You haven't taken any tests yet.</p>
            <button 
              className="dashboard-continue-btn" 
              onClick={() => router.push('/dashboard/tests')}
              style={{ marginTop: '1rem' }}
            >
              Browse Available Tests
            </button>
          </div>
        ) : (
          <div className="dashboard-recent-wrapper" style={{ overflowX: 'auto' }}>
            <table className="dashboard-recent-table">
              <thead>
                <tr>
                  <th>TEST</th>
                  <th>DATE</th>
                  <th>SCORE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => {
                  const testTitle = attempt.test?.title || `Test #${attempt.test_id}`;
                  // const subjectName = attempt.test?.subject?.name || 'N/A';
                  const date = new Date(attempt.start_time).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  
                  const scoreValue = parseFloat(attempt.score as unknown as string);
                  let scoreBadgeClass = 'dashboard-medium-score';
                  if (scoreValue >= 80) scoreBadgeClass = 'dashboard-high-score';
                  else if (scoreValue < 50) scoreBadgeClass = 'dashboard-low-score';

                  return (
                    <tr key={attempt.id}>
                      <td className="dashboard-test-name">{testTitle}</td>
                      <td className="dashboard-test-date">{date}</td>
                      <td>
                        {attempt.status === 'completed' ? (
                          <span className={`dashboard-score-badge ${scoreBadgeClass}`}>
                            {scoreValue}%
                          </span>
                        ) : (
                          <span style={{ color: '#a0aec0' }}>--</span>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          textTransform: 'capitalize',
                          color: attempt.status === 'completed' ? '#2ecc71' : '#f39c12'
                        }}>
                          {attempt.status}
                        </span>
                      </td>
                      <td>
                        <Link 
                          href={`/dashboard/results/${attempt.id}`}
                          className="dashboard-view-all"
                          style={{ textDecoration: 'none', padding: '6px 12px', background: '#f8f9fa', borderRadius: '4px', color: '#6c5ce7', fontWeight: 600 }}
                        >
                          View Results
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
