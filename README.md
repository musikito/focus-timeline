# AccountableAI 
**AI-Powered Weekly Planning & Time Accountability**

AccountableAI helps you plan your week, track how you *actually* spent your time, and receive personalized AI feedback to improve focus, habits, and consistency.

---

## ✨ Features

### ✔ Weekly Planning  
- Add goals with target hours  
- Drag-and-drop prioritization  
- Automatic storage and reordering  

### ✔ Tracking Productivity  
- Compare *planned vs actual* time  
- Visual timeline and bar charts  
- Import from calendar (manual / OCR-ready)  

### ✔ AI Coaching  
- Weekly summaries powered by OpenAI  
- Personalized advice based on your data  
- “Coach Memory System” that learns your habits  
- Optional voice-based interaction  

### ✔ Gamification  
- XP and leveling system  
- Achievements and badges  
- Streak tracking  
- Level-up animations  

### ✔ Smooth Onboarding  
- Guided tutorial steps  
- Tooltip tour  
- Animated coach  
- Progress checklist  

---

## 🧱 Tech Stack

| Area | Technology |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | Supabase (Postgres) |
| AI | OpenAI API |
| UI | TailwindCSS, shadcn/ui, Radix UI |
| Charts | Recharts |
| Drag & Drop | dnd-kit |
| Animations | Lottie, Framer Motion |

---

## 🚀 Getting Started

### 1. Clone the project

```bash
git clone https://github.com/musikito/accountableai.git
cd accountableai

2. Install dependencies
pnpm install

3. Environment variables

Create a .env.local file:

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

4. Run the dev server
pnpm dev


Open the app at:
http://localhost:3000

🗄 Database Schema (Supabase)

FocusMirror uses these primary entities:

profiles — user profile, XP, level

weeks — weekly planning period

goals — planned goals with target hours

time_blocks — actual time spent

weekly_summaries — AI-generated text + insights

coach_memory — long-term AI memory about user habits

achievements — badge definitions

user_achievements — unlocked user badges

To create the schema, run:

supabase db push


Or paste the SQL from supabase/migrations/0001_init.sql.

📂 Project Structure
src/
  app/
    dashboard/
    weeks/
    api/
  components/
    goals/
    weekly/
    onboarding/
    achievements/
  context/
    onboarding-context.tsx
  lib/
    supabase/
    xp.ts
    coachMemory.ts
    achievements.ts
public/
  lottie/
  coach-avatar.gif

🤖 AI Summary Flow

User finishes a week

App fetches goals + time blocks

Sends structured prompt to OpenAI

AI returns:

weekly summary

personalized advice

memory updates

App saves summary + updates coach memory

XP & achievements update automatically

🏅 XP & Achievements

Users earn XP for:

Completing onboarding

Weekly summaries

Focus score milestones

Streak weeks

Unlocking achievements

Goal reordering mastery

Levels increase with a simple XP curve:

xp_for_next_level = 100 + (level - 1) * 150

🎨 Screenshots / Demo

Add UI screenshots or GIFs here.

Example:

/public/screenshots/dashboard.png
/public/screenshots/chart.png

📦 Deployment
Deploy to Vercel
vercel


Add your .env.local keys to Vercel environment variables.

Supabase Setup

Just ensure your project URL + API keys are added to .env.local.

Clerk Setup

Add your production domain in the Clerk dashboard.

📝 License

MIT License.
Feel free to modify, extend, or commercialize.

🙌 Contributing

Pull requests are welcome!
Open an issue if you have suggestions or bugs.

⭐ Support & Next Steps

If you’d like, I can help you generate:

A polished landing page

A pricing page (SaaS style)

CONTRIBUTING.md

API reference documentation

A CI/CD GitHub workflow

A Dockerfile

Just tell me what you want!