import { Link } from 'react-router-dom'
import { ThumbsUp, Microscope } from 'lucide-react'
import type { Article } from '../lib/api'

interface Props {
  article: Article
}

const regionLabel = { overseas: '海外', domestic: '国内' }
const tierLabel = { brief: '速览', deep: '深读', analysis: '深析' }
const tierStyle = {
  brief: { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' },
  deep: { background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' },
  analysis: { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' },
}

export default function ArticleCard({ article }: Props) {
  const tier = article.tier as keyof typeof tierStyle
  const style = tierStyle[tier] || tierStyle.brief
  const label = tierLabel[tier] || article.tier
  return (
    <Link
      to={`/${article.region}/${article.tier}/${article.id}`}
      className="block p-4 rounded-xl transition-all group"
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
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 text-xs rounded-md font-medium flex items-center gap-1" style={style}>
          {tier === 'analysis' && <Microscope size={10} />}
          {label}
        </span>
        <span className="text-xs" style={{color:'var(--c-tx-m)'}}>
          {regionLabel[article.region]}
        </span>
        {article.tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="px-2 py-0.5 text-xs rounded-md" style={{
            background: 'var(--c-glow)',
            color: 'var(--c-tx-s)',
            border: '1px solid rgba(110,231,247,0.1)',
          }}>
            {tag}
          </span>
        ))}
      </div>
      <h3 className="font-medium mb-1 line-clamp-2 text-sm" style={{color:'var(--c-tx2)'}}>{article.title}</h3>
      <p className="text-xs line-clamp-2" style={{color:'var(--c-tx-s)'}}>
        {(article.summary || '').replace(/\s*[—–-]\s*\[[^\]]+\]\([^)]*\)(\s*[｜|]\s*\[→[^\]]*\]\([^)]*\))*/g, '').replace(/\s*[｜|]\s*\[→[^\]]*\]\([^)]*\)/g, '').replace(/\[→[^\]]*\]\([^)]*\)/g, '').trim()}
      </p>
      <div className="flex items-center gap-3 mt-3 text-xs" style={{color:'var(--c-tx-m)'}}>
        <span>{article.source_name}</span>
        <span>{new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
        <span className="ml-auto flex items-center gap-1">
          <ThumbsUp size={10} />
          {article.reactions?.like || 0}
        </span>
      </div>
    </Link>
  )
}
