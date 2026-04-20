import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './lib/theme'
import { initAnalytics } from './lib/analytics'

initAnalytics()

// 动态导入失败时（通常是新部署后旧 chunk 文件不存在），自动刷新页面
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
