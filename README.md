# my-hub

즐겨찾기, 할 일, 메모를 한 화면에서 관리하는 Next.js App Router 기반 개인 포털입니다. 변경사항은 브라우저의 localStorage에 저장됩니다.

## 실행

```powershell
npm ci
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 프로덕션 빌드

```powershell
npm run build
npm start
```

## 골프 영상 일일 추천

저장소의 **Settings → Secrets and variables → Actions**에서 YouTube Data API v3가 활성화된 API 키를 저장소 시크릿 `YOUTUBE_API_KEY`로 등록합니다. 키를 소스나 커밋에 추가하지 마세요.

**Actions → Update golf recommendations → Run workflow**에서 첫 갱신을 실행할 수 있습니다. 이후 기본 브랜치에서 매일 한국 시간 오전 7시 17분에 실행되며, 조회수 10만 회 이상인 영상 10개로 목록을 갱신합니다. API 호출이 실패하면 직전 목록을 유지합니다. 사이트가 별도 호스팅에 배포되어 있다면 추천 파일이 갱신된 커밋에서 다시 빌드되어야 화면에 반영됩니다.
