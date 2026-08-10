'use client';
import { useEffect, useState } from 'react';
import { getData } from '../../../services/apiClient';
import { ENDPOINTS } from '../../../constants/apiEndpoints';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import './exams.css';

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await getData(ENDPOINTS.EXAMS);
        setExams(data);
      } catch (err: any) {
        const errData = err.response?.data;
        setError(typeof errData === 'string' ? errData : errData?.message || 'Failed to fetch exams');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getCoverColor = (index: number) => {
    const colors = ['', 'blue', 'green', 'orange', 'pink', 'cyan'];
    return colors[index % colors.length];
  };

  const getIcon = (index: number) => {
    const icons = ['∑', '⚕', '★', '📊', '📚', '💡'];
    return icons[index % icons.length];
  };

  const filteredExams = exams.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()));

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
    <>
      <div className="dashboard-page-header">
        <div>
          <h1>📝 Exams</h1>
          <p>Explore exams and start preparing for your goals.</p>
        </div>
        <button className="dashboard-filter-btn">⚙ Filters</button>
      </div>

      <div className="dashboard-filters">
        <button className="dashboard-filter active">All Exams</button>
        <button className="dashboard-filter">Competitive</button>
        <button className="dashboard-filter">School</button>
        <button className="dashboard-filter">University</button>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search exams..." 
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="dashboard-exam-grid">
        {filteredExams.map((exam, index) => (
          <div 
            key={exam.id || exam._id} 
            className="dashboard-exam-card"
            onClick={() => router.push(`/dashboard/exams/${exam.id || exam._id}/subjects`)}
          >
            <div className={`dashboard-exam-cover ${getCoverColor(index)}`}>
              <div className="dashboard-exam-icon-large">{getIcon(index)}</div>
              <div className="dashboard-exam-tag">Competitive</div>
              <h2>{exam.name || 'Exam Type'}</h2>
            </div>

            <div className="dashboard-exam-body">
              <p className="dashboard-exam-description">
                {exam.description || 'Comprehensive examination covering multiple advanced topics.'}
              </p>

              <div className="dashboard-exam-info-grid">
                <div className="dashboard-info-item">
                  <div className="dashboard-info-icon">◈</div>
                  <div>
                    <span>Subjects</span>
                    <strong>3 Subjects</strong>
                  </div>
                </div>

                <div className="dashboard-info-item">
                  <div className="dashboard-info-icon">⏱</div>
                  <div>
                    <span>Duration</span>
                    <strong>180 Minutes</strong>
                  </div>
                </div>

                <div className="dashboard-info-item">
                  <div className="dashboard-info-icon">?</div>
                  <div>
                    <span>Questions</span>
                    <strong>90 Questions</strong>
                  </div>
                </div>

                <div className="dashboard-info-item">
                  <div className="dashboard-info-icon">%</div>
                  <div>
                    <span>Attempts</span>
                    <strong>Unlimited</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-exam-footer">
                <span className="dashboard-subjects-list">Physics • Chemistry • Maths</span>
                <button 
                  className="dashboard-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/exams/${exam.id || exam._id}/subjects`);
                  }}
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredExams.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No exams found.
          </div>
        )}
      </div>
    </>
  );
}
