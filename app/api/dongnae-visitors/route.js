const dongnaeOrigin = 'https://brgolf.github.io'
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
const visitorIdPattern = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', dateStyle: 'short' })
const cors = { 'Access-Control-Allow-Origin': dongnaeOrigin }
const unavailable = { error: 'Visitor counts are unavailable' }

function visitorKeys() {
  const date = dateFormatter.format(new Date())
  return ['dongnae:visitors:' + date, 'dongnae:visitors:total']
}

async function redis(commands) {
  if (!redisUrl || !redisToken) throw new Error('Missing Redis configuration')
  const response = await fetch(new URL('/multi-exec', redisUrl), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + redisToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error('Redis request failed')
  const results = await response.json()
  if (!Array.isArray(results) || results.length !== commands.length || results.some(item => item.error)) {
    throw new Error('Redis command failed')
  }
  return results.map(item => item.result)
}

export async function GET() {
  const [dailyKey, totalKey] = visitorKeys()
  try {
    const [today, total] = await redis([['SCARD', dailyKey], ['SCARD', totalKey]])
    return Response.json({ today, total }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json(unavailable, { status: 503 })
  }
}

export function OPTIONS(request) {
  if (request.headers.get('origin') !== dongnaeOrigin) return new Response(null, { status: 403 })
  return new Response(null, {
    status: 204,
    headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
  })
}

export async function POST(request) {
  if (request.headers.get('origin') !== dongnaeOrigin) return new Response(null, { status: 403 })
  const body = await request.text()
  if (!visitorIdPattern.test(body)) return new Response(null, { status: 400, headers: cors })

  const [dailyKey, totalKey] = visitorKeys()
  try {
    await redis([
      ['SADD', dailyKey, body],
      ['EXPIRE', dailyKey, 172800],
      ['SADD', totalKey, body],
    ])
    return new Response(null, { status: 204, headers: cors })
  } catch {
    return Response.json(unavailable, { status: 503, headers: cors })
  }
}
