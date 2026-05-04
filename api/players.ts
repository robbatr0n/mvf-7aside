import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM players ORDER BY name`
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const { name, is_guest = false } = req.body as { name: string; is_guest?: boolean }
      const rows = await sql`
        INSERT INTO players (name, is_guest) VALUES (${name}, ${is_guest}) RETURNING *
      `
      return res.status(201).json(rows[0])
    }

    if (req.method === 'PATCH') {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
      const { name, is_guest } = req.body as { name: string; is_guest?: boolean }
      if (is_guest !== undefined) {
        await sql`UPDATE players SET name = ${name}, is_guest = ${is_guest} WHERE id = ${id}`
      } else {
        await sql`UPDATE players SET name = ${name} WHERE id = ${id}`
      }
      return res.status(200).end()
    }

    if (req.method === 'DELETE') {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
      await sql`DELETE FROM players WHERE id = ${id}`
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[api/players]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
