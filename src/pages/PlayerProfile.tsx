import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayers } from "../hooks/usePlayers";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useStats } from "../hooks/useStats";
import { useGoalkeeperStats } from "../hooks/useGoalKeeperStats";
import { calculatePlayerGameBreakdown, calculateGoalkeeperGameBreakdown } from "../utils/stats";
import { calculateAwards } from "../utils/awards";
import PlayerCharts from "../components/profile/PlayerCharts";
import PassingHub from "../components/profile/PassingHub";
import VideoModal from "../components/shared/VideoModal";
import PLMatchCard from "../components/shared/PLMatchCard";
import { useTeamStats } from "../hooks/useTeamStats";
import statBoosts from "../data/statBoosts.json";
import { computeAllPLMatches } from "../utils/plMatch";

interface StatRowProps {
  label: string;
  value: string | number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] last:border-0">
      <span className="text-[#1C1C1C] dark:text-[#E5E6E3] text-sm">{label}</span>
      <span className="font-semibold text-sm text-[#1C1C1C] dark:text-[#E5E6E3]">
        {value}
      </span>
    </div>
  );
}

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useEvents();
  const { games, loading: gamesLoading } = useGames();
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers();
  const { stats } = useStats(players, events, games, gamePlayers);
  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers);
  const [activeClip, setActiveClip] = useState<{ src: string; label: string } | null>(null);

  const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading;

  const player = players.find((p) => p.id === id);
  const playerStats = stats.find((s) => s.player.id === id);
  const gkStats = goalkeeperStats.find((s) => s.player.id === id);

  const { teamOfSeasonIds, totwAppearances, motmAppearances, motmByGame } = useTeamStats(
    stats, goalkeeperStats, players, events, games, gamePlayers,
  );

  const isInTots = id ? teamOfSeasonIds.has(id) : false;
  const totwCount = id ? (totwAppearances.get(id) ?? 0) : 0;
  const motmCount = id ? (motmAppearances.get(id) ?? 0) : 0;

  const gameBreakdown = useMemo(() => {
    if (!id) return [];
    return calculatePlayerGameBreakdown(id, events, games, gamePlayers);
  }, [id, events, games, gamePlayers]);

  const gkBreakdown = useMemo(() => {
    if (!id || !player?.is_goalkeeper) return [];
    return calculateGoalkeeperGameBreakdown(id, events, games, gamePlayers);
  }, [id, events, games, gamePlayers, player]);

  const { awards, partnership } = useMemo(
    () => calculateAwards(stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances),
    [stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances],
  );

  const myAwards = useMemo(() => {
    const all = [...awards];
    if (partnership && partnership.players.includes(player?.name ?? "")) {
      all.push({
        emoji: partnership.emoji,
        title: partnership.title,
        description: partnership.description,
        winners: partnership.players,
        value: partnership.value,
        noWinner: false,
      });
    }
    return all.filter((a) => !a.noWinner && a.winners.includes(player?.name ?? ""));
  }, [awards, partnership, player]);

  const tierStyles = {
    gold: {
      card: "bg-gradient-to-br from-[#2a2000] via-[#1a1500] to-[#221a00] border-[rgba(202,162,0,0.4)]",
      stripe: "bg-gradient-to-br from-[rgba(202,162,0,0.14)] to-transparent",
      overall: "text-[#f5c842]",
    },
    silver: {
      card: "bg-gradient-to-br from-[#1c1e22] via-[#141618] to-[#1a1c20] border-[rgba(160,170,185,0.3)]",
      stripe: "bg-gradient-to-br from-[rgba(160,170,185,0.09)] to-transparent",
      overall: "text-[#c8d0dc]",
    },
    base: {
      card: "bg-[#FFFFFF] dark:bg-[#111518] border-[#D4D3D0] dark:border-[#2a2e31]",
      stripe: "bg-gradient-to-br from-[rgba(176,0,15,0.05)] to-transparent",
      overall: "text-[#1C1C1C] dark:text-[#E5E6E3]",
    },
  } as const;

  const { outfieldOverall, outfieldScores, futStats } = useMemo(() => {
    const empty = { outfieldOverall: null, outfieldScores: [] as { id: string; score: number }[], futStats: null };
    if (!playerStats) return empty;

    const outfield = stats.filter(s => !s.player.is_goalkeeper && s.games_played >= 5);

    const gaPerGame  = (s: typeof playerStats) => s.goal_involvements / s.games_played;
    const defPerGame = (s: typeof playerStats) => s.defensive_actions / s.games_played;
    const totalShots = (s: typeof playerStats) => s.shots_on_target + s.shots_off_target;

    const gaMax  = Math.max(...outfield.map(gaPerGame), 0.01);
    const defMax = Math.max(...outfield.map(defPerGame), 0.01);
    const shoMax = Math.max(...outfield.filter(s => totalShots(s) >= 5).map(s => s.shot_accuracy), 0.01);
    const pasMax = Math.max(...outfield.filter(s => s.pass_attempts > 0).map(s => s.pass_accuracy), 0.01);

    const scale = (val: number, max: number) => Math.round(55 + (val / max) * 44);

    const weightedNorm = (s: typeof playerStats) => {
      const dims: { norm: number; weight: number }[] = [
        { norm: gaPerGame(s) / gaMax,  weight: 0.40 },
        { norm: defPerGame(s) / defMax, weight: 0.25 },
      ];
      if (totalShots(s) >= 5)    dims.push({ norm: s.shot_accuracy / shoMax, weight: 0.20 });
      if (s.pass_attempts > 0)   dims.push({ norm: s.pass_accuracy / pasMax, weight: 0.15 });
      const totalW = dims.reduce((sum, d) => sum + d.weight, 0);
      return dims.reduce((sum, d) => sum + d.norm * (d.weight / totalW), 0);
    };

    const scores = outfield.map(s => ({ id: s.player.id, score: weightedNorm(s) }));

    if (playerStats.games_played < 3) return { outfieldOverall: null, outfieldScores: scores, futStats: null };

    const ga  = gaPerGame(playerStats);
    const def = defPerGame(playerStats);
    const sho = totalShots(playerStats) >= 5 ? playerStats.shot_accuracy : null;
    const pas = playerStats.pass_attempts > 0 ? playerStats.pass_accuracy : null;

    const fs = {
      ATT: { val: scale(ga, gaMax),   label: "Goal involvements per game" },
      SHO: sho !== null ? { val: scale(sho, shoMax), label: "Shot accuracy %" }   : null,
      PAS: pas !== null ? { val: scale(pas, pasMax), label: "Pass accuracy %" }    : null,
      DEF: { val: scale(def, defMax), label: "Defensive actions per game" },
    };

    return { outfieldOverall: Math.round(65 + weightedNorm(playerStats) * 26), outfieldScores: scores, futStats: fs };
  }, [stats, playerStats]);

  const gkOverall = useMemo(() => {
    if (!gkStats) return null;
    const max = Math.max(...goalkeeperStats.map(g => g.savePercentage), 0.01);
    return gkStats.games >= 3 ? Math.round(65 + (gkStats.savePercentage / max) * 26) : null;
  }, [goalkeeperStats, gkStats]);

  const computedOverall = outfieldOverall ?? gkOverall;
  const ovrBoost = ((statBoosts as Record<string, Record<string, unknown>>)[player?.name ?? '']?.OVR as number | undefined) ?? 0;
  const overall = computedOverall !== null ? Math.min(99, computedOverall + ovrBoost) : null;

  const squadRank = useMemo(() => {
    if (player?.is_goalkeeper && gkStats) {
      const sorted = [...goalkeeperStats]
        .map(g => ({ id: g.player.id, score: g.savePercentage }))
        .sort((a, b) => b.score - a.score);
      const idx = sorted.findIndex(g => g.id === id);
      return idx >= 0 ? idx + 1 : null;
    }
    if (playerStats) {
      const boostedScores = outfieldScores.map(o => {
        const name = stats.find(s => s.player.id === o.id)?.player.name ?? '';
        const boost = ((statBoosts as Record<string, Record<string, unknown>>)[name]?.OVR as number | undefined) ?? 0;
        return { id: o.id, ovr: Math.min(99, Math.round(65 + o.score * 26) + boost) };
      });
      const sorted = boostedScores.sort((a, b) => b.ovr - a.ovr);
      const idx = sorted.findIndex(o => o.id === id);
      return idx >= 0 ? idx + 1 : null;
    }
    return null;
  }, [player, gkStats, goalkeeperStats, playerStats, outfieldScores, stats, id]);

  const tier = (isInTots ? "gold" : totwCount >= 2 ? "silver" : "base") as keyof typeof tierStyles;

  const futGkStats = useMemo(() => {
    if (!gkStats || gkStats.games < 3) return null;
    const gks = goalkeeperStats.filter(g => g.games >= 3);
    const scale = (val: number, vals: number[]) => {
      const max = Math.max(...vals, 0.01);
      return Math.round(55 + (val / max) * 44);
    };
    const conScore = (g: typeof gkStats) => {
      const m = motmAppearances.get(g.player.id) ?? 0;
      const t = totwAppearances.get(g.player.id) ?? 0;
      return (m * 3 + t) / g.games;
    };
    const maxGca = Math.max(...gks.map(g => g.goalsConcededPerGame), 0.01);
    const gcaScore = Math.round(55 + (1 - gkStats.goalsConcededPerGame / maxGca) * 44);
    return {
      SAV: { val: scale(gkStats.savePercentage, gks.map(g => g.savePercentage)), label: "Save percentage" },
      RFX: { val: scale(gkStats.savesPerGame, gks.map(g => g.savesPerGame)), label: "Saves per game" },
      CLN: { val: scale(gkStats.cleanSheetPercentage, gks.map(g => g.cleanSheetPercentage)), label: "Clean sheet %" },
      GCA: { val: gcaScore, label: "Goals conceded per game (lower is better)" },
      WIN: { val: scale(gkStats.win_rate, gks.map(g => g.win_rate)), label: "Win rate %" },
      CON: { val: scale(conScore(gkStats), gks.map(conScore)), label: "MOTM & TOTW frequency" },
    };
  }, [gkStats, goalkeeperStats, motmAppearances, totwAppearances]);

  type StatMap = Record<string, { val: number; label: string } | null>;
  const boostedFutStats = useMemo((): StatMap | null => {
    if (!futStats || !player) return futStats;
    const boosts = (statBoosts as Record<string, Record<string, unknown>>)[player.name] ?? {};
    if (Object.keys(boosts).length === 0) return futStats;
    return Object.fromEntries(
      Object.entries(futStats).map(([key, stat]) => {
        if (!stat) return [key, stat];
        const boost = (boosts[key] as number | undefined) ?? 0;
        return [key, { ...stat, val: Math.min(99, stat.val + boost) }];
      })
    );
  }, [futStats, player]);

  const plMatch = useMemo(() => {
    if (!player) return null;
    const boosts = (statBoosts as Record<string, Record<string, unknown>>)[player.name] ?? {};
    const override = boosts['PLMatch'] as { name: string; team: string; pos?: string } | undefined;
    if (override) return { name: override.name, club: override.team, position: override.pos ?? '' };
    const allMatches = computeAllPLMatches(stats, goalkeeperStats);
    const match = allMatches.get(player.id);
    return match ? { name: match.name, club: match.club, position: match.position } : null;
  }, [player, stats, goalkeeperStats]);

  const bestGame = useMemo(() => {
    if (gameBreakdown.length === 0) return null;
    return gameBreakdown.reduce((best, g) =>
      g.goal_involvements > best.goal_involvements ? g : best,
    );
  }, [gameBreakdown]);

  const [awardsExpanded, setAwardsExpanded] = useState(false);
  const [gameSortKey, setGameSortKey] = useState("date");
  const [gameSortDir, setGameSortDir] = useState<"asc" | "desc">("desc");

  function handleGameSort(key: string) {
    if (key === gameSortKey) setGameSortDir(d => d === "desc" ? "asc" : "desc");
    else { setGameSortKey(key); setGameSortDir("desc"); }
  }

  const RESULT_VAL: Record<string, number> = { W: 3, D: 1, L: 0 };

  const sortedGameBreakdown = useMemo(() => {
    return [...gameBreakdown].sort((a, b) => {
      const dir = (v: number) => gameSortDir === "desc" ? -v : v;
      if (gameSortKey === "date") return dir(new Date(a.game.date).getTime() - new Date(b.game.date).getTime());
      if (gameSortKey === "result") {
        const teamA = gamePlayers.find(gp => gp.game_id === a.game.id && gp.player_id === id)?.team;
        const teamB = gamePlayers.find(gp => gp.game_id === b.game.id && gp.player_id === id)?.team;
        const rA = a.game.winning_team === null ? "—" : a.game.winning_team === 0 ? "D" : a.game.winning_team === teamA ? "W" : "L";
        const rB = b.game.winning_team === null ? "—" : b.game.winning_team === 0 ? "D" : b.game.winning_team === teamB ? "W" : "L";
        return dir((RESULT_VAL[rA] ?? -1) - (RESULT_VAL[rB] ?? -1));
      }
      if (gameSortKey === "motm") {
        const aM = motmByGame.get(a.game.id)?.id === id ? 1 : 0;
        const bM = motmByGame.get(b.game.id)?.id === id ? 1 : 0;
        return dir(aM - bM);
      }
      const aVal = (a as unknown as Record<string, number>)[gameSortKey] ?? 0;
      const bVal = (b as unknown as Record<string, number>)[gameSortKey] ?? 0;
      return dir(aVal - bVal);
    });
  }, [gameBreakdown, gameSortKey, gameSortDir, gamePlayers, id, motmByGame]);

  const [gkSortKey, setGkSortKey] = useState("date");
  const [gkSortDir, setGkSortDir] = useState<"asc" | "desc">("desc");

  function handleGkSort(key: string) {
    const lowerBetter = key === "goalsConceded";
    if (key === gkSortKey) setGkSortDir(d => d === "desc" ? "asc" : "desc");
    else { setGkSortKey(key); setGkSortDir(lowerBetter ? "asc" : "desc"); }
  }

  const sortedGkGames = useMemo(() => {
    const gkGames = games
      .filter(g => gamePlayers.some(gp => gp.game_id === g.id && gp.player_id === id))
      .map(game => {
        const keeperEntry = gamePlayers.find(gp => gp.game_id === game.id && gp.player_id === id);
        const keeperTeam = keeperEntry?.team;
        const gameEvents = events.filter(e => e.game_id === game.id);
        const opposingPlayerIds = new Set(gamePlayers.filter(gp => gp.game_id === game.id && gp.team !== keeperTeam).map(gp => gp.player_id));
        const saves = gameEvents.filter(e => e.event_type === "shot_on_target" && e.related_event_id === null && opposingPlayerIds.has(e.player_id)).length;
        const goalsConceded = gameEvents.filter(e => {
          if (e.event_type !== "goal") return false;
          if (e.team_override !== null) return e.team_override !== keeperTeam;
          return opposingPlayerIds.has(e.player_id);
        }).length;
        const totalShots = saves + goalsConceded;
        const svPct = totalShots > 0 ? Math.round((saves / totalShots) * 100) : null;
        const cleanSheet = goalsConceded === 0;
        const result = game.winning_team === null ? "—" : game.winning_team === 0 ? "D" : game.winning_team === keeperTeam ? "W" : "L";
        return { game, saves, goalsConceded, svPct, cleanSheet, result, keeperTeam };
      });

    return gkGames.sort((a, b) => {
      const dir = (v: number) => gkSortDir === "desc" ? -v : v;
      if (gkSortKey === "date") return dir(new Date(a.game.date).getTime() - new Date(b.game.date).getTime());
      if (gkSortKey === "result") return dir((RESULT_VAL[a.result] ?? -1) - (RESULT_VAL[b.result] ?? -1));
      if (gkSortKey === "cleanSheet") return dir((a.cleanSheet ? 1 : 0) - (b.cleanSheet ? 1 : 0));
      if (gkSortKey === "svPct") return dir((a.svPct ?? -1) - (b.svPct ?? -1));
      return dir((a[gkSortKey as keyof typeof a] as number ?? 0) - (b[gkSortKey as keyof typeof b] as number ?? 0));
    });
  }, [games, gamePlayers, events, id, gkSortKey, gkSortDir]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-[#111518] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-lg font-semibold">Player not found</p>
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-sm transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!playerStats && !gkStats) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-lg font-semibold">No stats yet</p>
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-sm transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const goalClips = events.filter(
    (e) => e.player_id === id && e.event_type === "goal" && e.clip_url,
  );

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Page header — FUT-style card */}
        <div className="space-y-2">
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors">
            ← Dashboard
          </Link>
          <div className={`relative rounded-2xl border p-5 overflow-hidden ${tierStyles[tier].card}`}>
            <div className={`absolute inset-0 pointer-events-none ${tierStyles[tier].stripe}`} />
            <div className="relative flex items-start gap-5">
              {/* Overall rating */}
              <div className="text-center flex-shrink-0 min-w-[52px]">
                <div className={`text-5xl font-black leading-none tracking-tighter ${tierStyles[tier].overall}`}>
                  {overall ?? "—"}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9CA3AF] mt-1.5">OVR</div>
                {squadRank && (
                  <div className="text-[10px] text-gray-500 dark:text-[#9CA3AF] mt-0.5">#{squadRank}</div>
                )}
              </div>
              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h1 className={`text-xl font-bold leading-tight ${tier === "base" ? "text-[#1C1C1C] dark:text-[#E5E6E3]" : "text-[#E5E6E3]"}`}>
                    {player.name}
                  </h1>
                  <Link
                    to={`/players?compare=${id}`}
                    className={`text-xs transition-colors flex-shrink-0 mt-0.5 ${tier === "base" ? "text-gray-500 dark:text-[#9CA3AF] hover:text-mvf dark:hover:text-mvf" : "text-[#9CA3AF] hover:text-[#E5E6E3]"}`}
                  >
                    Compare →
                  </Link>
                </div>
                <p className={`text-sm mt-0.5 ${tier === "base" ? "text-gray-600 dark:text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                  {player.is_goalkeeper
                    ? `${gkStats?.games ?? 0} ${(gkStats?.games ?? 0) === 1 ? "game" : "games"} played`
                    : `${playerStats?.games_played ?? 0} ${playerStats?.games_played === 1 ? "game" : "games"} played`}
                </p>
                {(isInTots || totwCount > 0 || motmCount > 0) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {isInTots && (
                      <span className="inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        ⭐ Best VII
                      </span>
                    )}
                    {totwCount > 0 && (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${tier === "base" ? "bg-gray-100 dark:bg-[#1a1e21] border-[#D4D3D0] dark:border-[#2a2e31] text-gray-600 dark:text-[#E5E6E3]" : "bg-white/10 border-white/20 text-[#E5E6E3]"}`}>
                        🏅 ×{totwCount} TOTW
                      </span>
                    )}
                    {motmCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        🏆 ×{motmCount} MOTM
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Stat grid */}
            {(boostedFutStats || futGkStats) && (
              <div className={`relative mt-4 pt-4 border-t ${tier === "base" ? "border-[#D4D3D0] dark:border-[#2a2e31]" : "border-white/10"}`}>
                <div className="grid grid-cols-4 gap-1">
                  {(boostedFutStats
                    ? (Object.entries(boostedFutStats).filter(([, v]) => v !== null) as [string, { val: number; label: string }][])
                    : (Object.entries(futGkStats!) as [string, { val: number; label: string }][])
                  ).map(([key, stat]) => (
                    <div key={key} className="text-center cursor-help" title={stat.label}>
                      <div className={`text-base font-black leading-none ${tierStyles[tier].overall}`}>{stat.val}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#9CA3AF] mt-1">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {plMatch && (
          <PLMatchCard name={plMatch.name} club={plMatch.club} position={plMatch.position} />
        )}

        {/* Awards */}
        {myAwards.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Awards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(awardsExpanded ? myAwards : myAwards.slice(0, 6)).map((award) => (
                <div key={award.title} className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-3 flex items-start gap-3">
                  <span className="text-xl w-7 flex-shrink-0">{award.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-gray-600 dark:text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">{award.title}</p>
                    <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-medium text-sm mt-0.5">{award.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {myAwards.length > 6 && (
              <button
                onClick={() => setAwardsExpanded(e => !e)}
                className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-xl transition-colors bg-[#FFFFFF] dark:bg-[#111518]"
              >
                {awardsExpanded ? "Show less" : `Show ${myAwards.length - 6} more`}
              </button>
            )}
          </section>
        )}

        {/* Goals reel */}
        {(eventsLoading || goalClips.length > 0) && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Goals</h2>
                {!eventsLoading && goalClips.length > 0 && (
                  <Link to={`/player/${id}/goals`} className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors">
                    {goalClips.length > 3 ? `View all ${goalClips.length} →` : "View all →"}
                  </Link>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {eventsLoading
                  ? [...Array(3)].map((_, i) => (
                    <div key={i} className="flex-none w-36 rounded-xl overflow-hidden animate-pulse">
                      <div className="w-full aspect-video bg-gray-200 dark:bg-[#1a1e21]" />
                      <div className="h-3 mx-2 my-2 bg-gray-200 dark:bg-[#1a1e21] rounded" />
                    </div>
                  ))
                  : goalClips.slice(0, 3).map((event, i) => {
                    const game = games.find((g) => g.id === event.game_id);
                    return (
                      <div
                        key={event.id}
                        className="flex-none w-36 bg-gray-100 dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-xl overflow-hidden cursor-pointer"
                        onClick={() =>
                          setActiveClip({
                            src: event.clip_url!,
                            label: `Goal ${i + 1}${game ? ` — ${new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`,
                          })
                        }
                      >
                        <div className="relative">
                          <video
                            src={event.clip_url!}
                            className="w-full aspect-video object-cover"
                            preload="metadata"
                            playsInline
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-black/60 border border-gray-600 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[9px] border-t-transparent border-b-transparent border-l-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-[#9CA3AF] text-xs px-2 py-1.5">
                          {game ? new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </section>
            {activeClip && (
              <VideoModal src={activeClip.src} label={activeClip.label} onClose={() => setActiveClip(null)} />
            )}
          </>
        )}

        <PlayerCharts
          gameBreakdown={gameBreakdown}
          gkBreakdown={gkBreakdown}
          isGoalkeeper={player.is_goalkeeper}
          stats={stats}
          playerStats={playerStats}
        />

        {!player.is_goalkeeper && (
          <PassingHub playerId={id!} events={events} players={players} />
        )}

        {/* Goalkeeper stats */}
        {player.is_goalkeeper && gkStats ? (
          <>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Goalkeeping</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Games" value={gkStats.games} />
                <StatRow label="Saves" value={gkStats.saves} />
                <StatRow label="Saves per Game" value={gkStats.games > 0 ? gkStats.savesPerGame : "—"} />
                <StatRow label="Goals Conceded" value={gkStats.goalsConceded} />
                <StatRow label="Goals Conceded per Game" value={gkStats.games > 0 ? gkStats.goalsConcededPerGame : "—"} />
                <StatRow label="Save Percentage" value={gkStats.games > 0 ? `${gkStats.savePercentage}%` : "—"} />
                <StatRow label="Clean Sheets" value={gkStats.cleanSheets} />
                <StatRow label="Clean Sheet Percentage" value={gkStats.games > 0 ? `${gkStats.cleanSheetPercentage}%` : "—"} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Results</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Wins" value={gkStats.wins} />
                <StatRow label="Losses" value={gkStats.losses} />
                <StatRow label="Draws" value={gkStats.draws} />
                <StatRow label="Win Rate" value={gkStats.games > 0 ? `${gkStats.win_rate}%` : "—"} />
                {gkStats.form.length > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] last:border-0">
                    <span className="text-gray-600 dark:text-[#9CA3AF] text-sm">Last 5 Form</span>
                    <div className="flex items-center gap-1">
                      {gkStats.form.map((result, i) => (
                        <span key={i} className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${result === "W" ? "bg-[#dcfce7] text-[#166534] dark:bg-[#14532d] dark:text-[#86efac]" :
                          result === "L" ? "bg-[#fee2e2] text-[#991b1b] dark:bg-[#5a0a0a] dark:text-[#fca5a5]" :
                            "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* GK Game by Game */}
            {sortedGkGames.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Game by Game</h2>
                <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#D4D3D0] dark:border-[#2a2e31]">
                          {(["date", "saves", "goalsConceded", "svPct", "cleanSheet", "result"] as const).map((key, i) => {
                            const labels: Record<string, string> = { date: "Date", saves: "SV", goalsConceded: "GC", svPct: "SV%", cleanSheet: "CS", result: "Result" };
                            const isActive = gkSortKey === key;
                            return (
                              <th
                                key={key}
                                onClick={() => handleGkSort(key)}
                                className={`${i === 0 ? "text-left px-5" : "text-center px-4"} py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${isActive ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
                              >
                                {labels[key]}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGkGames.map(({ game, saves, goalsConceded, svPct, cleanSheet, result }) => {
                          const resultColor = result === "W" ? "text-green-600 dark:text-green-400" : result === "L" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-[#9CA3AF]";
                          return (
                            <tr key={game.id} className="hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/40 transition-colors">
                              <td className="px-5 py-3.5 text-gray-600 dark:text-[#E5E6E3]">
                                {new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold">{saves}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{goalsConceded}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{svPct !== null ? `${svPct}%` : "—"}</td>
                              <td className="text-center px-4 py-3.5">
                                {cleanSheet
                                  ? <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                                  : <span className="text-gray-300 dark:text-[#737373]">—</span>
                                }
                              </td>
                              <td className={`text-center px-4 py-3.5 font-semibold ${resultColor}`}>{result}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : playerStats ? (
          <>
            {/* Attacking */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Attacking</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Goals" value={playerStats.goals} />
                <StatRow label="Assists" value={playerStats.assists} />
                <StatRow label="Goal Involvements (G+A)" value={playerStats.goal_involvements} />
                <StatRow label="Key Passes" value={playerStats.key_passes} />
                <StatRow label="Key Passes per Game" value={playerStats.games_played > 0 ? playerStats.key_passes_per_game : "—"} />
                <StatRow label="Passes Completed" value={playerStats.pass_attempts > 0 ? playerStats.passes_completed : "—"} />
                <StatRow label="Pass Accuracy" value={playerStats.pass_attempts > 0 ? `${playerStats.pass_accuracy}%` : "—"} />
                <StatRow label="Passes per Game" value={playerStats.pass_attempts > 0 && playerStats.games_played > 0 ? playerStats.passes_per_game : "—"} />
                <StatRow label="Goals per Game" value={playerStats.goals_per_game} />
                {playerStats.hat_tricks > 0 && (
                  <StatRow label="Hat Tricks 🎩" value={playerStats.hat_tricks} />
                )}
                <StatRow
                  label="Current Scoring Streak"
                  value={playerStats.current_scoring_streak > 0 ? `${playerStats.current_scoring_streak} game${playerStats.current_scoring_streak > 1 ? "s" : ""} 🔥` : "—"}

                />
                <StatRow
                  label="Best Scoring Streak"
                  value={playerStats.best_scoring_streak > 0 ? `${playerStats.best_scoring_streak} game${playerStats.best_scoring_streak > 1 ? "s" : ""}` : "—"}
                />
                {bestGame && bestGame.goal_involvements > 0 && (
                  <StatRow
                    label="Best Game"
                    value={`${bestGame.goal_involvements} G+A (${new Date(bestGame.game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })})`}

                  />
                )}
              </div>
            </section>

            {/* Defending */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Defending</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Tackles" value={playerStats.tackles} />
                <StatRow label="Interceptions" value={playerStats.interceptions} />
                <StatRow label="Defensive Actions" value={playerStats.defensive_actions} />
                <StatRow label="Tackles per Game" value={playerStats.games_played > 0 ? playerStats.tackles_per_game : "—"} />
                <StatRow label="Interceptions per Game" value={playerStats.games_played > 0 ? playerStats.interceptions_per_game : "—"} />
                <StatRow label="Defensive Actions per Game" value={playerStats.games_played > 0 ? playerStats.defensive_actions_per_game : "—"} />
              </div>
            </section>

            {/* Shooting */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Shooting</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Shots on Target" value={playerStats.shots_on_target} />
                <StatRow label="Shots off Target" value={playerStats.shots_off_target} />
                <StatRow label="Total Shots" value={playerStats.shots_on_target + playerStats.shots_off_target} />
                <StatRow label="Shot Accuracy" value={playerStats.shots_on_target + playerStats.shots_off_target > 0 ? `${playerStats.shot_accuracy}%` : "—"} />
                <StatRow label="Shot Conversion" value={playerStats.shots_on_target + playerStats.shots_off_target > 0 ? `${playerStats.shot_conversion}%` : "—"} />
              </div>
            </section>

            {/* Results */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Results</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Wins" value={playerStats.wins} />
                <StatRow label="Losses" value={playerStats.losses} />
                <StatRow label="Draws" value={playerStats.draws} />
                <StatRow label="Win Rate" value={playerStats.games_played > 0 ? `${playerStats.win_rate}%` : "—"} />
                {motmCount > 0 && <StatRow label="Man of the Match 🏆" value={motmCount} />}
                {playerStats.form.length > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] last:border-0">
                    <span className="text-gray-600 dark:text-[#9CA3AF] text-sm">Last 5 Form</span>
                    <div className="flex items-center gap-1">
                      {playerStats.form.map((result, i) => (
                        <span key={i} className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${result === "W" ? "bg-[#dcfce7] text-[#166534] dark:bg-[#14532d] dark:text-[#86efac]" :
                          result === "L" ? "bg-[#fee2e2] text-[#991b1b] dark:bg-[#5a0a0a] dark:text-[#fca5a5]" :
                            "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Per game breakdown */}
            {gameBreakdown.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Game by Game</h2>
                <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#D4D3D0] dark:border-[#2a2e31]">
                          {(["date", "goals", "assists", "goal_involvements", "shots_on_target", "key_passes", "tackles", "interceptions", "passes_completed", "pass_accuracy", "motm", "result"] as const).map((key, i) => {
                            const labels: Record<string, string> = { date: "Date", goals: "G", assists: "A", goal_involvements: "G+A", shots_on_target: "SOT", key_passes: "KP", tackles: "TKL", interceptions: "INT", passes_completed: "PC", pass_accuracy: "P Acc%", motm: "MOTM", result: "Result" };
                            const isActive = gameSortKey === key;
                            return (
                              <th
                                key={key}
                                onClick={() => handleGameSort(key)}
                                className={`${i === 0 ? "text-left px-5" : "text-center px-4"} py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${isActive ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
                              >
                                {labels[key]}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGameBreakdown.map(({ game, goals, assists, key_passes, shots_on_target, goal_involvements, tackles, interceptions, passes_completed, pass_accuracy }) => {
                          const gp = gamePlayers.find((g) => g.game_id === game.id && g.player_id === id);
                          const playerTeam = gp?.team;
                          const result = game.winning_team === null ? "—" : game.winning_team === 0 ? "D" : game.winning_team === playerTeam ? "W" : "L";
                          const resultColor = result === "W" ? "text-green-600 dark:text-green-400" : result === "L" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-[#9CA3AF]";

                          return (
                            <tr key={game.id} className="hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/40 transition-colors">
                              <td className="px-5 py-3.5 text-gray-600 dark:text-[#E5E6E3]">
                                {new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold">{goals > 0 ? goals : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{assists > 0 ? assists : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{goal_involvements > 0 ? goal_involvements : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{shots_on_target > 0 ? shots_on_target : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{key_passes > 0 ? key_passes : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{tackles > 0 ? tackles : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{interceptions > 0 ? interceptions : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{passes_completed > 0 ? passes_completed : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{passes_completed > 0 ? `${pass_accuracy}%` : "—"}</td>
                              <td className="text-center px-4 py-3.5">
                                {motmByGame.get(game.id)?.id === id
                                  ? <span className="text-amber-500">🏆</span>
                                  : <span className="text-gray-300 dark:text-[#737373]">—</span>}
                              </td>
                              <td className={`text-center px-4 py-3.5 font-semibold ${resultColor}`}>{result}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : null}

      </div>
    </div>
  );
}