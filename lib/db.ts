// lib/db.ts
//
// Shared Postgres client for Vercel serverless functions.
// Uses @neondatabase/serverless — the HTTP-based driver that works in
// Vercel's serverless/edge runtime without needing a persistent TCP
// connection pool (which serverless functions can't hold open anyway).
//
// Setup:
//   npm install @neondatabase/serverless
//   Set DATABASE_URL in Vercel project settings (Neon gives you this
//   connection string when you create the integration — Storage tab → Neon).

import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.'
  )
}

// `sql` is a tagged-template query function: sql`SELECT * FROM x WHERE id = ${id}`
// Values are automatically parameterized — never string-interpolate raw
// user input into a query manually.
export const sql = neon(connectionString)
