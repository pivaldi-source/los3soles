import { neon } from '@neondatabase/serverless'

export default async () => {
  const sql = neon(process.env.NEON_DATABASE_URL)
  const rows = await sql`SELECT * FROM investors ORDER BY investment_amount DESC`
  return Response.json(rows)
}

export const config = { path: '/api/investors' }
