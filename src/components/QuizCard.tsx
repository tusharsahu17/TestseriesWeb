import { BookOpen, Clock, Award } from 'lucide-react';

interface QuizCardProps {
  quiz: any;
}

export default function QuizCard({ quiz }: QuizCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">{quiz.title || 'Untitled Quiz'}</h3>
          <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {quiz.subject || 'General'}
          </span>
        </div>
        <p className="text-gray-600 mb-6 line-clamp-2">
          {quiz.description || 'Test your knowledge with this quiz.'}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{quiz.questions?.length || 10} Questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{quiz.duration || 30} mins</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center mt-auto">
        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
          <Award className="w-4 h-4 text-amber-500" />
          <span>{quiz.points || 100} Points</span>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Start Quiz
        </button>
      </div>
    </div>
  );
}
