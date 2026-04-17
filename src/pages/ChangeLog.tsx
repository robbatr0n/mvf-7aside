import { Link } from "react-router-dom";

const CHANGELOG = [
  {
    version: '1.8.0',
    date: 'April 2026',
    changes: [
      'Redesigned dark/light mode switcher to a pill toggle in the nav bar',
      'Redesigned award cards to a compact horizontal layout across the dashboard, awards page and player profiles',
      'Awards page now shows 1 award per row on mobile, up to 3 columns on desktop',
      'Added red underline to section headings on the awards page',
      'Standardised page width across all pages for consistent layout when navigating',
      'Fixed dark mode background on dashboard — was pure black, now consistent with all other pages',
      'Removed horizontal row separators from the player leaderboard and game-by-game tables',
      'Restructured goalkeeper leaderboard to match the player leaderboard layout',
      'Fixed Draw form badge to use light grey in light mode',
      'Fixed low-contrast stat values in game breakdown comparison bars',
      'Improved tap targets on game pagination dots for mobile',
    ],
  },
  {
    version: '1.7.0',
    date: 'April 2026',
    changes: [
      'Added player ratings on the Best VII and Team of the Week pitch graphic',
      'Redesigned awards into four sections: Attacking, Defending, Goalkeepers and Consistency',
      'Streamlined awards — removed overlapping and redundant awards, down to 25 total',
      'Game in progress indicator on dashboard when a game is being tagged',
    ],
  },
  {
    version: "1.6.0",
    date: "March 2026",
    changes: [
      "Added Team of the Week — best 7 players from each game using a composite score, viewable for any historical game via dropdown",
      "Added TOTS and TOTW badges on player profiles, player cards and leaderboard",
      "Added most TOTW appearances award",
    ],
  },
  {
    version: "1.5.0",
    date: "March 2026",
    changes: [
      "Added Players page — browse all players with search, tap any card to view their full profile",
      "Added goalkeeper profile pages with dedicated stats and game by game breakdown",
      "Added goalkeeper awards — The Wall, Stone Cold and Superhero",
      "Player names now link to profiles throughout the app — leaderboard, award cards and game summaries",
      "Leaderboard now shows top 8 by default with expand option",
    ],
  },
  {
    version: "1.4.0",
    date: "March 2026",
    changes: [
      "Added goal video highlights — clips viewable on player profiles with a full goals archive page per player",
      "Added Best VII — composite score across goals, assists, defensive actions and win rate displayed on a pitch graphic",
      "Added Goal Machine award — most goals in a single game",
      "Added Assist Hero award — most assists in a single game",
      "Added Key Pass Hero award — most key passes in a single game",
      "Removed Wasteful, Mr Consistent and Boom or Bust awards",
      "Renamed Scoring section to Attacking, added One Game Wonder",
    ],
  },
  {
    version: "1.3.0",
    date: "March 2026",
    changes: [
      "Added Last 3 games toggle to leaderboard — view attacking and defending stats filtered to each player's most recent 3 games",
    ],
  },
  {
    version: "1.2.0",
    date: "6th March 2026",
    changes: [
      "Added tackle and interception tagging in the tagger",
      "Added defending tab to player leaderboard — tackles, interceptions, defensive actions and per game rates",
      "Added defensive stats section to player profiles",
      "Added 5 new defending awards — Hardman, Sweeper, Enforcer, Tackle Hero and Interception Hero",
    ],
  },
  {
    version: "1.1.0",
    date: "6th March 2026",
    changes: [
      "Added per-game team stats to game summaries — shots, shots on target, accuracy, conversion and key passes shown for each team",
      "Added goalkeeper leaderboard — saves, goals conceded, save percentage, clean sheets and form for dedicated goalkeepers",
      "Added goalkeeper profile page with dedicated stats section",
      "Goalkeepers excluded from outfield leaderboard and awards",
    ],
  },
  {
    version: "1.0.0",
    date: "1st March 2026",
    label: "Initial Release",
    changes: [
      "Player leaderboard with goals, assists, G+A, shots on target, key passes, shot accuracy, shot conversion and goals per game",
      "Game summaries with score, goal scorers and assisters",
      "Player profile pages with full stats breakdown and game-by-game history",
      "Awards page — 20 awards across scoring, shooting, consistency, results and misc categories",
      "Best Partnership award tracking most common goal and assist combinations",
      "Win, loss and draw tracking with form badges showing last 5 games",
      "Guest player support",
      "Private tagger to verify automatic statistics",
    ],
  },
];

export default function Changelog() {
  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div className="space-y-1">
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#E5E6E3]">Changelog</h1>
        </div>

        <div className="space-y-10">
          {CHANGELOG.map((release) => (
            <div key={release.version} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[#1C1C1C] dark:text-[#E5E6E3] font-bold text-lg">
                  {release.version}
                </span>
                {release.label && (
                  <span className="bg-mvf/10 border border-mvf/30 text-mvf text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {release.label}
                  </span>
                )}
                <span className="text-gray-600 dark:text-[#9CA3AF] text-sm ml-auto">
                  {release.date}
                </span>
              </div>
              <ul className="space-y-2 border-l-2 border-[#D4D3D0] dark:border-[#2a2e31] pl-4">
                {release.changes.map((change, i) => (
                  <li key={i} className="text-gray-600 dark:text-[#9CA3AF] text-sm leading-relaxed">
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}