import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM games ORDER BY date DESC`
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const { date } = req.body as { date: string }
      const rows = await sql`INSERT INTO games (date) VALUES (${date}) RETURNING *`
      return res.status(201).json(rows[0])
    }

    if (req.method === 'PATCH') {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
      const { winning_team } = req.body as { winning_team: number }
      await sql`UPDATE games SET winning_team = ${winning_team} WHERE id = ${id}`
      return res.status(200).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/games]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
