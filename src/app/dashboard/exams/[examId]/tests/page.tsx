'use client';
import { useEffect, useState } from 'react';
import { getData } from '../../../../../services/apiClient';
import { ENDPOINTS } from '../../../../../constants/apiEndpoints';
import { Loader2, Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import './availableTests.css';

export default function SubjectTestsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await getData(`${ENDPOINTS.EXAMS}/${examId}/tests`);
        // Provide mock attributes if missing
        const testsWithMeta = data.map((t: any) => ({
          ...t,
          difficulty: t.difficulty || ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
          category: t.category || ['jee', 'neet', 'school', 'practice'][Math.floor(Math.random() * 4)],
          attempts: t.attempts || Math.floor(Math.random() * 3000),
        }));
        setTests(testsWithMeta);
      } catch (err: any) {
        const errData = err.response?.data;
        setError(typeof errData === 'string' ? errData : errData?.message || 'Failed to fetch tests');
      } finally {
        setIsLoading(false);
      }
    };
    if (examId) fetchTests();
  }, [examId]);

  const filteredTests = tests.filter(test => {
    const textMatches = (test.name || test.title || '').toLowerCase().includes(search.toLowerCase());
    const diffMatches = difficultyFilter === 'all' || test.difficulty === difficultyFilter;
    const catMatches = activeTab === 'all' || test.subject_name === activeTab;
    return textMatches && diffMatches && catMatches;
  });

  const subjects = Array.from(new Set(tests.map(t => t.subject_name).filter(Boolean)));

  const resetFilters = () => {
    setSearch('');
    setDifficultyFilter('all');
    setActiveTab('all');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="at-container">
      
      {/* HERO */}
      <section className="at-hero">
        <div className="at-hero-content">
          <h1>Available Tests</h1>
          <p>Choose a test and start preparing for your next exam.</p>
        </div>
        
        <div className="at-hero-stats">
          <div className="at-stat">
            <strong>{tests.length}</strong>
            <span>Available Tests</span>
          </div>
          <div className="at-stat">
            <strong>08</strong>
            <span>Completed</span>
          </div>
          <div className="at-stat">
            <strong>72%</strong>
            <span>Avg. Score</span>
          </div>
        </div>
      </section>



      {/* SECTION HEADER */}
      <div className="at-section-header">
        <h2>Recommended Tests</h2>
        <span>{filteredTests.length} Tests</span>
      </div>

      {/* TEST GRID */}
      {filteredTests.length > 0 ? (
        <div className="at-test-grid">
          {filteredTests.map((test) => (
            <div key={test.id || test._id} className="at-test-card">
              
              <div className="at-card-top">
                <div className="at-subject-icon">📝</div>
                <span className={`at-difficulty ${test.difficulty}`}>
                  {(test.difficulty || 'MEDIUM').toUpperCase()}
                </span>
              </div>
              
              <div className="text-xs font-semibold text-indigo-600 mb-1">{test.subject_name}</div>
              <h3>{test.name || test.title || 'Practice Test'}</h3>
              
              <p className="at-test-description">
                {test.description || 'Test your understanding and challenge your knowledge with this comprehensive test.'}
              </p>
              
              <div className="at-test-meta">
                <div className="at-meta-item">
                  <strong>{test.total_questions || test.totalQuestions || 20}</strong>
                  <span>Questions</span>
                </div>
                <div className="at-meta-item">
                  <strong>{test.duration_minutes || test.durationMinutes || 30} Min</strong>
                  <span>Duration</span>
                </div>
                <div className="at-meta-item">
                  <strong>{(test.total_questions || test.totalQuestions || 20) * 4}</strong>
                  <span>Marks</span>
                </div>
              </div>
              
              <div className="at-card-footer">
                <span className="at-attempt-info">
                  {test.attempts?.toLocaleString()} students attempted
                </span>
                <button 
                  className="at-start-btn"
                  onClick={() => router.push(`/dashboard/tests/${test.id || test._id}`)}
                >
                  Start Test →
                </button>
              </div>
              
            </div>
          ))}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="at-empty-state">
          <div className="at-empty-icon">🔍</div>
          <h3>No tests found</h3>
          <p>Try changing your search or filters.</p>
        </div>
      )}

    </div>
  );
}
