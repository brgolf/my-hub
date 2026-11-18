import { readFile, writeFile } from 'node:fs/promises'

const key = process.env.YOUTUBE_API_KEY
if (!key) throw new Error('Set the YOUTUBE_API_KEY repository secret before running this workflow.')

const output = new URL('../app/golf-videos.json', import.meta.url)
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())
const previous = JSON.parse(await readFile(output, 'utf8'))
if (previous.date === date && previous.videos.length === 10) {
  console.log('Today’s recommendations are already available.')
  process.exit(0)
}

async function youtube(resource, params) {
  const url = new URL('https://www.googleapis.com/youtube/v3/' + resource)
  url.search = new URLSearchParams(params)
  let response
  try {
    response = await fetch(url, {
      headers: { 'X-Goog-Api-Key': key },
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new Error('Could not connect to YouTube Data API.')
  }
  if (!response.ok) throw new Error('YouTube Data API returned HTTP ' + response.status)
  return response.json()
}

const searches = await Promise.all(['골프 레슨', '골프 스윙', '골프 경기 하이라이트'].map(q =>
  youtube('search', {
    part: 'id',
    type: 'video',
    order: 'viewCount',
    maxResults: '25',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    q,
  })
))
const ids = [...new Set(searches.flatMap(result => result.items.map(item => item.id.videoId)))]

const batches = []
for (let start = 0; start < ids.length; start += 50) {
  batches.push(youtube('videos', {
    part: 'snippet,statistics',
    id: ids.slice(start, start + 50).join(','),
  }))
}

const candidates = (await Promise.all(batches))
  .flatMap(result => result.items)
  .map(video => ({
    id: video.id,
    title: video.snippet.title,
    views: Number(video.statistics.viewCount),
  }))
  .filter(video => Number.isSafeInteger(video.views) && video.views >= 100000)
  .sort((a, b) => b.views - a.views || a.id.localeCompare(b.id))
  .slice(0, 50)

if (candidates.length < 10) {
  throw new Error('Fewer than 10 eligible videos found. The previous list is preserved.')
}

// Prefer videos absent from the previous list, then fill any remaining slots by views.
const previousIds = new Set(previous.videos.map(video => video.id))
const fresh = candidates.filter(video => !previousIds.has(video.id))
const repeats = candidates.filter(video => previousIds.has(video.id))
const videos = [...fresh, ...repeats].slice(0, 10).sort((a, b) => b.views - a.views)
await writeFile(output, JSON.stringify({ date, videos }, null, 2) + '\n')
console.log('Updated 10 golf recommendations for ' + date)
