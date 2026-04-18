import type { Game, Player } from '../../types'

export interface GoalEntry {
    scorer: Player
    assister: Player | null
    team_override: number | null
}

export interface TeamStats {
    shots: number
    shotsOnTarget: number
    shotAccuracy: number
    shotConversion: number
    keyPasses: number
    tackles: number
    interceptions: number
}

export interface GameSummary {
    game: Game
    team1Players: Player[]
    team2Players: Player[]
    team1Goals: GoalEntry[]
    team2Goals: GoalEntry[]
    totalGoals: number
    team1Stats: TeamStats
    team2Stats: TeamStats
    motm: Player | null
}

export interface PlayerGameStats {
    game: Game
    goals: number
    assists: number
    key_passes: number
    shots_on_target: number
    shots_off_target: number
    goal_involvements: number
    tackles: number
    interceptions: number
}

export interface TeamOfTheSeasonPlayer {
    player: Player
    score: number
    role: 'goalkeeper' | 'outfield'
}

export interface TeamOfTheSeason {
    goalkeeper: TeamOfTheSeasonPlayer | null
    outfield: TeamOfTheSeasonPlayer[]
}