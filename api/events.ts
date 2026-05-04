import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM events ORDER BY created_at ASC`
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const { game_id, player_id, event_type, related_event_id } = req.body as {
        game_id: string
        player_id: string
        event_type: string
        related_event_id?: string | null
      }
      const rows = await sql`
        INSERT INTO events (game_id, player_id, event_type, related_event_id)
        VALUES (${game_id}, ${player_id}, ${event_type}, ${related_event_id ?? null})
        RETURNING *
      `
      return res.status(201).json(rows[0])
    }

    if (req.method === 'DELETE') {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
      const relatedId = Array.isArray(req.query.related_event_id)
        ? req.query.related_event_id[0]
        : req.query.related_event_id

      if (id) {
        await sql`DELETE FROM events WHERE id = ${id}`
        return res.status(204).end()
      }
      if (relatedId) {
        await sql`DELETE FROM events WHERE related_event_id = ${relatedId}`
        return res.status(204).end()
      }
      return res.status(400).json({ error: 'id or related_event_id required' })
    }

    if (req.method === 'PATCH') {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
      const { clip_url } = req.body as { clip_url: string | null }
      await sql`UPDATE events SET clip_url = ${clip_url} WHERE id = ${id}`
      return res.status(200).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/events]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
