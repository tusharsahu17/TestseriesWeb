'use client';
import { useEffect, useState } from 'react';
import { getData } from '../../../../../services/apiClient';
import { ENDPOINTS } from '../../../../../constants/apiEndpoints';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import './examDetails.css';

export default function SubjectsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const [subjects, setSubjects] = useState<any[]>([]);
  const [examType, setExamType] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subjects for this exam
        const subjectsData = await getData(`${ENDPOINTS.EXAMS}/${examId}/subjects`);
        setSubjects(subjectsData);

        // Fetch exam details
        const exam = await getData(`${ENDPOINTS.EXAMS}/${examId}`);
        if (exam) {
          setExamType(exam);
        }
      } catch (err: any) {
        const errData = err.response?.data;
        setError(typeof errData === 'string' ? errData : errData?.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    if (examId) fetchData();
  }, [examId]);

  const [isStarting, setIsStarting] = useState(false);

  const handleStartTest = (subjectId: string) => {
    router.push(`/dashboard/exams/${examId}/subjects/${subjectId}`);
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

  const examName = examType?.name || 'Exam';
  const examDesc = examType?.description || 'Examination designed to evaluate your understanding of various subjects.';

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      {/* BACK */}
      <Link href="/dashboard/exams" className="dashboard-exam-back">
        ← Back to Exams
      </Link>

      {/* HERO */}
      <section className="dashboard-exam-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-tag">Competitive Examination</span>
          <h1>{examName}</h1>
          <p>{examDesc}</p>
        </div>
        <button 
          className="dashboard-start-btn" 
          disabled={isStarting}
          onClick={() => {
            if (subjects.length > 0) {
              const firstSubjectId = subjects[0].id || subjects[0]._id;
              handleStartTest(firstSubjectId);
            } else {
              alert('No subjects available for this exam yet.');
            }
          }}
        >
          {isStarting ? 'Loading...' : 'Start Exam →'}
        </button>
      </section>

      {/* STATS */}
      <div className="dashboard-hero-stats">
        <div className="dashboard-hero-stat">
          <span>Subjects</span>
          <strong>{subjects.length}</strong>
        </div>
        <div className="dashboard-hero-stat">
          <span>Questions</span>
          <strong>90</strong>
        </div>
        <div className="dashboard-hero-stat">
          <span>Duration</span>
          <strong>180 Min</strong>
        </div>
        <div className="dashboard-hero-stat">
          <span>Attempts</span>
          <strong>3</strong>
        </div>
        <div className="dashboard-hero-stat">
          <span>Difficulty</span>
          <strong>Advanced</strong>
        </div>
      </div>

      {/* MAIN */}
      <div className="dashboard-exam-grid-layout">
        
        {/* LEFT */}
        <div>
          {/* ABOUT */}
          <div className="dashboard-exam-detail-card">
            <h2>About this Exam</h2>
            <p className="dashboard-exam-about">
              {examName} is a comprehensive examination for students aspiring to excel in their respective fields.
              <br /><br />
              The examination includes questions from various critical subjects.
            </p>
          </div>

          {/* SUBJECTS */}
          <div className="dashboard-exam-detail-card">
            <h2>Subjects & Tests</h2>
            
            <div className="dashboard-subject-list">
              {subjects.map((subject, index) => {
                const icons = ['∑', '⚛', '🧪', '📚', '💡', '⚕'];
                const icon = icons[index % icons.length];
                
                return (
                  <div 
                    key={subject.id || subject._id}
                    className="dashboard-subject-item" 
                    onClick={() => handleStartTest(subject.id || subject._id)}
                  >
                    <div className="dashboard-subject-icon">{icon}</div>
                    <div className="dashboard-subject-info">
                      <strong>{subject.name || 'Subject'}</strong>
                      <span>{Math.floor(Math.random() * 200 + 100)} Questions • {Math.floor(Math.random() * 10 + 5)} Tests</span>
                    </div>
                    <span className="dashboard-test-count">View →</span>
                  </div>
                );
              })}
              
              {subjects.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No subjects available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* REQUIREMENTS */}
          <div className="dashboard-exam-detail-card">
            <h2>Before You Start</h2>
            <div className="dashboard-requirements">
              <div className="dashboard-requirement">
                <span className="dashboard-check">✓</span> Stable internet connection
              </div>
              <div className="dashboard-requirement">
                <span className="dashboard-check">✓</span> Complete the test within the given time
              </div>
              <div className="dashboard-requirement">
                <span className="dashboard-check">✓</span> Do not refresh the browser during test
              </div>
              <div className="dashboard-requirement">
                <span className="dashboard-check">✓</span> Each question can have one answer
              </div>
            </div>
          </div>

          {/* PERFORMANCE */}
          <div className="dashboard-exam-detail-card">
            <h2>Your Performance</h2>
            <div className="dashboard-hero-stat" style={{ border: 'none', padding: '0 0 15px 0' }}>
              <span>Your Average Score</span>
              <strong>78%</strong>
            </div>
            <div className="dashboard-hero-stat" style={{ border: 'none', padding: 0 }}>
              <span>Tests Completed</span>
              <strong>8 / 12</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
