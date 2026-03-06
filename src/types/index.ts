export type EventType =
  | 'goal'
  | 'assist'
  | 'shot_on_target'
  | 'shot_off_target'
  | 'key_pass'
  | 'tackle'
  | 'interception'

export interface Player {
  id: string
  name: string
  is_guest: boolean
  is_goalkeeper: boolean
  exclude_from_awards: boolean
  created_at: string
}

export interface GoalkeeperStats {
  player: Player
  games: number
  saves: number
  goalsConceded: number
  savePercentage: number
  cleanSheets: number
  goalsConcededPerGame: number
  wins: number
  losses: number
  draws: number
  form: ('W' | 'L' | 'D')[]
}

export interface Game {
  id: string
  date: string
  winning_team: number | null
  created_at: string
}

export interface GamePlayer {
  id: string
  game_id: string
  player_id: string
  team: 1 | 2
}

export interface Event {
  id: string
  game_id: string
  player_id: string
  event_type: EventType
  related_event_id: string | null
  team_override: number | null
  created_at: string
}

export interface PlayerStats {
  player: Player
  goals: number
  assists: number
  key_passes: number
  shots_on_target: number
  shots_off_target: number
  shot_accuracy: number
  shot_conversion: number
  goal_involvements: number
  games_played: number
  goals_per_game: number
  hat_tricks: number
  wins: number
  losses: number
  draws: number
  win_rate: number
  form: ('W' | 'L' | 'D')[]
  current_scoring_streak: number
  tackles: number
  interceptions: number
  defensive_actions: number
  tackles_per_game: number
  interceptions_per_game: number
}