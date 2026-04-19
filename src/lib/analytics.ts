import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com'

/**
 * 初始化 PostHog 埋点。
 * 仅在配置了 VITE_POSTHOG_KEY 时才会真正初始化，开发环境未配置时静默跳过。
 */
export function initAnalytics() {
  if (!POSTHOG_KEY) {
    console.info('[Analytics] VITE_POSTHOG_KEY 未配置，埋点已跳过')
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // 关闭自动页面访问追踪，由路由监听手动上报，避免 SPA 重复计算
    capture_pageview: false,
    // 尊重用户的 DNT 设置
    respect_dnt: true,
    // 持久化用户标识到 localStorage
    persistence: 'localStorage',
  })
}

/**
 * 上报页面访问事件（PV）。
 * 在路由变化时调用，传入当前路径。
 */
export function trackPageView(path: string) {
  if (!POSTHOG_KEY) return
  posthog.capture('$pageview', { $current_url: window.location.origin + path })
}

/**
 * 上报自定义事件。
 * @param eventName 事件名称，建议使用 snake_case，如 'article_clicked'
 * @param properties 附加属性，如文章 ID、标题等
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return
  posthog.capture(eventName, properties)
}

export { posthog }
