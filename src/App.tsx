import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import Header from './components/Header'
import { trackPageView } from './lib/analytics'

// 路由级懒加载，减小首屏 JS bundle
const HomePage = lazy(() => import('./pages/HomePage'))
const ArticleListPage = lazy(() => import('./pages/ArticleListPage'))
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'))
const ForumPage = lazy(() => import('./pages/ForumPage'))
const ForumTopicPage = lazy(() => import('./pages/ForumTopicPage'))
const NewTopicPage = lazy(() => import('./pages/NewTopicPage'))
const ArchivePage = lazy(() => import('./pages/ArchivePage'))

/** 监听路由变化并上报 PV，必须在 BrowserRouter 内部使用 */
function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
        <div className="min-h-screen flex flex-col bg-grid overflow-x-hidden" style={{backgroundColor:'var(--c-bg)'}}>        <Header />
        <main className="flex-1">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/overseas/:tier" element={<ArticleListPage />} />
              <Route path="/domestic/:tier" element={<ArticleListPage />} />
              <Route path="/:region/:tier/:id" element={<ArticleDetailPage />} />
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/forum/new" element={<NewTopicPage />} />
              <Route path="/forum/:id" element={<ForumTopicPage />} />
              <Route path="/archive" element={<ArchivePage />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="border-t py-6 text-center text-xs" style={{borderColor:'var(--c-bd-s)', color:'var(--c-tx-m)'}}>
          <p>AI Pulse &copy; {new Date().getFullYear()} · 每周 AI 前沿情报</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}
