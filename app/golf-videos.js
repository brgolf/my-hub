const golfVideos = [
  { id: '1ye3ibMLPmM', title: '어프로치 거리 조절과 연습법', views: 899535 },
  { id: 'CU5gTfg_8hI', title: '임진한의 아이언 정타를 위한 두 가지 방법', views: 207535 },
]

const formatViews = new Intl.NumberFormat('ko-KR')

export default function GolfVideos() {
  return (
    <section className="panel golf-videos" aria-labelledby="golf-videos-title">
      <div className="panel-head">
        <h2 id="golf-videos-title">인기 골프 영상</h2>
        <span className="count">조회수 10만 회 이상 · 확인 당시 기준</span>
      </div>
      <ul className="golf-video-list">
        {golfVideos.filter(video => video.views >= 100000).map(video => (
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
