import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import ArticleListPage from './pages/ArticleListPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import ForumPage from './pages/ForumPage'
import ForumTopicPage from './pages/ForumTopicPage'
import NewTopicPage from './pages/NewTopicPage'
import ArchivePage from './pages/ArchivePage'
import { trackPageView } from './lib/analytics'

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
      <div className="min-h-screen flex flex-col bg-grid" style={{backgroundColor:'var(--c-bg)'}}>
        <Header />
        <main className="flex-1">
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
        </main>
        <footer className="border-t py-6 text-center text-xs" style={{borderColor:'var(--c-bd-s)', color:'var(--c-tx-m)'}}>
          <p>AI Pulse &copy; {new Date().getFullYear()} · 每周 AI 前沿情报</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}
