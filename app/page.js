'use client'

import { useEffect, useState } from 'react'
import Weather from './weather'
import GolfVideos from './golf-videos'

const storageKey = 'my-hub-v1'
const initial = {
  links: [
    { id: 'github', name: 'GitHub', url: 'https://github.com/' },
    { id: 'calendar', name: 'Google Calendar', url: 'https://calendar.google.com/' },
    { id: 'notion', name: 'Notion', url: 'https://www.notion.so/' },
  ],
  tasks: [],
  memo: '',
}

export default function Home() {
  const [data, setData] = useState(initial)
  const [date, setDate] = useState('')
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [addingLink, setAddingLink] = useState(false)
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    setDate(new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(new Date()))
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey))
      if (Array.isArray(saved?.links) && Array.isArray(saved.tasks) && typeof saved.memo === 'string') {
        setData(saved)
      }
    } catch {
      setMessage('저장된 데이터를 읽을 수 없습니다.')
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch {
      setMessage('이 브라우저에 변경사항을 저장할 수 없습니다.')
    }
  }, [data, ready])

  function addLink(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = fields.get('name').trim()
    const address = fields.get('address').trim()
    try {
      const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(address) ? address : 'https://' + address)
      if (!name || !['http:', 'https:'].includes(url.protocol)) throw new Error()
      const link = { id: crypto.randomUUID(), name, url: url.href }
      setData(current => ({ ...current, links: [...current.links, link] }))
      setAddingLink(false)
      setLinkError('')
    } catch {
      setLinkError('이름과 올바른 웹 주소를 입력하세요.')
    }
  }

  function addTask(event) {
    event.preventDefault()
    const form = event.currentTarget
    const title = new FormData(form).get('task').trim()
    if (!title) return
    const task = { id: crypto.randomUUID(), title, done: false }
    setData(current => ({ ...current, tasks: [...current.tasks, task] }))
    form.reset()
  }

  function removeItem(list, id) {
    setData(current => ({ ...current, [list]: current[list].filter(item => item.id !== id) }))
  }

  const completed = data.tasks.filter(task => task.done).length
  return (
    <>
      <header className="bar">
        <div className="shell brand"><span className="mark" aria-hidden="true">✦</span> my-hub</div>
      </header>
      <main className="shell">
        <section className="hero" aria-labelledby="welcome">
          <div className="hero-copy">
            <p>{date}</p>
            <h1 id="welcome">나의 시작 페이지</h1>
            <p>자주 찾는 곳과 오늘 챙길 일을 한눈에.</p>
          </div>
        </section>
        {message && <p role="status">{message}</p>}
        <div className="dashboard">
          <Weather />
          <GolfVideos />
          <section className="panel links" aria-labelledby="links-title">
            <div className="panel-head">
              <h2 id="links-title">즐겨찾기</h2>
              <button className="outline" type="button" disabled={!ready} aria-expanded={addingLink}
                onClick={() => { setAddingLink(!addingLink); setLinkError('') }}>
                {addingLink ? '닫기' : '+ 링크 추가'}
              </button>
            </div>
            {addingLink && (
              <form className="link-form" onSubmit={addLink}>
                <input name="name" aria-label="링크 이름" placeholder="이름" maxLength={60} required autoFocus />
                <input name="address" aria-label="웹 주소" placeholder="example.com" maxLength={2048} required />
                <button>저장</button>
                {linkError && <p role="alert">{linkError}</p>}
              </form>
            )}
            {data.links.length === 0 && <p className="hint">자주 쓰는 웹사이트를 추가해 보세요.</p>}
            <ul className="link-list">
              {data.links.map(link => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <span className="tile-icon" aria-hidden="true">{Array.from(link.name)[0].toUpperCase()}</span>
                    <span className="link-label"><strong>{link.name}</strong><small>{new URL(link.url).hostname}</small></span>
                    <span aria-hidden="true" className="arrow">↗</span>
                  </a>
                  <button className="remove" disabled={!ready} aria-label={link.name + ' 링크 삭제'}
                    onClick={() => removeItem('links', link.id)}>×</button>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel" aria-labelledby="tasks-title">
            <div className="panel-head">
              <h2 id="tasks-title">할 일</h2>
              <span className="count">{completed} / {data.tasks.length} 완료</span>
            </div>
            <form className="task-form" onSubmit={addTask}>
              <input name="task" aria-label="새 할 일" placeholder="새 할 일 적기" maxLength={160} required />
              <button disabled={!ready}>추가</button>
            </form>
            {data.tasks.length === 0 && <p className="hint">추가한 할 일이 여기에 표시됩니다.</p>}
            <ul className="task-list">
              {data.tasks.map(task => (
                <li key={task.id}>
                  <label>
                    <input type="checkbox" checked={task.done} disabled={!ready} onChange={event => {
                      const done = event.target.checked
                      setData(current => ({
                        ...current,
                        tasks: current.tasks.map(item => item.id === task.id ? { ...item, done } : item),
                      }))
                    }} />
                    <span>{task.title}</span>
                  </label>
                  <button className="remove" disabled={!ready} aria-label={task.title + ' 삭제'}
                    onClick={() => removeItem('tasks', task.id)}>×</button>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel" aria-labelledby="memo-title">
            <div className="panel-head"><h2 id="memo-title">빠른 메모</h2><span className="count">브라우저에 저장</span></div>
            <textarea aria-labelledby="memo-title" placeholder="기억해 두고 싶은 내용을 적어 보세요."
              maxLength={20000} disabled={!ready} value={data.memo} onChange={event => {
                const memo = event.target.value
                setData(current => ({ ...current, memo }))
              }} />
          </section>
        </div>
      </main>
    </>
  )
}
