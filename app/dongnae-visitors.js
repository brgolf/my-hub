'use client'

import { useEffect, useState } from 'react'

const number = new Intl.NumberFormat('ko-KR')
const blogs = [
  { id: 'tistory', label: '티스토리', href: 'https://brgolf.tistory.com/' },
  { id: 'naver', label: '네이버 블로그', href: 'https://blog.naver.com/yhjo0720' },
]

function Summary({ label, href, counts, loading }) {
  return (
    <span className="visitor-summary" role="status">
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{label}</a> : <span>{label}</span>}
      {counts ? (
        <span className="visitor-stats">
          오늘 <strong>{number.format(counts.today)}명</strong>
          <span aria-hidden="true"> · </span>
          누적 <strong>{number.format(counts.total)}명</strong>
        </span>
      ) : <span>{loading ? '불러오는 중…' : '집계 데이터 없음'}</span>}
    </span>
  )
}

export default function DongnaeVisitors() {
  const [dongnae, setDongnae] = useState(undefined)
  const [blogCounts, setBlogCounts] = useState(undefined)

  useEffect(() => {
    const controller = new AbortController()
    for (const [path, setCounts] of [
      ['/api/dongnae-visitors', setDongnae],
      ['/api/dongnae-visitors?blogs=1', setBlogCounts],
    ]) {
      fetch(path, { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw new Error('Counts unavailable')
          return response.json()
        })
        .then(setCounts)
        .catch(() => { if (!controller.signal.aborted) setCounts(null) })
    }
    return () => controller.abort()
  }, [])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <Summary label="동래 홈페이지 방문자" counts={dongnae} loading={dongnae === undefined} />
      {blogs.map(blog => (
        <Summary key={blog.id} label={blog.label} href={blog.href} counts={blogCounts?.[blog.id]} loading={blogCounts === undefined} />
      ))}
    </div>
  )
}
