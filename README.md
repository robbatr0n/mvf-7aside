# 7-aside Stats Tracker

A full-stack football analytics platform built to track and analyse player performance across a weekly 7-aside football group. Built for real users with real data, analysed and tagged live each week.

**[Live Demo →](https://palceholder)**

**Note:** The live demo uses anonymised player data to protect the privacy of the real users. The data is also not updated unlike the production version. 

## Features

**Match Tagging**
- Password-protected live tagger for recording goals, assists, shots, tackles and interceptions and more in real time
- Sequential event flows e.g. goal → assister → key pass chains
- Continue tagging existing games to backfill historical stats
- Undo support with cascade removal of linked events

**Leaderboards**
- Attacking leaderboard — goals, assists, G+A, shots on target, key passes, shot accuracy, conversion and goals per game
- Defending leaderboard — tackles, interceptions, defensive actions and per-game rates
- Dedicated goalkeeper leaderboard — saves, goals conceded, save percentage and clean sheets
- Form badges showing last 5 game results per player

**Player Profiles**
- Full attacking, defending and shooting stat breakdown
- Game-by-game history table
- Awards won displayed on profile

**Game Summaries**
- Per-game score and goal scorers with assisters
- Team stats comparison — shots, accuracy, conversion, key passes, tackles and interceptions

**Awards**
- 25+ auto-calculated awards across scoring, shooting, defending, consistency, results and misc categories

**Goalkeeper Tracking**
- Saves derived automatically from unlinked shots on target
- Per-game goalkeeper stats with clean sheet tracking
- Separate goalkeeper leaderboard and profile stats section

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Database | PostgreSQL via Supabase |
| Auth | Row-level security, password-protected tagger |
| Deployment | Vercel |

## Screenshots

*Coming soon*

---

Built by [Rob](https://github.com/robbatr0n)
