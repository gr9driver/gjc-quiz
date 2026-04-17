import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Trophy, ChevronDown, Dumbbell, Star, Flame, RotateCcw, TrendingUp, ChevronLeft, ChevronRight, Check, X, ArrowRight, Medal, Send, List } from 'lucide-react';
import { shuffleSportQuestions, getRandomSportQuestion } from '../data/sport-questions';
import { SportQuestion, Difficulty, HighScore, EndlessHighScore } from '../types';
import { submitScore, fetchLeaderboard, calcWeightedScore, LeaderboardEntry } from '../lib/supabase';

type GameState = 'start' | 'difficulty' | 'playing' | 'finished' | 'leaderboard';
type GameMode = 'classic' | 'endless';

const SPORT_HIGH_SCORES_KEY = 'sportGameHighScores';
const SPORT_ENDLESS_SCORES_KEY = 'sportGameEndlessScores';

function QuestionCard({ question, onAnswer, onNext, isAnswerRevealed, questionNumber }: {
  question: SportQuestion;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  isAnswerRevealed: boolean;
  questionNumber: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const shuffled = useMemo(() => {
    const arr = [...question.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [question.id]);

  const handleSelect = (opt: string) => {
    if (isAnswerRevealed || answered) return;
    setSelected(opt);
    setAnswered(true);
    onAnswer(opt === question.correctAnswer);
  };

  const handleNext = () => { setSelected(null); setAnswered(false); onNext(); };

  const getStyle = (opt: string) => {
    if (!isAnswerRevealed && !answered) return '';
    if (opt === question.correctAnswer) return 'correct';
    if (opt === selected && opt !== question.correctAnswer) return 'incorrect';
    return 'opacity-50';
  };

  return (
    <div className="card p-6 sm:p-8 animate-slide-up">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <span className="text-sm text-slate-400 uppercase tracking-wide font-medium">Question {questionNumber}</span>
          <h3 className="text-xl sm:text-2xl font-semibold mt-1 leading-tight">{question.question}</h3>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        {shuffled.map((opt, i) => (
          <button key={i} onClick={() => handleSelect(opt)} disabled={isAnswerRevealed || answered}
            className={`btn-option flex items-center justify-between ${getStyle(opt)}`}>
            <span className="text-base sm:text-lg">{opt}</span>
            {(isAnswerRevealed || answered) && opt === question.correctAnswer && <Check className="w-5 h-5 text-white" />}
            {(isAnswerRevealed || answered) && opt === selected && opt !== question.correctAnswer && <X className="w-5 h-5 text-white" />}
          </button>
        ))}
      </div>
      {isAnswerRevealed && (
        <div className="animate-fade-in">
          <div className={`p-4 rounded-xl mb-4 text-center font-medium ${selected === question.correctAnswer ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {selected === question.correctAnswer
              ? <span className="flex items-center justify-center gap-2"><Check className="w-5 h-5" />Correct! Well done!</span>
              : <span className="flex items-center justify-center gap-2"><X className="w-5 h-5" />Incorrect. The answer was {question.correctAnswer}</span>}
          </div>
          <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
            Next Question <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function SportHome() {
  const navigate = useNavigate();
  const [showOtherGames, setShowOtherGames] = useState(false);
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [pendingMode, setPendingMode] = useState<GameMode>('classic');
  const [questions, setQuestions] = useState<SportQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [onFire, setOnFire] = useState(false);
  const [beatBest, setBeatBest] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [endlessHighScores, setEndlessHighScores] = useState<EndlessHighScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardMode, setLeaderboardMode] = useState<GameMode>('classic');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [homeLeaderboard, setHomeLeaderboard] = useState<{ classic: LeaderboardEntry[], endless: LeaderboardEntry[] }>({ classic: [], endless: [] });
  const [homeLeaderboardMode, setHomeLeaderboardMode] = useState<GameMode>('classic');
  const [homeLeaderboardLoading, setHomeLeaderboardLoading] = useState(true);
  const [homePage, setHomePage] = useState(0);

  useEffect(() => {
    const s = localStorage.getItem(SPORT_HIGH_SCORES_KEY);
    if (s) setHighScores(JSON.parse(s));
    const e = localStorage.getItem(SPORT_ENDLESS_SCORES_KEY);
    if (e) setEndlessHighScores(JSON.parse(e));
    (async () => {
      const [classic, endless] = await Promise.all([
        fetchLeaderboard('sport', 'classic', 10),
        fetchLeaderboard('sport', 'endless', 10),
      ]);
      setHomeLeaderboard({ classic, endless });
      setHomeLeaderboardLoading(false);
    })();
  }, []);

  const saveHighScore = useCallback((newScore: number, total: number) => {
    const pct = Math.round((newScore / total) * 100);
    const entry: HighScore = { score: newScore, totalQuestions: total, percentage: pct, date: new Date().toLocaleDateString(), difficulty };
    const updated = [...highScores, entry].sort((a, b) => b.percentage - a.percentage).slice(0, 3);
    setHighScores(updated);
    localStorage.setItem(SPORT_HIGH_SCORES_KEY, JSON.stringify(updated));
  }, [highScores, difficulty]);

  const saveEndlessHighScore = useCallback((s: number) => {
    const entry: EndlessHighScore = { streak: s, date: new Date().toLocaleDateString(), difficulty };
    const updated = [...endlessHighScores, entry].sort((a, b) => b.streak - a.streak).slice(0, 3);
    setEndlessHighScores(updated);
    localStorage.setItem(SPORT_ENDLESS_SCORES_KEY, JSON.stringify(updated));
  }, [endlessHighScores, difficulty]);

  const selectMode = (mode: GameMode) => { setPendingMode(mode); setGameState('difficulty'); };

  const startGame = (chosenDifficulty: Difficulty) => {
    const mode = pendingMode;
    setGameMode(mode);
    setDifficulty(chosenDifficulty);
    setQuestions(mode === 'endless' ? [getRandomSportQuestion(undefined, chosenDifficulty)] : shuffleSportQuestions(10, chosenDifficulty));
    setCurrentIndex(0);
    setScore(0);
    setFinalScore(0);
    setStreak(0);
    setBestStreak(0);
    setIsAnswerRevealed(false);
    setLastCorrect(false);
    setOnFire(false);
    setBeatBest(false);
    setGameState('playing');
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      const ns = streak + 1;
      setStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
      const newScore = score + 1;
      setScore(newScore);
      setLastCorrect(true);
      if (!beatBest) {
        const savedBest = gameMode === 'endless'
          ? (endlessHighScores.filter(s => s.difficulty === difficulty)[0]?.streak ?? 0)
          : (highScores.filter(s => s.difficulty === difficulty)[0]?.score ?? 0);
        const current = gameMode === 'endless' ? ns : newScore;
        if (savedBest > 0 && current > savedBest) {
          setBeatBest(true);
          setOnFire(true);
          setTimeout(() => setOnFire(false), 1500);
        }
      }
    } else {
      setStreak(0);
      setLastCorrect(false);
    }
    setIsAnswerRevealed(true);
  };

  const handleNext = () => {
    if (gameMode === 'endless') {
      const current = questions[currentIndex];
      if (!lastCorrect) { saveEndlessHighScore(bestStreak); setGameState('finished'); return; }
      const next = getRandomSportQuestion(current.id, difficulty);
      setQuestions(q => [...q, next]);
      setCurrentIndex(i => i + 1);
      setIsAnswerRevealed(false);
    } else {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setIsAnswerRevealed(false);
      } else {
        const fs = score + (lastCorrect ? 1 : 0);
        setFinalScore(fs);
        saveHighScore(fs, questions.length);
        setGameState('finished');
      }
    }
  };

  const clearHighScores = () => {
    setHighScores([]); setEndlessHighScores([]);
    localStorage.removeItem(SPORT_HIGH_SCORES_KEY);
    localStorage.removeItem(SPORT_ENDLESS_SCORES_KEY);
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim()) return;
    setSubmitting(true);
    setSubmitError(false);
    const entry: LeaderboardEntry = gameMode === 'classic'
      ? { name: playerName.trim(), score: finalScore, total: questions.length, percentage: Math.round((finalScore / questions.length) * 100), weighted_score: calcWeightedScore(finalScore, difficulty), mode: 'classic', difficulty, game: 'sport' }
      : { name: playerName.trim(), streak: bestStreak, score: bestStreak, weighted_score: calcWeightedScore(bestStreak, difficulty), mode: 'endless', difficulty, game: 'sport' };
    const ok = await submitScore(entry);
    setSubmitting(false);
    if (ok) setNameSubmitted(true);
    else setSubmitError(true);
  };

  const openLeaderboard = async (mode: GameMode) => {
    setLeaderboardMode(mode);
    setLeaderboardLoading(true);
    setGameState('leaderboard');
    const data = await fetchLeaderboard('sport', mode);
    setLeaderboardData(data);
    setLeaderboardLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="fixed top-4 right-4 z-50">
        <button onClick={() => setShowOtherGames(v => !v)}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg">
          <Globe className="w-4 h-4" />Other Games
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showOtherGames ? 'rotate-180' : ''}`} />
        </button>
        {showOtherGames && (
          <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
            <button onClick={() => { setShowOtherGames(false); navigate('/'); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
              <Globe className="w-4 h-4 text-blue-400" />Country Game
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl">
        <header className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
          <Dumbbell className="w-10 h-10 text-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">The Sport Game</h1>
        </header>

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="card p-8 text-center animate-bounce-in">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 mb-4">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Test Your Sports Knowledge</h2>
              <p className="text-slate-400">Answer 10 questions about sport, athletes and records!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => selectMode('classic')} className="btn-primary text-lg flex items-center justify-center gap-2">
                <Star className="w-5 h-5" />Classic (10 Qs)
              </button>
              <button onClick={() => selectMode('endless')} className="text-lg flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Flame className="w-5 h-5" />Endless Mode
              </button>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" />High Scores</h3>
                  <button onClick={clearHighScores} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Clear All</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1 mb-2"><Star className="w-4 h-4" />Classic</h4>
                    {highScores.length === 0 ? <p className="text-slate-500 text-xs">No scores yet</p> : (
                      <div className="space-y-2">{highScores.map((hs, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-slate-600/20 text-slate-400'}`}>{i + 1}</span>
                            <span className="text-slate-400 text-xs">{hs.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {hs.difficulty && (
                              <span className={`w-4 h-4 rounded-full inline-block flex-shrink-0 ${hs.difficulty === 'easy' ? 'bg-emerald-500' : hs.difficulty === 'medium' ? 'bg-blue-500' : hs.difficulty === 'hard' ? 'bg-orange-500' : 'bg-purple-600'}`} title={hs.difficulty} />
                            )}
                            <div className="text-right">
                              <span className="font-semibold text-sm">{hs.score}/{hs.totalQuestions}</span>
                              <span className={`ml-1 text-xs ${hs.percentage >= 70 ? 'text-emerald-400' : hs.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>({hs.percentage}%)</span>
                            </div>
                          </div>
                        </div>
                      ))}</div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-orange-400 flex items-center gap-1 mb-2"><Flame className="w-4 h-4" />Endless</h4>
                    {endlessHighScores.length === 0 ? <p className="text-slate-500 text-xs">No scores yet</p> : (
                      <div className="space-y-2">{endlessHighScores.map((hs, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-slate-600/20 text-slate-400'}`}>{i + 1}</span>
                            <span className="text-slate-400 text-xs">{hs.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /><span className="font-semibold text-sm text-orange-400">{hs.streak}</span></div>
                              {hs.difficulty && (
                                <span className={`w-4 h-4 rounded-full inline-block ${hs.difficulty === 'easy' ? 'bg-emerald-500' : hs.difficulty === 'medium' ? 'bg-blue-500' : hs.difficulty === 'hard' ? 'bg-orange-500' : 'bg-purple-600'}`} title={hs.difficulty} />
                              )}
                            </div>
                        </div>
                      ))}</div>
                    )}
                  </div>
                </div>
              </div>

            {/* Global Leaderboard on home */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" />Global Leaderboard</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setHomeLeaderboardMode('classic'); setHomePage(0); }} className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${homeLeaderboardMode === 'classic' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                    <Star className="w-3 h-3 inline mr-1" />Classic
                  </button>
                  <button onClick={() => { setHomeLeaderboardMode('endless'); setHomePage(0); }} className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${homeLeaderboardMode === 'endless' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                    <Flame className="w-3 h-3 inline mr-1" />Endless
                  </button>
                </div>
              </div>
{(() => {
                const entries = homeLeaderboard[homeLeaderboardMode];
                const pageSize = 3;
                const totalPages = Math.ceil(entries.length / pageSize);
                const pageEntries = entries.slice(homePage * pageSize, homePage * pageSize + pageSize);
                return homeLeaderboardLoading ? (
                  <p className="text-slate-500 text-xs text-center py-2">Loading...</p>
                ) : entries.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-2">No scores yet — be the first!</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {pageEntries.map((entry, i) => {
                        const rank = homePage * pageSize + i;
                        return (
                          <div key={entry.id ?? rank} className={`flex items-center justify-between p-2 rounded-lg ${rank === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : rank === 1 ? 'bg-slate-400/10 border border-slate-400/10' : rank === 2 ? 'bg-amber-600/10 border border-amber-600/10' : 'bg-slate-700/50'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 0 ? 'bg-yellow-500/30 text-yellow-400' : rank === 1 ? 'bg-slate-400/30 text-slate-300' : rank === 2 ? 'bg-amber-600/30 text-amber-500' : 'bg-slate-600/30 text-slate-400'}`}>{rank + 1}</span>
                              <span className="font-semibold text-sm">{entry.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${entry.difficulty === 'easy' ? 'bg-emerald-500' : entry.difficulty === 'medium' ? 'bg-blue-500' : entry.difficulty === 'hard' ? 'bg-orange-500' : 'bg-purple-600'}`} title={entry.difficulty} />
                              <div className="text-right">
                                {homeLeaderboardMode === 'classic'
                                  ? <><span className="font-bold text-sm text-emerald-400">{entry.percentage}%</span><span className="text-xs text-slate-400 ml-1">({entry.weighted_score}pts)</span></>
                                  : <><span className="font-bold text-sm text-orange-400 flex items-center gap-1"><Flame className="w-3 h-3" />{entry.streak}</span><span className="text-xs text-slate-400">({entry.weighted_score}pts)</span></>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-3">
                        <button onClick={() => setHomePage(p => Math.max(0, p - 1))} disabled={homePage === 0}
                          className="text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1">
                          <ChevronLeft className="w-3 h-3" />Prev
                        </button>
                        <span className="text-xs text-slate-500">{homePage + 1} / {totalPages}</span>
                        <button onClick={() => setHomePage(p => Math.min(totalPages - 1, p + 1))} disabled={homePage === totalPages - 1}
                          className="text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1">
                          Next<ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Difficulty Selector */}
        {gameState === 'difficulty' && (
          <div className="card p-8 text-center animate-bounce-in">
            <button onClick={() => setGameState('start')}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg mb-6 text-sm mx-auto">
              <ChevronLeft className="w-4 h-4" />Back
            </button>
            <h2 className="text-2xl font-semibold mb-2">{pendingMode === 'classic' ? 'Classic Mode' : 'Endless Mode'}</h2>
            <p className="text-slate-400 mb-6">Choose your difficulty</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => startGame('easy')} className="flex flex-col items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">🌍</span><span className="text-lg">Easy</span><span className="text-xs text-emerald-200">Well-known facts</span>
              </button>
              <button onClick={() => startGame('medium')} className="flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">🗺️</span><span className="text-lg">Medium</span><span className="text-xs text-blue-200">Trickier stats</span>
              </button>
              <button onClick={() => startGame('hard')} className="flex flex-col items-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">🔥</span><span className="text-lg">Hard</span><span className="text-xs text-orange-200">Obscure records</span>
              </button>
              <button onClick={() => startGame('god')} className="flex flex-col items-center gap-2 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="text-2xl">⚡</span><span className="text-lg">God</span><span className="text-xs text-purple-200">Expert only</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Screen */}
        {gameState === 'playing' && questions.length > 0 && (
          <>
            <button onClick={() => setGameState('start')}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg mb-4 text-sm">
              <ChevronLeft className="w-4 h-4" />Home
            </button>
            <div className="flex items-center justify-between mb-6 animate-slide-up">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">{score}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-400">{currentIndex + (isAnswerRevealed ? 1 : 0)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm sm:text-base">
                  <div className="flex items-center gap-1">
                    <Flame className={`w-5 h-5 ${streak > 2 ? 'text-orange-400 animate-pulse' : 'text-orange-400'}`} />
                    <span className="font-semibold">{streak}</span>
                  </div>
                  {(() => {
                    const savedBest = gameMode === 'endless'
                      ? (endlessHighScores.filter(s => s.difficulty === difficulty)[0]?.streak ?? 0)
                      : (highScores.filter(s => s.difficulty === difficulty)[0]?.score ?? 0);
                    const currentBest = gameMode === 'endless' ? streak : score;
                    const localBest = Math.max(savedBest, currentBest);
                    return (
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-purple-400">{localBest}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="text-sm text-slate-400">
                {gameMode === 'endless'
                  ? <span className="text-orange-400 font-semibold flex items-center gap-1"><Flame className="w-4 h-4" />Endless</span>
                  : `${currentIndex + 1} / ${questions.length}`}
              </div>
            </div>
            {onFire && (
              <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-totem-flash">
                <div className="absolute inset-0 bg-orange-500/10" />
                <div className="relative flex flex-col items-center gap-4 animate-totem-pop">
                  <div className="flex items-center gap-2">
                    <Flame className="w-16 h-16 text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.9)]" />
                    <Flame className="w-24 h-24 text-orange-400 drop-shadow-[0_0_30px_rgba(251,146,60,0.9)]" />
                    <Flame className="w-16 h-16 text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.9)]" />
                  </div>
                  <p className="text-4xl font-black tracking-wide text-white drop-shadow-[0_0_20px_rgba(251,146,60,0.9)]" style={{textShadow:'0 0 30px #fb923c, 0 0 60px #c084fc'}}>
                    YOU'RE ON FIRE!
                  </p>
                  <p className="text-lg text-orange-300 font-semibold">New personal best! 🏆</p>
                </div>
              </div>
            )}
            {gameMode === 'classic' && (
              <div className="w-full h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
              </div>
            )}
            <QuestionCard question={questions[currentIndex]} onAnswer={handleAnswer} onNext={handleNext}
              isAnswerRevealed={isAnswerRevealed} questionNumber={currentIndex + 1} />
          </>
        )}

        {/* Classic Results */}
        {gameState === 'finished' && gameMode === 'classic' && (
          <div className="card p-8 text-center animate-bounce-in">
            <div className="mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${finalScore >= 8 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : finalScore >= 5 ? 'bg-gradient-to-br from-blue-400 to-emerald-500' : 'bg-gradient-to-br from-red-400 to-red-600'}`}>
                {finalScore >= 8 ? <Trophy className="w-12 h-12 text-white" /> : finalScore >= 5 ? <TrendingUp className="w-12 h-12 text-white" /> : <RotateCcw className="w-12 h-12 text-white" />}
              </div>
              <h2 className="text-3xl font-bold mb-2">{finalScore >= 8 ? 'Excellent!' : finalScore >= 5 ? 'Good Job!' : 'Keep Practicing!'}</h2>
              <p className="text-slate-400 mb-4">You scored {finalScore} out of {questions.length}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/50">
                <span className="text-slate-400">Accuracy:</span>
                <span className={`font-bold text-lg ${finalScore >= 8 ? 'text-emerald-400' : finalScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round((finalScore / questions.length) * 100)}%
                </span>
              </div>
            </div>
            {/* Name submit */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              {!nameSubmitted ? (
                <div>
                  <p className="text-slate-300 font-medium mb-3 flex items-center justify-center gap-2"><Medal className="w-4 h-4 text-yellow-400" />Submit to Global Leaderboard</p>
                  <div className="flex gap-2">
                    <input value={playerName} onChange={e => setPlayerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmitScore()}
                      placeholder="Your name..." maxLength={20}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400" />
                    <button onClick={handleSubmitScore} disabled={submitting || !playerName.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                      {submitting ? '...' : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  {submitError && <p className="text-red-400 text-xs mt-2">Failed to submit — check your connection.</p>}
                </div>
              ) : (
                <p className="text-emerald-400 font-medium flex items-center justify-center gap-2"><Check className="w-4 h-4" />Score submitted!</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button onClick={() => { setPendingMode('classic'); setNameSubmitted(false); setPlayerName(''); startGame(difficulty); }} className="btn-primary flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />Play Again
              </button>
              <button onClick={() => openLeaderboard('classic')} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                <List className="w-4 h-4" />Leaderboard
              </button>
              <button onClick={() => { setNameSubmitted(false); setPlayerName(''); setGameState('start'); }} className="text-slate-400 hover:text-white transition-colors py-3 px-6">Main Menu</button>
            </div>
          </div>
        )}

        {/* Endless Results */}
        {gameState === 'finished' && gameMode === 'endless' && (
          <div className="card p-8 text-center animate-bounce-in">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-orange-500 to-red-600">
                <Flame className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-1">Streak Over!</h2>
              <p className="text-slate-400 mb-4">You got it wrong — better luck next time!</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-orange-500/20 border border-orange-500/30">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-slate-300">Streak:</span>
                <span className="font-bold text-3xl text-orange-400">{bestStreak}</span>
              </div>
            </div>
            {/* Name submit */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              {!nameSubmitted ? (
                <div>
                  <p className="text-slate-300 font-medium mb-3 flex items-center justify-center gap-2"><Medal className="w-4 h-4 text-yellow-400" />Submit to Global Leaderboard</p>
                  <div className="flex gap-2">
                    <input value={playerName} onChange={e => setPlayerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmitScore()}
                      placeholder="Your name..." maxLength={20}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-orange-400" />
                    <button onClick={handleSubmitScore} disabled={submitting || !playerName.trim()}
                      className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                      {submitting ? '...' : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  {submitError && <p className="text-red-400 text-xs mt-2">Failed to submit — check your connection.</p>}
                </div>
              ) : (
                <p className="text-emerald-400 font-medium flex items-center justify-center gap-2"><Check className="w-4 h-4" />Score submitted!</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button onClick={() => { setPendingMode('endless'); setNameSubmitted(false); setPlayerName(''); startGame(difficulty); }} className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />Try Again
              </button>
              <button onClick={() => openLeaderboard('endless')} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                <List className="w-4 h-4" />Leaderboard
              </button>
              <button onClick={() => { setNameSubmitted(false); setPlayerName(''); setGameState('start'); }} className="text-slate-400 hover:text-white transition-colors py-3 px-6">Main Menu</button>
            </div>
          </div>
        )}

        {/* Global Leaderboard Screen */}
        {gameState === 'leaderboard' && (
          <div className="card p-8 animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-400" />Global Leaderboard</h2>
              <button onClick={() => setGameState('finished')} className="text-slate-400 hover:text-white transition-colors text-sm">← Back</button>
            </div>
            <div className="flex gap-2 mb-6">
              <button onClick={() => openLeaderboard('classic')} className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${leaderboardMode === 'classic' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                <Star className="w-4 h-4 inline mr-1" />Classic
              </button>
              <button onClick={() => openLeaderboard('endless')} className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${leaderboardMode === 'endless' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                <Flame className="w-4 h-4 inline mr-1" />Endless
              </button>
            </div>
            {leaderboardLoading ? (
              <div className="text-center text-slate-400 py-8">Loading...</div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No scores yet — be the first!</div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.map((entry, i) => (
                  <div key={entry.id ?? i} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : i === 1 ? 'bg-slate-400/10 border border-slate-400/20' : i === 2 ? 'bg-amber-600/10 border border-amber-600/20' : 'bg-slate-700/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-500/30 text-yellow-400' : i === 1 ? 'bg-slate-400/30 text-slate-300' : i === 2 ? 'bg-amber-600/30 text-amber-500' : 'bg-slate-600/30 text-slate-400'}`}>{i + 1}</span>
                      <div>
                        <p className="font-semibold text-sm">{entry.name}</p>
                        <p className="text-xs text-slate-400">{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${entry.difficulty === 'easy' ? 'bg-emerald-500' : entry.difficulty === 'medium' ? 'bg-blue-500' : entry.difficulty === 'hard' ? 'bg-orange-500' : 'bg-purple-600'}`} title={entry.difficulty} />
                      <div className="text-right">
                        {leaderboardMode === 'classic'
                          ? <><span className="font-bold text-emerald-400">{entry.percentage}%</span><span className="text-xs text-slate-400 ml-1">({entry.weighted_score}pts)</span></>
                          : <><span className="font-bold text-orange-400 flex items-center gap-1"><Flame className="w-3 h-3" />{entry.streak}</span><span className="text-xs text-slate-400">({entry.weighted_score}pts)</span></>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setNameSubmitted(false); setPlayerName(''); setGameState('start'); }} className="w-full mt-6 text-slate-400 hover:text-white transition-colors py-3">Main Menu</button>
          </div>
        )}
      </div>
    </div>
  );
}
