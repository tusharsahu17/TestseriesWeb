'use client';

import { useEffect, useState } from 'react';
import { getData } from '../../../services/apiClient';
import { ENDPOINTS } from '../../../constants/apiEndpoints';
import { useRouter } from 'next/navigation';
import { Loader2, Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
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

        setError(
          typeof errData === 'string'
            ? errData
            : errData?.message || 'Failed to fetch exams'
        );
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

  const filteredExams = exams.filter((exam) =>
    exam.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openExam = (exam: any) => {
    router.push(
      `/dashboard/exams/${exam.id || exam._id}/subjects`
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-exams-loading">
        <Loader2 className="dashboard-loading-icon" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-exams-error">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard-exams-page">

      {/* PAGE HEADER */}

      <div className="dashboard-page-header">

        <div className="dashboard-page-heading">

          <div className="dashboard-page-heading-icon">
            📝
          </div>

          <div>
            <h1>Exams</h1>

            <p>
              Explore exams and start preparing for your goals.
            </p>
          </div>

        </div>

        <button className="dashboard-filter-btn">
          <SlidersHorizontal size={14} />
          <span>Filters</span>
        </button>

      </div>


      {/* FILTER + SEARCH */}

      <div className="dashboard-toolbar">

        <div className="dashboard-filters">

          <button className="dashboard-filter active">
            All Exams
          </button>

          <button className="dashboard-filter">
            Competitive
          </button>

          <button className="dashboard-filter">
            School
          </button>

          <button className="dashboard-filter">
            University
          </button>

        </div>


        <div className="dashboard-search">

          <Search size={15} />

          <input
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>


      {/* EXAM GRID */}

      <div className="dashboard-exam-grid">

        {filteredExams.map((exam, index) => (

          <article
            key={exam.id || exam._id}
            className="dashboard-exam-card"
            onClick={() => openExam(exam)}
          >

            {/* CARD COVER */}

            <div
              className={`dashboard-exam-cover ${getCoverColor(index)}`}
            >

              <div className="dashboard-exam-cover-top">

                <div className="dashboard-exam-icon-large">
                  {getIcon(index)}
                </div>

                <div className="dashboard-exam-tag">
                  Competitive
                </div>

              </div>

              <h2>
                {exam.name || 'Exam Type'}
              </h2>

            </div>


            {/* CARD CONTENT */}

            <div className="dashboard-exam-body">

              <p className="dashboard-exam-description">
                {exam.description ||
                  'Comprehensive examination covering multiple advanced topics.'}
              </p>


              <div className="dashboard-exam-info-grid">

                <div className="dashboard-info-item">

                  <div className="dashboard-info-icon">
                    ◈
                  </div>

                  <div>
                    <span>Subjects</span>
                    <strong>3 Subjects</strong>
                  </div>

                </div>


                <div className="dashboard-info-item">

                  <div className="dashboard-info-icon">
                    ⏱
                  </div>

                  <div>
                    <span>Duration</span>
                    <strong>180 Minutes</strong>
                  </div>

                </div>


                <div className="dashboard-info-item">

                  <div className="dashboard-info-icon">
                    ?
                  </div>

                  <div>
                    <span>Questions</span>
                    <strong>90 Questions</strong>
                  </div>

                </div>


                <div className="dashboard-info-item">

                  <div className="dashboard-info-icon">
                    %
                  </div>

                  <div>
                    <span>Attempts</span>
                    <strong>Unlimited</strong>
                  </div>

                </div>

              </div>


              {/* FOOTER */}

              <div className="dashboard-exam-footer">

                <span className="dashboard-subjects-list">
                  Physics • Chemistry • Maths
                </span>

                <button
                  className="dashboard-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openExam(exam);
                  }}
                >
                  View Details
                  <ArrowRight size={12} />
                </button>

              </div>

            </div>

          </article>

        ))}


        {filteredExams.length === 0 && (

          <div className="dashboard-no-exams">
            No exams found.
          </div>

        )}

      </div>

    </div>
  );
}