import { neon } from '@neondatabase/serverless'

export default async (req) => {
  const sql = neon(process.env.NEON_DATABASE_URL)

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM transactions ORDER BY created_at ASC`
    return Response.json(rows)
  }

  if (req.method === 'POST') {
    const { type, product_type, quantity, unit_price, total_price, notes } = await req.json()
    const [row] = await sql`
      INSERT INTO transactions (type, product_type, quantity, unit_price, total_price, notes)
      VALUES (${type}, ${product_type}, ${quantity}, ${unit_price}, ${total_price}, ${notes ?? null})
      RETURNING *`
    return Response.json(row)
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config = { path: '/api/transactions' }
