'use client'

import { useEffect, useState } from 'react'

const forecast = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
  latitude: '35.205',
  longitude: '129.079',
  current: 'temperature_2m,weather_code',
  daily: 'temperature_2m_min,temperature_2m_max,precipitation_probability_max',
  timezone: 'Asia/Seoul',
  forecast_days: '1',
})

function condition(code) {
  if (code === 0) return '맑음'
  if (code <= 2) return '구름 조금'
  if (code === 3) return '흐림'
  if (code === 45 || code === 48) return '안개'
  if (code >= 95) return '뇌우'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '눈'
  if (code >= 51 && code <= 82) return '비'
  return '정보 없음'
}

const temperature = value => Number.isFinite(value) ? Math.round(value) + '°C' : '—'
const probability = value => Number.isFinite(value) ? value + '%' : '—'

export default function Weather() {
  const [weather, setWeather] = useState(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    let active = true

    fetch(forecast, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Forecast unavailable')
        return response.json()
      })
      .then(data => {
        if (!data.current || !data.daily) throw new Error('Incomplete forecast')
        if (active) setWeather(data)
      })
      .catch(() => { if (active) setFailed(true) })
      .finally(() => clearTimeout(timeout))

    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [attempt])

  return (
    <section className="panel weather" aria-labelledby="weather-title">
      <div className="panel-head">
        <h2 id="weather-title">부산 동래구 날씨</h2>
        <a className="count weather-source" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
      </div>
      {weather ? (
        <div className="weather-details">
          <div className="weather-current">
            <strong>{temperature(weather.current.temperature_2m)}</strong>
            <span>{Number.isFinite(weather.current.weather_code) ? condition(weather.current.weather_code) : '정보 없음'}</span>
          </div>
          <dl className="weather-metrics">
            <div><dt>오늘 최저</dt><dd>{temperature(weather.daily.temperature_2m_min?.[0])}</dd></div>
            <div><dt>오늘 최고</dt><dd>{temperature(weather.daily.temperature_2m_max?.[0])}</dd></div>
            <div><dt>최대 강수확률</dt><dd>{probability(weather.daily.precipitation_probability_max?.[0])}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="weather-details">
          <p className="hint" role="status">{failed ? '날씨 정보를 불러오지 못했습니다.' : '날씨를 불러오는 중…'}</p>
          {failed && <button className="outline" onClick={() => { setFailed(false); setAttempt(value => value + 1) }}>다시 시도</button>}
        </div>
      )}
    </section>
  )
}
