import './globals.css'

export const metadata = {
  title: 'my-hub · 나의 시작 페이지',
  description: '즐겨찾기, 할 일, 메모를 모아보는 개인 포털',
}

export default function RootLayout({ children }) {
  return <html lang="ko"><body>{children}</body></html>
}
