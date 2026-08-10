'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h1>Good evening, Tushar 👋</h1>
          <p>Ready to challenge yourself today?</p>
        </div>
        <button className="dashboard-date-btn">
          ◷ &nbsp; August 9, 2026
        </button>
      </div>

      {/* STATISTICS */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-purple">◈</div>
            <span className="dashboard-trend">+12.5%</span>
          </div>
          <h2>24</h2>
          <p>Tests Completed</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-blue">◒</div>
            <span className="dashboard-trend">+8.2%</span>
          </div>
          <h2>78%</h2>
          <p>Average Score</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-green">◉</div>
            <span className="dashboard-trend">+4.1%</span>
          </div>
          <h2>18.5h</h2>
          <p>Study Time</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-orange">♛</div>
            <span className="dashboard-trend">↑ 5</span>
          </div>
          <h2>#24</h2>
          <p>Current Rank</p>
        </div>
      </div>

      {/* ROW 1 */}
      <div className="dashboard-grid-layout">
        
        {/* Continue Learning */}
        <div className="dashboard-card dashboard-learning-card">
          <div className="dashboard-card-header">
            <h3>Continue Learning</h3>
            <Link href="#" className="dashboard-view-all">View All</Link>
          </div>
          
          <div className="dashboard-learning-content">
            <div>
              <div className="dashboard-learning-label">Mathematics</div>
              <h2>Quantitative Aptitude</h2>
              <p>12 questions remaining • 18 min</p>
              <button className="dashboard-continue-btn" onClick={() => alert('Opening Quantitative Aptitude test...')}>
                Continue Test →
              </button>
            </div>
            <div className="dashboard-quiz-illustration">📚</div>
          </div>
        </div>

        {/* Subject Progress */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Subject Progress</h3>
            <Link href="#" className="dashboard-view-all">Details</Link>
          </div>

          <div className="dashboard-subject">
            <div className="dashboard-subject-top">
              <span className="dashboard-subject-name">Mathematics</span>
              <span className="dashboard-subject-score">86%</span>
            </div>
            <div className="dashboard-bar">
              <div className="dashboard-bar-fill" style={{ width: '86%' }}></div>
            </div>
          </div>

          <div className="dashboard-subject">
            <div className="dashboard-subject-top">
              <span className="dashboard-subject-name">Physics</span>
              <span className="dashboard-subject-score">72%</span>
            </div>
            <div className="dashboard-bar">
              <div className="dashboard-bar-fill dashboard-bar-blue" style={{ width: '72%' }}></div>
            </div>
          </div>

          <div className="dashboard-subject">
            <div className="dashboard-subject-top">
              <span className="dashboard-subject-name">Chemistry</span>
              <span className="dashboard-subject-score">81%</span>
            </div>
            <div className="dashboard-bar">
              <div className="dashboard-bar-fill dashboard-bar-green" style={{ width: '81%' }}></div>
            </div>
          </div>

          <div className="dashboard-subject">
            <div className="dashboard-subject-top">
              <span className="dashboard-subject-name">English</span>
              <span className="dashboard-subject-score">64%</span>
            </div>
            <div className="dashboard-bar">
              <div className="dashboard-bar-fill dashboard-bar-orange" style={{ width: '64%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="dashboard-grid-layout">
        
        {/* Upcoming Exams */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Upcoming Tests</h3>
            <Link href="#" className="dashboard-view-all">View All</Link>
          </div>

          <div className="dashboard-exam-list">
            <div className="dashboard-exam">
              <div className="dashboard-exam-icon dashboard-purple">🧮</div>
              <div className="dashboard-exam-info">
                <strong>Mathematics Mock Test</strong>
                <span>30 Questions • 45 Minutes • Tomorrow</span>
              </div>
              <button className="dashboard-exam-btn" onClick={() => router.push('/dashboard/exams')}>Start</button>
            </div>

            <div className="dashboard-exam">
              <div className="dashboard-exam-icon dashboard-blue">⚛️</div>
              <div className="dashboard-exam-info">
                <strong>Physics Practice Test</strong>
                <span>25 Questions • 30 Minutes • Aug 12</span>
              </div>
              <button className="dashboard-exam-btn" onClick={() => router.push('/dashboard/exams')}>Start</button>
            </div>

            <div className="dashboard-exam">
              <div className="dashboard-exam-icon dashboard-orange">📖</div>
              <div className="dashboard-exam-info">
                <strong>English Grammar Test</strong>
                <span>20 Questions • 20 Minutes • Aug 15</span>
              </div>
              <button className="dashboard-exam-btn" onClick={() => router.push('/dashboard/exams')}>Start</button>
            </div>

            <div className="dashboard-exam">
              <div className="dashboard-exam-icon dashboard-green">🧪</div>
              <div className="dashboard-exam-info">
                <strong>Chemistry Full Test</strong>
                <span>50 Questions • 60 Minutes • Aug 18</span>
              </div>
              <button className="dashboard-exam-btn" onClick={() => router.push('/dashboard/exams')}>Start</button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Top Students</h3>
            <Link href="#" className="dashboard-view-all">Full Ranking</Link>
          </div>

          <div className="dashboard-leaderboard">
            <div className="dashboard-student">
              <div className="dashboard-rank">01</div>
              <div className="dashboard-student-avatar">AK</div>
              <div className="dashboard-student-info">
                <strong>Ananya Kapoor</strong>
                <span>96% Average</span>
              </div>
              <div className="dashboard-points">9,840</div>
            </div>

            <div className="dashboard-student">
              <div className="dashboard-rank">02</div>
              <div className="dashboard-student-avatar">RV</div>
              <div className="dashboard-student-info">
                <strong>Rohan Verma</strong>
                <span>94% Average</span>
              </div>
              <div className="dashboard-points">9,520</div>
            </div>

            <div className="dashboard-student">
              <div className="dashboard-rank">03</div>
              <div className="dashboard-student-avatar">PS</div>
              <div className="dashboard-student-info">
                <strong>Priya Singh</strong>
                <span>92% Average</span>
              </div>
              <div className="dashboard-points">9,210</div>
            </div>

            <div className="dashboard-student dashboard-current">
              <div className="dashboard-rank">24</div>
              <div className="dashboard-student-avatar">TS</div>
              <div className="dashboard-student-info">
                <strong>Tushar Sharma</strong>
                <span>78% Average</span>
              </div>
              <div className="dashboard-points">7,480</div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TESTS */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3>Recent Tests</h3>
          <Link href="#" className="dashboard-view-all">View All</Link>
        </div>

        <div className="dashboard-recent-wrapper" style={{ overflowX: 'auto' }}>
          <table className="dashboard-recent-table">
            <thead>
              <tr>
                <th>TEST</th>
                <th>SUBJECT</th>
                <th>DATE</th>
                <th>SCORE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="dashboard-test-name">Mathematics - Algebra</td>
                <td>Mathematics</td>
                <td className="dashboard-test-date">Aug 08, 2026</td>
                <td><span className="dashboard-score-badge dashboard-high-score">92%</span></td>
                <td>Completed</td>
              </tr>
              <tr>
                <td className="dashboard-test-name">Physics - Mechanics</td>
                <td>Physics</td>
                <td className="dashboard-test-date">Aug 06, 2026</td>
                <td><span className="dashboard-score-badge dashboard-high-score">84%</span></td>
                <td>Completed</td>
              </tr>
              <tr>
                <td className="dashboard-test-name">Chemistry - Organic</td>
                <td>Chemistry</td>
                <td className="dashboard-test-date">Aug 04, 2026</td>
                <td><span className="dashboard-score-badge dashboard-medium-score">68%</span></td>
                <td>Completed</td>
              </tr>
              <tr>
                <td className="dashboard-test-name">English - Grammar</td>
                <td>English</td>
                <td className="dashboard-test-date">Aug 02, 2026</td>
                <td><span className="dashboard-score-badge dashboard-high-score">88%</span></td>
                <td>Completed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
