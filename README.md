# GJC Quiz Game

A web-based trivia quiz platform featuring multiple game modes, difficulty levels, a global leaderboard, and real-time personal best tracking. Currently includes a **Country Game** and a **Sport Game**.

---

## Games

### 🌍 Country Game
Test your knowledge of world capitals, geography, flags, and facts.

### ⚽ Sport Game
Challenge yourself on athletes, records, stadiums, and sporting history.

---

## Features

### Gameplay
- **Classic Mode** — 10 questions, scored on accuracy
- **Endless Mode** — Answer until you get one wrong, beat your streak
- **4 Difficulty Levels** — Easy, Medium, Hard, God
- **Randomised Questions** — Fisher-Yates shuffle ensures varied question order
- **Instant Feedback** — Correct/incorrect highlight on answer selection

### Scoring
- **Weighted Scoring** — Difficulty multipliers: Easy ×1 · Medium ×2 · Hard ×3 · God ×4
- **Streak Counter** — Orange flame tracks your current streak live
- **Personal Best** — Purple flame shows your best score for the current mode & difficulty
- **"You're on Fire!"** — Full-screen totem-style animation triggers the first time you beat your personal best in a session

### Leaderboard
- **Global Leaderboard** powered by [Supabase](https://supabase.com)
- Submit your name after every Classic or Endless game
- Top scores ranked by weighted score
- Classic/Endless tabs with pagination (3 per page, up to 10 fetched)
- Difficulty colour dot next to every entry

### Local High Scores
- Top 3 scores saved per game mode in `localStorage`
- Difficulty dot shown alongside each score
- Persists between sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend / DB | Supabase (PostgreSQL) |
| Routing | React Router v6 |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Supabase Setup

The global leaderboard requires a Supabase project with the following table:

```sql
create extension if not exists "uuid-ossp";

create table leaderboard (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  score int not null,
  total int,
  percentage int,
  streak int,
  weighted_score int,
  mode text not null,
  difficulty text not null,
  game text not null,
  created_at timestamp with time zone default now()
);

alter table leaderboard enable row level security;
create policy "Allow public read"   on leaderboard for select using (true);
create policy "Allow public insert" on leaderboard for insert with check (true);
```

Add your Supabase URL and anon key to `src/lib/supabase.ts`.

---

## How to Play

1. Choose a game from the home screen
2. Select **Classic** or **Endless** mode
3. Pick a difficulty (Easy / Medium / Hard / God)
4. Answer questions — your streak and personal best update live
5. At the end, enter your name to submit to the global leaderboard
6. View the leaderboard or play again

---

## Project Structure

```
src/
├── components/       # Shared UI components
├── data/             # Question banks (country + sport)
├── lib/
│   └── supabase.ts   # Supabase client, submitScore, fetchLeaderboard
├── pages/
│   └── SportHome.tsx # Sport game (Classic + Endless + Leaderboard)
├── App.tsx           # Country game + routing
├── types.ts          # Shared TypeScript interfaces
└── index.css         # Global styles + Tailwind
```

---

## Roadmap

See [GitHub Issues](https://github.com/gr9driver/gjc-quiz/issues) for planned features and improvements.

Key upcoming work:
- Global leaderboard for the Country Game
- Additional question categories
- User profiles / persistent identity

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a PR against `main`
