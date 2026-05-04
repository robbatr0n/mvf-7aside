import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM game_players`
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const { rows: assignments } = req.body as {
        rows: Array<{ game_id: string; player_id: string; team: 1 | 2 }>
      }
      if (!assignments.length) return res.status(204).end()

      const gameIds = assignments.map((r) => r.game_id)
      const playerIds = assignments.map((r) => r.player_id)
      const teams = assignments.map((r) => r.team)

      await sql`
        INSERT INTO game_players (game_id, player_id, team)
        SELECT * FROM unnest(
          ${gameIds}::uuid[],
          ${playerIds}::uuid[],
          ${teams}::int[]
        )
      `
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/game-players]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
