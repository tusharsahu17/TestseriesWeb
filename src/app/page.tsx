import QuizList from '../components/QuizList';
import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header section */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuizMaster</span>
            </div>
            <div>
              <Link href="/auth?tab=login" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 inline-block">
                Login
              </Link>
              <Link href="/auth?tab=signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="bg-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
              Test your knowledge
            </h1>
            <p className="text-lg text-indigo-200">
              Explore our wide variety of quizzes, challenge yourself, and learn something new every day.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Quizzes</h2>
            <p className="text-gray-500 mt-1">Select a quiz below to get started</p>
          </div>
        </div>
        
        {/* Quiz List Component */}
        <QuizList />
      </div>
    </main>
  );
}
