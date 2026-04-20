import { useEffect, useState } from 'react'
import { useParams, useLocation, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { fetchLatestEdition, fetchEditions, fetchArticles, type Article, type Edition, type Region, type Tier } from '../lib/api'
import TierSwitch from '../components/TierSwitch'
import ArticleCard from '../components/ArticleCard'

const tierLabel: Record<string, string> = {
  brief: '速览',
  deep: '阵营深读',
  analysis: '单条深析',
}

export default function ArticleListPage() {
  const { tier } = useParams<{ tier: Tier }>()
  const location = useLocation()
  const region: Region = location.pathname.startsWith('/overseas') ? 'overseas' : 'domestic'
  const [edition, setEdition] = useState<Edition | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const [searchParams] = useSearchParams()
  const editionIdParam = searchParams.get('edition')

  const regionLabel = region === 'overseas' ? '海外' : '国内'
  const regionColor = region === 'overseas' ? '#38bdf8' : '#f472b6'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let ed: Edition | null
        if (editionIdParam) {
          // From archive: use the specified edition
          const all = await fetchEditions()
          ed = all.find(e => e.id === editionIdParam) || null
        } else {
          // Normal view: use latest edition
          ed = await fetchLatestEdition()
        }
        setEdition(ed)
        if (ed && tier) {
          const data = await fetchArticles({ edition_id: ed.id, region, tier })
          setArticles(data)
        }
      } catch {
        // empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [region, tier, editionIdParam])

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* 面包屑 + 标题 + 期号 */}
      <div className="flex items-center gap-2 text-sm mb-3">
        <Link
          to="/"
          className="flex items-center gap-1 transition-colors"
          style={{color:'var(--c-tx-m)'}}
          onMouseEnter={e => (e.currentTarget.style.color='var(--c-ac)')}
          onMouseLeave={e => (e.currentTarget.style.color='var(--c-tx-m)')}
        >
          <ChevronLeft size={14} />
          首页
        </Link>
      </div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg sm:text-xl font-bold" style={{color: regionColor}}>
          {regionLabel} · 往期回顾
        </h1>
        {edition && (
          <span className="text-xs" style={{color:'var(--c-tx-m)'}}>
            第 {edition.number} 期 · {edition.date}
          </span>
        )}
      </div>

      {/* 三级 Tab 切换 */}
      <div className="mb-6">
        <TierSwitch region={region} active={tier || 'brief'} />
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="text-center py-12" style={{color:'var(--c-tx-m)'}}>加载中...</div>
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
          {articles.length === 0 && (
            <div className="text-center py-12" style={{color:'var(--c-tx-m)'}}>
              <p>今日暂无{regionLabel}{tierLabel[tier || 'brief']}内容</p>
              <p className="text-sm mt-2" style={{color:'var(--c-tx-d)'}}>内容每天由 AI 自动更新，敬请期待</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
