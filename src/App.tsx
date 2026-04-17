import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Trophy, RotateCcw, Star, Flame, TrendingUp, MapPin, ChevronLeft, ChevronDown } from 'lucide-react';
import { QuestionView } from './components/QuestionView';
import { FireOverlay } from './components/FireOverlay';
import { shuffleQuestions, getRandomQuestion } from './data/questions';
import { Question, HighScore, EndlessHighScore, Difficulty } from './types';

type GameState = 'start' | 'difficulty' | 'playing' | 'finished';
type GameMode = 'classic' | 'endless';

const HIGH_SCORES_KEY = 'countryGameHighScores';
const ENDLESS_SCORES_KEY = 'countryGameEndlessScores';
const ALL_TIME_BEST_STREAK_KEY = 'countryGameBestStreak';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [endlessHighScores, setEndlessHighScores] = useState<EndlessHighScore[]>([]);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [pendingMode, setPendingMode] = useState<GameMode>('classic');
  const [showFireOverlay, setShowFireOverlay] = useState(false);
  const [allTimeBestStreak, setAllTimeBestStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem(ALL_TIME_BEST_STREAK_KEY) ?? '0', 10);
  });
  const [fireShownForCurrentRecord, setFireShownForCurrentRecord] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [showOtherGames, setShowOtherGames] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(HIGH_SCORES_KEY);
    if (saved) setHighScores(JSON.parse(saved));
    const savedEndless = localStorage.getItem(ENDLESS_SCORES_KEY);
    if (savedEndless) setEndlessHighScores(JSON.parse(savedEndless));
  }, []);

  const saveHighScore = useCallback((newScore: number, total: number) => {
    const percentage = Math.round((newScore / total) * 100);
    const newHighScore: HighScore = {
      score: newScore,
      totalQuestions: total,
      percentage,
      date: new Date().toLocaleDateString()
    };
    
    const updated = [...highScores, newHighScore]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
    
    setHighScores(updated);
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(updated));
  }, [highScores]);

  const selectMode = (mode: GameMode) => {
    setPendingMode(mode);
    setGameState('difficulty');
  };

  const startGame = (chosenDifficulty: Difficulty) => {
    const mode = pendingMode;
    setGameMode(mode);
    setDifficulty(chosenDifficulty);
    setQuestions(mode === 'endless' ? [getRandomQuestion(undefined, chosenDifficulty)] : shuffleQuestions(10, chosenDifficulty));
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setIsAnswerRevealed(false);
    setFireShownForCurrentRecord(false);
    setLastAnswerCorrect(false);
    setGameState('playing');
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      if (newStreak > allTimeBestStreak) {
        if (allTimeBestStreak > 0 && !fireShownForCurrentRecord) {
          setShowFireOverlay(true);
          setFireShownForCurrentRecord(true);
        }
        setAllTimeBestStreak(newStreak);
        localStorage.setItem(ALL_TIME_BEST_STREAK_KEY, String(newStreak));
      }
      setScore(s => s + 1);
      setLastAnswerCorrect(true);
    } else {
      setStreak(0);
      setLastAnswerCorrect(false);
    }
    setIsAnswerRevealed(true);
  };

  const saveEndlessHighScore = useCallback((finalStreak: number) => {
    const entry: EndlessHighScore = { streak: finalStreak, date: new Date().toLocaleDateString() };
    const updated = [...endlessHighScores, entry]
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5);
    setEndlessHighScores(updated);
    localStorage.setItem(ENDLESS_SCORES_KEY, JSON.stringify(updated));
  }, [endlessHighScores]);

  const handleNext = () => {
    setShowFireOverlay(false);
    if (gameMode === 'endless') {
      const current = questions[currentQuestionIndex];
      if (!lastAnswerCorrect) {
        saveEndlessHighScore(bestStreak);
        setGameState('finished');
        return;
      }
      const next = getRandomQuestion(current.id, difficulty);
      setQuestions(q => [...q, next]);
      setCurrentQuestionIndex(i => i + 1);
      setIsAnswerRevealed(false);
    } else {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setIsAnswerRevealed(false);
      } else {
        const fs = score + (lastAnswerCorrect ? 1 : 0);
        setFinalScore(fs);
        saveHighScore(fs, questions.length);
        setGameState('finished');
      }
    }
  };

  const clearHighScores = () => {
    setHighScores([]);
    setEndlessHighScores([]);
    localStorage.removeItem(HIGH_SCORES_KEY);
    localStorage.removeItem(ENDLESS_SCORES_KEY);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <FireOverlay active={showFireOverlay} onComplete={() => setShowFireOverlay(false)} />
      {/* Other Games dropdown — fixed top-right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowOtherGames(v => !v)}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg"
        >
          <Globe className="w-4 h-4" />
          Other Games
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showOtherGames ? 'rotate-180' : ''}`} />
        </button>
        {showOtherGames && (
          <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
            <button
              onClick={() => { setShowOtherGames(false); navigate('/sport'); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="12,8 14.4,9.8 13.5,12.6 10.5,12.6 9.6,9.8" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
                <line x1="12" y1="8" x2="12" y2="2.1" />
                <line x1="14.4" y1="9.8" x2="19.5" y2="7" />
                <line x1="13.5" y1="12.6" x2="17.5" y2="16.5" />
                <line x1="10.5" y1="12.6" x2="6.5" y2="16.5" />
                <line x1="9.6" y1="9.8" x2="4.5" y2="7" />
              </svg>
              Sport
            </button>
          </div>
        )}
      </div>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <header className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
          <Globe className="w-10 h-10 text-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            The Country Game
          </h1>
        </header>

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="card p-8 text-center animate-bounce-in">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 mb-4">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Test Your Knowledge</h2>
              <p className="text-slate-400">
                Answer 10 questions about countries, capitals, and geography!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => selectMode('classic')} className="btn-primary text-lg flex items-center justify-center gap-2">
                <Star className="w-5 h-5" />
                Classic (10 Qs)
              </button>
              <button onClick={() => selectMode('endless')} className="text-lg flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Flame className="w-5 h-5" />
                Endless Mode
              </button>
            </div>

            {(highScores.length > 0 || endlessHighScores.length > 0) && (
              <div className="mt-8 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    High Scores
                  </h3>
                  <button onClick={clearHighScores} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Classic Scores */}
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4" /> Classic
                    </h4>
                    {highScores.length === 0 ? (
                      <p className="text-slate-500 text-xs">No scores yet</p>
                    ) : (
                      <div className="space-y-2">
                        {highScores.map((hs, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  i === 1 ? 'bg-slate-400/20 text-slate-300' :
                                  i === 2 ? 'bg-amber-600/20 text-amber-500' :
                                  'bg-slate-600/20 text-slate-400'}`}>{i + 1}</span>
                              <span className="text-slate-400 text-xs">{hs.date}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-sm">{hs.score}/{hs.totalQuestions}</span>
                              <span className={`ml-1 text-xs ${hs.percentage >= 70 ? 'text-emerald-400' : hs.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>({hs.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Endless Scores */}
                  <div>
                    <h4 className="text-sm font-semibold text-orange-400 flex items-center gap-1 mb-2">
                      <Flame className="w-4 h-4" /> Endless
                    </h4>
                    {endlessHighScores.length === 0 ? (
                      <p className="text-slate-500 text-xs">No scores yet</p>
                    ) : (
                      <div className="space-y-2">
                        {endlessHighScores.map((hs, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  i === 1 ? 'bg-slate-400/20 text-slate-300' :
                                  i === 2 ? 'bg-amber-600/20 text-amber-500' :
                                  'bg-slate-600/20 text-slate-400'}`}>{i + 1}</span>
                              <span className="text-slate-400 text-xs">{hs.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-400" />
                              <span className="font-semibold text-sm text-orange-400">{hs.streak}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Difficulty Selector */}
        {gameState === 'difficulty' && (
          <div className="card p-8 text-center animate-bounce-in">
            <button
              onClick={() => setGameState('start')}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg mb-6 text-sm mx-auto"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <h2 className="text-2xl font-semibold mb-2">
              {pendingMode === 'classic' ? 'Classic Mode' : 'Endless Mode'}
            </h2>
            <p className="text-slate-400 mb-6">Choose your difficulty</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => startGame('easy')} className="flex flex-col items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">🌍</span>
                <span className="text-lg">Easy</span>
                <span className="text-xs text-emerald-200">Well-known countries</span>
              </button>
              <button onClick={() => startGame('medium')} className="flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">🗺️</span>
                <span className="text-lg">Medium</span>
                <span className="text-xs text-blue-200">Trickier geography</span>
              </button>
              <button onClick={() => startGame('hard')} className="flex flex-col items-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">🔥</span>
                <span className="text-lg">Hard</span>
                <span className="text-xs text-orange-200">Obscure capitals & facts</span>
              </button>
              <button onClick={() => startGame('god')} className="flex flex-col items-center gap-2 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">⚡</span>
                <span className="text-lg">God</span>
                <span className="text-xs text-purple-200">Expert level only</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Screen */}
        {gameState === 'playing' && questions.length > 0 && (
          <>
            {/* Back Button */}
            <button
              onClick={() => setGameState('start')}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg mb-4 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Home
            </button>

            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-6 animate-slide-up">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">{score}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-400">{currentQuestionIndex + (isAnswerRevealed ? 1 : 0)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Flame className={`w-5 h-5 ${streak > 2 ? 'text-orange-400 animate-pulse' : 'text-orange-400'}`} />
                  <span className="font-semibold">{streak}</span>
                  {bestStreak > 0 && (
                    <span className="text-slate-500 text-sm">(Best: {bestStreak})</span>
                  )}
                  <div className="flex items-center gap-1 ml-1">
                    <Flame className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-400 font-semibold">{allTimeBestStreak}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-400">
                {gameMode === 'endless' ? (
                  <span className="text-orange-400 font-semibold flex items-center gap-1">
                    <Flame className="w-4 h-4" /> Endless
                  </span>
                ) : (
                  `${currentQuestionIndex + 1} / ${questions.length}`
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <QuestionView
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              onNext={handleNext}
              isAnswerRevealed={isAnswerRevealed}
              questionNumber={currentQuestionIndex + 1}
            />
          </>
        )}

        {/* Results Screen */}
        {gameState === 'finished' && gameMode === 'classic' && (
          <div className="card p-8 text-center animate-bounce-in">
            <div className="mb-6">
              <div className={`
                inline-flex items-center justify-center w-24 h-24 rounded-full mb-4
                ${finalScore >= 8 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  finalScore >= 5 ? 'bg-gradient-to-br from-blue-400 to-emerald-500' :
                  'bg-gradient-to-br from-red-400 to-red-600'}
              `}>
                {finalScore >= 8 ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : finalScore >= 5 ? (
                  <TrendingUp className="w-12 h-12 text-white" />
                ) : (
                  <RotateCcw className="w-12 h-12 text-white" />
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {finalScore >= 8 ? 'Excellent!' : finalScore >= 5 ? 'Good Job!' : 'Keep Practicing!'}
              </h2>
              <p className="text-slate-400 mb-4">You scored {finalScore} out of {questions.length}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/50">
                <span className="text-slate-400">Accuracy:</span>
                <span className={`font-bold text-lg ${finalScore >= 8 ? 'text-emerald-400' : finalScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round((finalScore / questions.length) * 100)}%
                </span>
              </div>
              {bestStreak > 2 && (
                <div className="mt-3 text-sm text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4" /> Best Streak: {bestStreak}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => { setPendingMode('classic'); startGame(difficulty); }} className="btn-primary flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
              <button onClick={() => setGameState('start')} className="text-slate-400 hover:text-white transition-colors py-3 px-6">
                Main Menu
              </button>
            </div>
          </div>
        )}

        {/* Endless Results Screen */}
        {gameState === 'finished' && gameMode === 'endless' && (
          <div className="card p-8 text-center animate-bounce-in">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-orange-500 to-red-600">
                <Flame className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-1">Streak Over!</h2>
              <p className="text-slate-400 mb-4">You got it wrong — better luck next time!</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-orange-500/20 border border-orange-500/30 mb-3">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-slate-300">Streak:</span>
                <span className="font-bold text-3xl text-orange-400">{streak > 0 ? streak : bestStreak}</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Flame className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400 text-sm">All-time best:</span>
                <span className="text-purple-400 font-semibold">{allTimeBestStreak}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => { setPendingMode('endless'); startGame(difficulty); }} className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Try Again
              </button>
              <button onClick={() => setGameState('start')} className="text-slate-400 hover:text-white transition-colors py-3 px-6">
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
