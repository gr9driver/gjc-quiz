import { useNavigate } from 'react-router-dom';
import { Globe, Dumbbell } from 'lucide-react';

export default function Hub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center animate-bounce-in">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent mb-3">
          GJC Quiz
        </h1>
        <p className="text-slate-400 mb-10 text-lg">Choose a game to play</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/country')}
            className="card p-6 flex items-center gap-5 hover:border-blue-500/50 hover:bg-slate-700/80 transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">The Country Game</h2>
              <p className="text-slate-400 text-sm">Capitals, geography & world facts</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/sport')}
            className="card p-6 flex items-center gap-5 hover:border-orange-500/50 hover:bg-slate-700/80 transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">The Sport Game</h2>
              <p className="text-slate-400 text-sm">Athletes, records & sporting history</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
