import recommendations from './golf-videos.json'

const formatViews = new Intl.NumberFormat('ko-KR')

export default function GolfVideos() {
  return (
    <section className="panel golf-videos" aria-labelledby="golf-videos-title">
      <div className="panel-head">
        <h2 id="golf-videos-title">인기 골프 영상</h2>
        <span className="count">조회수 10만 회 이상 · {recommendations.date ? recommendations.date + ' 갱신' : '초기 추천'}</span>
      </div>
      <ul className="golf-video-list">
        {recommendations.videos.filter(video => video.views >= 100000).slice(0, 12).map(video => (
          <li key={video.id}>
            <a href={'https://www.youtube.com/watch?v=' + video.id} target="_blank" rel="noopener noreferrer">
              <img src={'https://i.ytimg.com/vi/' + video.id + '/mqdefault.jpg'} alt="" width="320" height="180" loading="lazy" />
              <span className="golf-video-copy">
                <strong>{video.title}</strong>
                <small>조회수 {formatViews.format(video.views)}회</small>
              </span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
