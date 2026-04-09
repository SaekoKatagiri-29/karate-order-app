export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? 'NOT SET'
  const token = process.env.TURSO_AUTH_TOKEN ?? 'NOT SET'

  const baseUrl = dbUrl
    .replace(/^libsql:\/\//, 'https://')
    .replace(/^file:.*/, '')

  if (!baseUrl) {
    return Response.json({ error: 'Local file DB - not applicable on Vercel' })
  }

  const results: Record<string, unknown> = {
    dbUrlPrefix: dbUrl.substring(0, 30) + '...',
    baseUrl,
  }

  // Test v2/pipeline
  try {
    const resp = await fetch(`${baseUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: 'SELECT 1' } },
          { type: 'close' },
        ],
      }),
    })
    const body = await resp.text()
    results.v2 = { status: resp.status, body: body.substring(0, 300) }
  } catch (e: unknown) {
    results.v2 = { error: e instanceof Error ? e.message : String(e) }
  }

  // Test v3-protobuf availability
  try {
    const resp = await fetch(`${baseUrl}/v3-protobuf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    results.v3check = { status: resp.status }
  } catch (e: unknown) {
    results.v3check = { error: e instanceof Error ? e.message : String(e) }
  }

  return Response.json(results)
}
