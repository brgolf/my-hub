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

const blogSources = {
  tistory: {
    url: 'https://brgolf.tistory.com/',
    parse: html => ({
      today: parseCount(html.match(/class="item-visit">\s*Today\s*:\s*([\d,]+)\s*</i)?.[1]),
      total: parseCount(html.match(/class="text-total">\s*([\d,]+)\s*</i)?.[1]),
    }),
  },
  naver: {
    url: 'https://m.blog.naver.com/yhjo0720',
    parse: html => ({
      today: parseCount(html.match(/"dayVisitorCount"\s*:\s*(\d+)/)?.[1]),
      total: parseCount(html.match(/"totalVisitorCount"\s*:\s*(\d+)/)?.[1]),
    }),
  },
}

function parseCount(value) {
  const count = Number(value?.replaceAll(',', ''))
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Visitor count not found')
  return count
}

async function getBlogCounts() {
  const sources = await Promise.all(Object.entries(blogSources).map(async ([id, source]) => {
    try {
      const response = await fetch(source.url, {
        next: { revalidate: 600 },
        headers: { Accept: 'text/html', 'Accept-Language': 'ko-KR,ko;q=0.9', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) throw new Error('Blog unavailable')
      return [id, source.parse(await response.text())]
    } catch {
      return [id, null]
    }
  }))
  return Response.json(Object.fromEntries(sources))
}

export async function GET(request) {
  if (new URL(request.url).searchParams.get('blogs') === '1') return getBlogCounts()
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
