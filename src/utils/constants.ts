// Scoring weights — shared across TOTW, MOTM, game ratings, TOTS, and player OVR
export const GOAL_WEIGHT         = 4
export const ASSIST_WEIGHT       = 2.5
export const SOT_WEIGHT          = 0.5
export const KEY_PASS_WEIGHT     = 0.5
export const TACKLE_WEIGHT       = 1
export const INTERCEPTION_WEIGHT = 1
export const WIN_RATE_WEIGHT     = 2   // season formula only
export const PASS_WEIGHT         = 0.2

// OVR scale
export const OVR_FLOOR    = 65
export const OVR_RANGE    = 26
export const OVR_MAX      = 91  // ceiling before any manual boost
export const OVR_HARD_CAP = 99

// Per-game rating curve caps (score → 0–10 via √ curve)
export const TOTW_CAP = 65
export const TOTS_CAP = 40

// Eligibility thresholds
export const MIN_GAMES_DISPLAY     = 3   // minimum games to show stats on profile
export const MIN_GAMES_COHORT      = 5   // minimum games to enter ranking cohort
export const MIN_SHOTS             = 5   // minimum shots for shot accuracy to display
export const MIN_SHOTS_LEADERBOARD = 10  // minimum shots for season shot profile
export const MIN_PASS_ATTEMPTS     = 15  // minimum pass attempts for accuracy awards

// Re-exported for awards module compatibility
export const MIN_GAMES = MIN_GAMES_DISPLAY
