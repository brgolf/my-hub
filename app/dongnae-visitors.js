'use client'

import { useEffect, useState } from 'react'

const number = new Intl.NumberFormat('ko-KR')

export default function DongnaeVisitors() {
  const [counts, setCounts] = useState(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/dongnae-visitors', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then(setCounts)
      .catch(() => { if (!controller.signal.aborted) setUnavailable(true) })
    return () => controller.abort()
  }, [])

  return (
    <span className="visitor-summary" role="status" title="동래 홈페이지 방문 브라우저 기준">
      <span>동래 홈페이지 방문자</span>
      {counts ? (
        <span className="visitor-stats">
          오늘 <strong>{number.format(counts.today)}명</strong>
          <span aria-hidden="true"> · </span>
          누적 <strong>{number.format(counts.total)}명</strong>
        </span>
      ) : <span>{unavailable ? '집계 데이터 없음' : '불러오는 중…'}</span>}
    </span>
  )
}
