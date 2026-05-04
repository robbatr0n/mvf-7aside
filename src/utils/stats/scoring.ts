import type { Event, PlayerStats } from '../../types'
import {
  GOAL_WEIGHT, ASSIST_WEIGHT, SOT_WEIGHT, KEY_PASS_WEIGHT,
  TACKLE_WEIGHT, INTERCEPTION_WEIGHT, WIN_RATE_WEIGHT, PASS_WEIGHT,
} from '../constants'

/** Per-game score from a player's event array.
 *  Used by TOTW selection, MOTM, game ratings, and LatestGameCard. */
export function calcGameScore(playerEvents: Event[]): number {
  const goals         = playerEvents.filter(e => e.event_type === 'goal').length
  const assists       = playerEvents.filter(e => e.event_type === 'assist').length
  const sot           = playerEvents.filter(e => e.event_type === 'shot_on_target').length
  const kp            = playerEvents.filter(e => e.event_type === 'key_pass').length
  const tackles       = playerEvents.filter(e => e.event_type === 'tackle').length
  const interceptions = playerEvents.filter(e => e.event_type === 'interception').length
  const passCompleted = playerEvents.filter(e => e.event_type === 'pass_completed').length
  const hasPass       = playerEvents.some(
    e => e.event_type === 'pass_completed' || e.event_type === 'pass_received' || e.event_type === 'pass_failed'
  )
  return (
    goals         * GOAL_WEIGHT +
    assists       * ASSIST_WEIGHT +
    sot           * SOT_WEIGHT +
    kp            * KEY_PASS_WEIGHT +
    tackles       * TACKLE_WEIGHT +
    interceptions * INTERCEPTION_WEIGHT +
    (hasPass ? passCompleted * PASS_WEIGHT : 0)
  )
}

/** Season-average score from PlayerStats.
 *  Used by TOTS selection and player OVR on the profile page. */
export function calcSeasonScore(s: PlayerStats): number {
  if (s.games_played === 0) return 0
  const passScore = s.games_with_passing > 0
    ? (s.passes_completed / s.games_with_passing) * PASS_WEIGHT
    : 0
  return (
    s.goals_per_game                      * GOAL_WEIGHT +
    (s.assists         / s.games_played)  * ASSIST_WEIGHT +
    (s.shots_on_target / s.games_played)  * SOT_WEIGHT +
    (s.key_passes      / s.games_played)  * KEY_PASS_WEIGHT +
    s.tackles_per_game                    * TACKLE_WEIGHT +
    s.interceptions_per_game              * INTERCEPTION_WEIGHT +
    (s.wins            / s.games_played)  * WIN_RATE_WEIGHT +
    passScore
  )
}
