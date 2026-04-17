import { useState, useMemo } from 'react';
import { MapPin, Lightbulb, ArrowRight, Check, X } from 'lucide-react';
import { Question } from '../types';

interface QuestionViewProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
  isAnswerRevealed: boolean;
  questionNumber: number;
}

export function QuestionView({
  question,
  onAnswer,
  onNext,
  isAnswerRevealed,
  questionNumber
}: QuestionViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const shuffledOptions = useMemo(() => {
    const arr = [...question.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [question.id]);

  const handleSelect = (answer: string) => {
    if (isAnswerRevealed || hasAnswered) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    const isCorrect = answer === question.correctAnswer;
    onAnswer(isCorrect);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    onNext();
  };

  const getOptionStyle = (option: string) => {
    if (!isAnswerRevealed && !hasAnswered) return '';
    
    if (option === question.correctAnswer) {
      return 'correct';
    }
    
    if (option === selectedAnswer && option !== question.correctAnswer) {
      return 'incorrect';
    }
    
    return 'opacity-50';
  };

  const getOptionIcon = (option: string) => {
    if (!isAnswerRevealed && !hasAnswered) return null;
    
    if (option === question.correctAnswer) {
      return <Check className="w-5 h-5 text-white" />;
    }
    
    if (option === selectedAnswer && option !== question.correctAnswer) {
      return <X className="w-5 h-5 text-white" />;
    }
    
    return null;
  };

  return (
    <div className="card p-6 sm:p-8 animate-slide-up">
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          {question.type === 'capital' ? (
            <MapPin className="w-6 h-6 text-white" />
          ) : (
            <Lightbulb className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <span className="text-sm text-slate-400 uppercase tracking-wide font-medium">
            Question {questionNumber}
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold mt-1 leading-tight">
            {question.question}
          </h3>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {shuffledOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            disabled={isAnswerRevealed || hasAnswered}
            className={`
              btn-option flex items-center justify-between
              ${getOptionStyle(option)}
            `}
          >
            <span className="text-base sm:text-lg">{option}</span>
            {getOptionIcon(option)}
          </button>
        ))}
      </div>

      {/* Feedback & Next */}
      {isAnswerRevealed && (
        <div className="animate-fade-in">
          <div className={`
            p-4 rounded-xl mb-4 text-center font-medium
            ${selectedAnswer === question.correctAnswer 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'}
          `}>
            {selectedAnswer === question.correctAnswer ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Correct! Well done!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <X className="w-5 h-5" />
                Incorrect. The answer was {question.correctAnswer}
              </span>
            )}
          </div>

          <button
            onClick={handleNext}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Next Question
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
