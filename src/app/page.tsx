import Link from 'next/link';
import { ArrowRight, BrainCircuit, Target, Zap, LayoutDashboard, Award } from 'lucide-react';
import './landing.css';

export default function Home() {
  return (
    <main className="landing-container">
      {/* NAVBAR */}
      <nav className="landing-nav">
        <Link href="/" className="landing-logo">
          <div className="landing-logo-icon">
            <BrainCircuit size={20} />
          </div>
          QuizMaster
        </Link>
        
        <div className="landing-nav-actions">
          <Link href="/auth?tab=login" className="landing-login-btn">
            Login
          </Link>
          <Link href="/auth?tab=signup" className="landing-signup-btn">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-glow-1"></div>
        <div className="landing-glow-2"></div>
        
        <div className="landing-badge">
          <span></span> New Exams Dashboard Live
        </div>
        
        <h1>
          Master your subjects with <span>Interactive Exams</span>
        </h1>
        
        <p>
          Challenge yourself with our curated test series. Track your performance, discover your weak points, and improve your knowledge every single day.
        </p>
        
        <div className="landing-cta-group">
          <Link href="/auth?tab=signup" className="landing-btn-primary">
            Start Learning Free <ArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className="landing-btn-secondary">
            View Dashboard
          </Link>
        </div>
        
        {/* DASHBOARD PREVIEW GLASSMORPHISM */}
        <div className="landing-preview-wrapper">
          <div className="landing-preview">
            <div className="landing-preview-header">
              <div className="landing-dot red"></div>
              <div className="landing-dot yellow"></div>
              <div className="landing-dot green"></div>
            </div>
            <div className="landing-preview-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="landing-preview-card">
                  <div className="landing-preview-card-icon">
                    {i === 1 ? '📐' : i === 2 ? '⚡' : '🔬'}
                  </div>
                  <div className="landing-preview-card-title"></div>
                  <div className="landing-preview-card-line"></div>
                  <div className="landing-preview-card-line" style={{ width: '50%' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="landing-features">
        <h2 className="landing-section-title">Everything you need to succeed</h2>
        
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Target size={24} />
            </div>
            <h3>Targeted Practice</h3>
            <p>Focus on specific subjects and topics with our extensive library of competitive and university exams.</p>
          </div>
          
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Zap size={24} />
            </div>
            <h3>Instant Feedback</h3>
            <p>Get immediate results and detailed explanations for every question to learn from your mistakes instantly.</p>
          </div>
          
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <LayoutDashboard size={24} />
            </div>
            <h3>Beautiful Dashboard</h3>
            <p>Track your progress, view attempt history, and manage your learning journey through a stunning interface.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
