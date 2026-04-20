import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Share2, HelpCircle, Waves } from 'lucide-react'
import { fetchTopics, type Topic, type TopicCategory } from '../lib/api'

const categories: { key: TopicCategory; label: string; icon: typeof MessageSquare }[] = [
  { key: 'discussion', label: '讨论', icon: MessageSquare },
  { key: 'share', label: '分享', icon: Share2 },
  { key: 'question', label: '提问', icon: HelpCircle },
  { key: 'casual', label: '水贴', icon: Waves },
]

export default function ForumPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeCategory, setActiveCategory] = useState<TopicCategory | undefined>()
  const [sort, setSort] = useState<'latest' | 'hot'>('latest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await fetchTopics({ category: activeCategory, sort })
        setTopics(data)
      } catch {
        // empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCategory, sort])

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{color:'var(--c-ac)'}}>
          <MessageSquare size={20} />
          讨论
        </h1>
        <Link
          to="/forum/new"
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
        >
          + 发帖
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
          {categories.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? undefined : key)}
              className="flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap"
              style={activeCategory === key ? {
                background: 'rgba(110,231,247,0.1)',
                color: 'var(--c-ac)',
                border: '1px solid rgba(110,231,247,0.3)',
              } : {
                background: 'var(--c-bg-card)',
                color: 'var(--c-tx-s)',
                border: '1px solid var(--c-bd)',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setSort('latest')}
            className="px-3 py-1 text-sm rounded-full transition-colors"
            style={sort === 'latest' ? {
              background: 'rgba(110,231,247,0.12)',
              color: 'var(--c-ac)',
              border: '1px solid rgba(110,231,247,0.3)',
            } : {
              color: 'var(--c-tx-s)',
              border: '1px solid transparent',
            }}
          >
            最新
          </button>
          <button
            onClick={() => setSort('hot')}
            className="px-3 py-1 text-sm rounded-full transition-colors"
            style={sort === 'hot' ? {
              background: 'rgba(110,231,247,0.12)',
              color: 'var(--c-ac)',
              border: '1px solid rgba(110,231,247,0.3)',
            } : {
              color: 'var(--c-tx-s)',
              border: '1px solid transparent',
            }}
          >
            最热
          </button>
        </div>
      </div>

      {/* Topics */}
      {loading ? (
        <div className="text-center py-12" style={{color:'var(--c-tx-m)'}}>加载中...</div>
      ) : (
        <div className="space-y-2">
          {topics.map((t) => (
            <Link
              key={t.id}
              to={`/forum/${t.id}`}
              className="block p-4 rounded-xl transition-all"
              style={{
                background: 'var(--c-bg-card)',
                border: '1px solid var(--c-bd)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-bd-h)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--c-bg-card-h)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-bd)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--c-bg-card)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {t.is_pinned && <span className="text-xs" style={{color:'#fbbf24'}}>置顶</span>}
                    <span className="px-2 py-0.5 text-xs rounded-full" style={{background:'var(--c-glow)', color:'var(--c-tx-s)', border:'1px solid rgba(110,231,247,0.1)'}}>
                      {categories.find((c) => c.key === t.category)?.label}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm" style={{color:'var(--c-tx2)'}}>{t.title}</h3>
                  <p className="text-xs mt-1 line-clamp-2" style={{color:'var(--c-tx-s)'}}>{t.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs" style={{color:'var(--c-tx-m)'}}>
                <span>{t.author_nick}</span>
                <span>{new Date(t.created_at).toLocaleDateString('zh-CN')}</span>
                <span className="ml-auto flex items-center gap-1"><MessageSquare size={10} /> {t.comment_count}</span>
                <span className="flex items-center gap-1">{t.view_count} 浏览</span>
              </div>
            </Link>
          ))}
          {topics.length === 0 && (
            <div className="text-center py-12" style={{color:'var(--c-tx-d)'}}>
              <p>还没有帖子</p>
              <Link to="/forum/new" className="text-sm mt-2 inline-block" style={{color:'var(--c-ac)'}}>来做第一个发帖的人</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
