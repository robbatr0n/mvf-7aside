import { useMemo, useState } from 'react'
import { usePlayers } from './usePlayers'
import { useEvents } from './useEvents'
import { useGames } from './useGames'
import { useGamePlayers } from './useGamePlayers'
import { useStats } from './useStats'
import { useGoalkeeperStats } from './useGoalKeeperStats'
import { useTeamStats } from './useTeamStats'
import { calculatePlayerGameBreakdown, calculateGoalkeeperGameBreakdown } from '../utils/stats'
import { calcSeasonScore } from '../utils/stats/scoring'
import { calculateAwards } from '../utils/awards'
import { computeAllPLMatches } from '../utils/plMatch'
import {
    OVR_FLOOR, OVR_RANGE, OVR_HARD_CAP,
    MIN_GAMES_DISPLAY, MIN_GAMES_COHORT,
} from '../utils/constants'
import type { GKGameBreakdown } from '../utils/stats'

const RESULT_VAL: Record<string, number> = { W: 3, D: 1, L: 0 }

export function usePlayerProfileData(id: string | undefined) {
    const { players, loading: playersLoading } = usePlayers()
    const { events, loading: eventsLoading } = useEvents()
    const { games, loading: gamesLoading } = useGames()
    const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers()
    const { stats } = useStats(players, events, games, gamePlayers)
    const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers)

    const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading

    const player = players.find(p => p.id === id)
    const playerStats = stats.find(s => s.player.id === id)
    const gkStats = goalkeeperStats.find(s => s.player.id === id)

    const { teamOfSeasonIds, totwAppearances, motmAppearances, motmByGame } = useTeamStats(
        stats, goalkeeperStats, players, events, games, gamePlayers,
    )

    const isInTots = id ? teamOfSeasonIds.has(id) : false
    const totwCount = id ? (totwAppearances.get(id) ?? 0) : 0
    const motmCount = id ? (motmAppearances.get(id) ?? 0) : 0

    const gameBreakdown = useMemo(() => {
        if (!id) return []
        return calculatePlayerGameBreakdown(id, events, games, gamePlayers)
    }, [id, events, games, gamePlayers])

    const gkBreakdown = useMemo(() => {
        if (!id || !player?.is_goalkeeper) return []
        return calculateGoalkeeperGameBreakdown(id, events, games, gamePlayers)
    }, [id, events, games, gamePlayers, player])

    const { awards, partnership } = useMemo(
        () => calculateAwards(stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances),
        [stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances],
    )

    const myAwards = useMemo(() => {
        const all = [...awards]
        if (partnership && partnership.players.includes(player?.name ?? '')) {
            all.push({
                emoji: partnership.emoji,
                title: partnership.title,
                description: partnership.description,
                winners: partnership.players,
                value: partnership.value,
                noWinner: false,
            })
        }
        return all.filter(a => !a.noWinner && a.winners.includes(player?.name ?? ''))
    }, [awards, partnership, player])

    const { outfieldOverall, outfieldScores, futStats } = useMemo(() => {
        const empty = { outfieldOverall: null, outfieldScores: [] as { id: string; score: number }[], futStats: null }
        if (!playerStats) return empty

        const outfield = stats.filter(s => !s.player.is_goalkeeper && s.games_played >= MIN_GAMES_COHORT)
        const scores = outfield.map(s => ({ id: s.player.id, score: calcSeasonScore(s) }))
        const maxScore = Math.max(...scores.map(o => o.score), 0.01)

        const gaPerGame  = (s: typeof playerStats) => s.goal_involvements / s.games_played
        const defPerGame = (s: typeof playerStats) => s.defensive_actions / s.games_played
        const totalShots = (s: typeof playerStats) => s.shots_on_target + s.shots_off_target
        const gaMax  = Math.max(...outfield.map(gaPerGame), 0.01)
        const defMax = Math.max(...outfield.map(defPerGame), 0.01)
        const shoMax = Math.max(...outfield.filter(s => totalShots(s) >= 5).map(s => s.shot_accuracy), 0.01)
        const pasMax = Math.max(...outfield.filter(s => s.pass_attempts > 0).map(s => s.pass_accuracy), 0.01)
        const scale  = (val: number, max: number) => Math.round(55 + (val / max) * 44)

        if (playerStats.games_played < MIN_GAMES_DISPLAY) return { outfieldOverall: null, outfieldScores: scores, futStats: null }

        const ga  = gaPerGame(playerStats)
        const def = defPerGame(playerStats)
        const sho = totalShots(playerStats) >= 5 ? playerStats.shot_accuracy : null
        const pas = playerStats.pass_attempts > 0 ? playerStats.pass_accuracy : null

        const fs = {
            ATT: { val: scale(ga, gaMax),   label: 'Goal involvements per game' },
            SHO: sho !== null ? { val: scale(sho, shoMax), label: 'Shot accuracy %' } : null,
            PAS: pas !== null ? { val: scale(pas, pasMax), label: 'Pass accuracy %' } : null,
            DEF: { val: scale(def, defMax), label: 'Defensive actions per game' },
        }

        return { outfieldOverall: Math.round(OVR_FLOOR + (calcSeasonScore(playerStats) / maxScore) * OVR_RANGE), outfieldScores: scores, futStats: fs }
    }, [stats, playerStats])

    const gkOverall = useMemo(() => {
        if (!gkStats) return null
        const max = Math.max(...goalkeeperStats.map(g => g.savePercentage), 0.01)
        return gkStats.games >= MIN_GAMES_DISPLAY ? Math.round(OVR_FLOOR + (gkStats.savePercentage / max) * OVR_RANGE) : null
    }, [goalkeeperStats, gkStats])

    const overall = (outfieldOverall ?? gkOverall) !== null
        ? Math.min(OVR_HARD_CAP, outfieldOverall ?? gkOverall!)
        : null

    const squadRank = useMemo(() => {
        if (player?.is_goalkeeper && gkStats) {
            const sorted = [...goalkeeperStats]
                .map(g => ({ id: g.player.id, score: g.savePercentage }))
                .sort((a, b) => b.score - a.score)
            const idx = sorted.findIndex(g => g.id === id)
            return idx >= 0 ? idx + 1 : null
        }
        if (playerStats) {
            const maxS = Math.max(...outfieldScores.map(o => o.score), 0.01)
            const sorted = outfieldScores
                .map(o => ({ id: o.id, ovr: Math.min(OVR_HARD_CAP, Math.round(OVR_FLOOR + (o.score / maxS) * OVR_RANGE)) }))
                .sort((a, b) => b.ovr - a.ovr)
            const idx = sorted.findIndex(o => o.id === id)
            return idx >= 0 ? idx + 1 : null
        }
        return null
    }, [player, gkStats, goalkeeperStats, playerStats, outfieldScores, id])

    const tier = (isInTots ? 'gold' : totwCount >= 2 ? 'silver' : 'base') as 'gold' | 'silver' | 'base'

    const futGkStats = useMemo(() => {
        if (!gkStats || gkStats.games < MIN_GAMES_DISPLAY) return null
        const gks = goalkeeperStats.filter(g => g.games >= MIN_GAMES_DISPLAY)
        const scale = (val: number, vals: number[]) => {
            const max = Math.max(...vals, 0.01)
            return Math.round(55 + (val / max) * 44)
        }
        const conScore = (g: typeof gkStats) => {
            const m = motmAppearances.get(g.player.id) ?? 0
            const t = totwAppearances.get(g.player.id) ?? 0
            return (m * 3 + t) / g.games
        }
        const maxGca = Math.max(...gks.map(g => g.goalsConcededPerGame), 0.01)
        const gcaScore = Math.round(55 + (1 - gkStats.goalsConcededPerGame / maxGca) * 44)
        return {
            SAV: { val: scale(gkStats.savePercentage, gks.map(g => g.savePercentage)), label: 'Save percentage' },
            RFX: { val: scale(gkStats.savesPerGame, gks.map(g => g.savesPerGame)), label: 'Saves per game' },
            CLN: { val: scale(gkStats.cleanSheetPercentage, gks.map(g => g.cleanSheetPercentage)), label: 'Clean sheet %' },
            GCA: { val: gcaScore, label: 'Goals conceded per game (lower is better)' },
            WIN: { val: scale(gkStats.win_rate, gks.map(g => g.win_rate)), label: 'Win rate %' },
            CON: { val: scale(conScore(gkStats), gks.map(conScore)), label: 'MOTM & TOTW frequency' },
        }
    }, [gkStats, goalkeeperStats, motmAppearances, totwAppearances])

    const plMatch = useMemo(() => {
        if (!player) return null
        const allMatches = computeAllPLMatches(stats, goalkeeperStats)
        const match = allMatches.get(player.id)
        return match ? { name: match.name, club: match.club, position: match.position } : null
    }, [player, stats, goalkeeperStats])

    const bestGame = useMemo(() => {
        if (gameBreakdown.length === 0) return null
        return gameBreakdown.reduce((best, g) =>
            g.goal_involvements > best.goal_involvements ? g : best,
        )
    }, [gameBreakdown])

    // ── Outfield game table sort ────────────────────────────────────────────────

    const [gameSortKey, setGameSortKey] = useState('date')
    const [gameSortDir, setGameSortDir] = useState<'asc' | 'desc'>('desc')

    function handleGameSort(key: string) {
        if (key === gameSortKey) setGameSortDir(d => d === 'desc' ? 'asc' : 'desc')
        else { setGameSortKey(key); setGameSortDir('desc') }
    }

    const sortedGameBreakdown = useMemo(() => {
        return [...gameBreakdown].sort((a, b) => {
            const dir = (v: number) => gameSortDir === 'desc' ? -v : v
            if (gameSortKey === 'date') return dir(new Date(a.game.date).getTime() - new Date(b.game.date).getTime())
            if (gameSortKey === 'result') {
                const gpA = gamePlayers.find(gp => gp.game_id === a.game.id && gp.player_id === id)
                const gpB = gamePlayers.find(gp => gp.game_id === b.game.id && gp.player_id === id)
                const rA = a.game.winning_team === null ? '—' : a.game.winning_team === 0 ? 'D' : a.game.winning_team === gpA?.team ? 'W' : 'L'
                const rB = b.game.winning_team === null ? '—' : b.game.winning_team === 0 ? 'D' : b.game.winning_team === gpB?.team ? 'W' : 'L'
                return dir((RESULT_VAL[rA] ?? -1) - (RESULT_VAL[rB] ?? -1))
            }
            if (gameSortKey === 'motm') {
                const aM = motmByGame.get(a.game.id)?.id === id ? 1 : 0
                const bM = motmByGame.get(b.game.id)?.id === id ? 1 : 0
                return dir(aM - bM)
            }
            const aVal = (a as unknown as Record<string, number>)[gameSortKey] ?? 0
            const bVal = (b as unknown as Record<string, number>)[gameSortKey] ?? 0
            return dir(aVal - bVal)
        })
    }, [gameBreakdown, gameSortKey, gameSortDir, gamePlayers, id, motmByGame])

    // ── GK game table sort ──────────────────────────────────────────────────────

    const [gkSortKey, setGkSortKey] = useState('date')
    const [gkSortDir, setGkSortDir] = useState<'asc' | 'desc'>('desc')

    function handleGkSort(key: string) {
        const lowerBetter = key === 'goalsConceded'
        if (key === gkSortKey) setGkSortDir(d => d === 'desc' ? 'asc' : 'desc')
        else { setGkSortKey(key); setGkSortDir(lowerBetter ? 'asc' : 'desc') }
    }

    const sortedGkGames = useMemo((): GKGameBreakdown[] => {
        return [...gkBreakdown].sort((a, b) => {
            const dir = (v: number) => gkSortDir === 'desc' ? -v : v
            if (gkSortKey === 'date') return dir(new Date(a.game.date).getTime() - new Date(b.game.date).getTime())
            if (gkSortKey === 'result') return dir((RESULT_VAL[a.result] ?? -1) - (RESULT_VAL[b.result] ?? -1))
            if (gkSortKey === 'cleanSheet') return dir((a.cleanSheet ? 1 : 0) - (b.cleanSheet ? 1 : 0))
            if (gkSortKey === 'svPct') return dir((a.svPct ?? -1) - (b.svPct ?? -1))
            return dir(((a as unknown as Record<string, number>)[gkSortKey] ?? 0) - ((b as unknown as Record<string, number>)[gkSortKey] ?? 0))
        })
    }, [gkBreakdown, gkSortKey, gkSortDir])

    return {
        loading,
        player,
        playerStats,
        gkStats,
        players,
        events,
        gamePlayers,
        stats,
        goalkeeperStats,
        isInTots,
        totwCount,
        motmCount,
        motmByGame,
        myAwards,
        overall,
        squadRank,
        tier,
        futStats,
        futGkStats,
        plMatch,
        bestGame,
        gameBreakdown,
        gkBreakdown,
        sortedGameBreakdown,
        gameSortKey,
        gameSortDir,
        handleGameSort,
        sortedGkGames,
        gkSortKey,
        gkSortDir,
        handleGkSort,
    }
}
