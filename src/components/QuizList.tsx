'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuizzes, selectQuizzes, selectQuizzesLoading, selectQuizzesError } from '../store/slices/quizSlice';
import { AppDispatch } from '../store/store';
import QuizCard from './QuizCard';
import { Loader2, AlertCircle } from 'lucide-react';

export default function QuizList() {
  const dispatch = useDispatch<AppDispatch>();
  const quizzes = useSelector(selectQuizzes);
  const isLoading = useSelector(selectQuizzesLoading);
  const error = useSelector(selectQuizzesError);

  useEffect(() => {
    dispatch(fetchQuizzes());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Loading quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-10">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-red-800 mb-2">Oops! Something went wrong</h3>
        <p className="text-red-600 mb-4">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </p>
        <button 
          onClick={() => dispatch(fetchQuizzes())}
          className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center my-10 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Quizzes Found</h3>
        <p className="text-gray-500">There are currently no quizzes available to take.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz, index) => (
        <QuizCard key={quiz.id || index} quiz={quiz} />
      ))}
    </div>
  );
}
