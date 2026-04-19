import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Cpu, MessageSquare, ArrowRight, Zap, ChevronRight } from 'lucide-react'
import { fetchLatestEdition, fetchArticles, fetchTopics, type Article, type Topic } from '../lib/api'
import ArticleCard from '../components/ArticleCard'

export default function HomePage() {
  const [overseasBrief, setOverseasBrief] = useState<Article[]>([])
  const [domesticBrief, setDomesticBrief] = useState<Article[]>([])
  const [hotTopics, setHotTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const ed = await fetchLatestEdition()
        if (ed) {
          const [ob, db] = await Promise.all([
            fetchArticles({ edition_id: ed.id, region: 'overseas', tier: 'brief' }),
            fetchArticles({ edition_id: ed.id, region: 'domestic', tier: 'brief' }),
          ])
          setOverseasBrief(ob)
          setDomesticBrief(db)
        }
        const topics = await fetchTopics({ sort: 'hot' })
        setHotTopics(topics.slice(0, 5))
      } catch {
        // Will show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-2 py-20" style={{color:'var(--c-tx-m)'}}>
          <Zap size={16} className="animate-pulse" style={{color:'var(--c-ac)'}} />
          <span>正在获取最新情报...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Hero */}
      <div className="relative text-center py-10 sm:py-16 mb-6 sm:mb-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(110,231,247,0.06) 0%, transparent 70%)'
        }} />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-64 h-64 rounded-full border opacity-5 animate-ping" style={{borderColor:'var(--c-ac)', animationDuration:'3s'}}></div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(110,231,247,0.2), rgba(167,139,250,0.2))',
                border: '1px solid rgba(110,231,247,0.3)',
              }}>
                <Zap size={18} style={{color:'var(--c-ac)'}} />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{backgroundColor:'#34d399'}}></span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-widest" style={{
              background: 'linear-gradient(135deg, #6ee7f7, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>AI PULSE</h1>
          </div>

          <p className="text-base sm:text-lg font-medium mb-2" style={{color:'var(--c-tx3)'}}>
            感受 AI 行业的心跳
          </p>
          <p className="text-sm" style={{color:'var(--c-tx-m)'}}>每周前沿情报 &nbsp;·&nbsp; 3 分钟速览 + 深度阵营解读</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 海外 */}
        <div>
          <Link to="/overseas/brief" className="flex items-center justify-between mb-4 group">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                background: 'rgba(56,189,248,0.12)',
                border: '1px solid rgba(56,189,248,0.25)',
              }}>
                <Globe size={14} style={{color:'#38bdf8'}} />
              </div>
              <h2 className="text-sm font-semibold tracking-wide" style={{color:'#38bdf8'}}>海外动态</h2>
            </div>
            <span className="flex items-center gap-1 text-xs transition-colors" style={{color:'var(--c-tx-m)'}}>
              查看全部 <ChevronRight size={12} />
            </span>
          </Link>
          <div className="space-y-2">
            {overseasBrief.slice(0, 5).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
            {overseasBrief.length === 0 && (
              <p className="text-center py-10 text-sm" style={{color:'var(--c-tx-d)'}}>今日暂无海外动态</p>
            )}
          </div>
        </div>

        {/* 国内 */}
        <div>
          <Link to="/domestic/brief" className="flex items-center justify-between mb-4 group">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                background: 'rgba(244,114,182,0.12)',
                border: '1px solid rgba(244,114,182,0.25)',
              }}>
                <Cpu size={14} style={{color:'#f472b6'}} />
              </div>
              <h2 className="text-sm font-semibold tracking-wide" style={{color:'#f472b6'}}>国内动态</h2>
            </div>
            <span className="flex items-center gap-1 text-xs transition-colors" style={{color:'var(--c-tx-m)'}}>
              查看全部 <ChevronRight size={12} />
            </span>
          </Link>
          <div className="space-y-2">
            {domesticBrief.slice(0, 5).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
            {domesticBrief.length === 0 && (
              <p className="text-center py-10 text-sm" style={{color:'var(--c-tx-d)'}}>今日暂无国内动态</p>
            )}
          </div>
        </div>
      </div>

      {/* 热门讨论 */}
      {hotTopics.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                background: 'var(--c-glow)',
                border: '1px solid var(--c-glow-bd)',
              }}>
                <MessageSquare size={14} style={{color:'var(--c-ac)'}} />
              </div>
              <h2 className="text-sm font-semibold tracking-wide" style={{color:'var(--c-ac)'}}>热门讨论</h2>
            </div>
            <Link to="/forum" className="flex items-center gap-1 text-xs" style={{color:'var(--c-tx-m)'}}
              onMouseEnter={e => (e.currentTarget.style.color='var(--c-ac)')}
              onMouseLeave={e => (e.currentTarget.style.color='var(--c-tx-m)')}
            >
              更多 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {hotTopics.map((t) => (
              <Link
                key={t.id}
                to={`/forum/${t.id}`}
                className="block p-3 rounded-xl transition-all"
                style={{
                  background: 'var(--c-bg-card)',
                  border: '1px solid var(--c-bd)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-bd-h)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--c-shadow)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-bd)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                <h4 className="text-sm font-medium line-clamp-2" style={{color:'var(--c-tx2)'}}>{t.title}</h4>
                <div className="flex items-center gap-2 mt-2 text-xs" style={{color:'var(--c-tx-m)'}}>
                  <span>{t.author_nick}</span>
                  <span>·</span>
                  <MessageSquare size={10} />
                  <span>{t.comment_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
