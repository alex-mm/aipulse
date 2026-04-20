import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Cpu, Zap, ChevronRight, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { fetchLatestEdition, fetchArticles, type Article, type Edition } from '../lib/api'

type RegionTab = 'overseas' | 'domestic'

/** 复用 ArticleDetailPage 的内容清洗逻辑：去掉 h1、blockquote meta、导航链接、斜体注释、emoji */
function cleanArticleContent(content: string): { cleanContent: string; readingMeta: string } {
  const lines = content.split('\n')
  let idx = 0
  const metaParts: string[] = []

  while (idx < lines.length && lines[idx].trim() === '') idx++
  if (idx < lines.length && /^#\s+/.test(lines[idx].trim())) idx++
  while (idx < lines.length && lines[idx].trim() === '') idx++
  while (idx < lines.length && lines[idx].trim().startsWith('>')) {
    const part = lines[idx].trim().replace(/^>\s*/, '').replace(/&nbsp;/g, ' ').trim()
    if (part) metaParts.push(part)
    idx++
  }
  while (idx < lines.length && lines[idx].trim() === '') idx++

  const contentLines = lines.slice(idx).filter(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) return false
    if (/\[[\s→←][^\]]*\]\([^)]*\)/.test(trimmed) && /返回|速报|速览|分类|解读|列表/.test(trimmed)) return false
    return true
  })

  const normalizedLines = contentLines.map(line => {
    const blockquoteListMatch = line.match(/^>\s*(-|\*|\d+\.)\s+(.*)$/)
    if (blockquoteListMatch) return `${blockquoteListMatch[1]} ${blockquoteListMatch[2]}`
    return line
  })

  const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}]/gu
  const cleanContent = normalizedLines.join('\n').replace(emojiRegex, '').replace(/^\s+/gm, match => match.replace(/ +/, ' '))
  const readingMeta = metaParts.join('\n').replace(emojiRegex, '').trim()

  return { cleanContent, readingMeta }
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<RegionTab>('overseas')
  const [edition, setEdition] = useState<Edition | null>(null)
  const [overseasArticle, setOverseasArticle] = useState<Article | null>(null)
  const [domesticArticle, setDomesticArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const ed = await fetchLatestEdition()
        if (ed) {
          setEdition(ed)
          const [ob, db] = await Promise.all([
            fetchArticles({ edition_id: ed.id, region: 'overseas', tier: 'brief' }),
            fetchArticles({ edition_id: ed.id, region: 'domestic', tier: 'brief' }),
          ])
          setOverseasArticle(ob[0] || null)
          setDomesticArticle(db[0] || null)
        }
      } catch {
        // show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const currentArticle = activeTab === 'overseas' ? overseasArticle : domesticArticle

  const { cleanContent, readingMeta } = useMemo(() => {
    if (!currentArticle) return { cleanContent: '', readingMeta: '' }
    return cleanArticleContent(currentArticle.content)
  }, [currentArticle])

  const editionLabel = useMemo(() => {
    if (!edition) return ''
    const num = edition.number ?? ''
    const date = edition.date ? new Date(edition.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : ''
    return num ? `第 ${num} 期 · ${date}` : date
  }, [edition])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-2 py-20" style={{color:'var(--c-tx-m)'}}>
          <Zap size={16} className="animate-pulse" style={{color:'var(--c-ac)'}} />
          <span>正在获取最新情报...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

      {/* Tab 切换：海外 / 国内 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{
          background: 'var(--c-bg-card)',
          border: '1px solid var(--c-bd)',
        }}>
          <button
            onClick={() => setActiveTab('overseas')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={activeTab === 'overseas' ? {
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
            } : {
              color: 'var(--c-tx-m)',
              border: '1px solid transparent',
            }}
          >
            <Globe size={13} />
            海外动态
          </button>
          <button
            onClick={() => setActiveTab('domestic')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={activeTab === 'domestic' ? {
              background: 'rgba(244,114,182,0.15)',
              color: '#f472b6',
              border: '1px solid rgba(244,114,182,0.3)',
            } : {
              color: 'var(--c-tx-m)',
              border: '1px solid transparent',
            }}
          >
            <Cpu size={13} />
            国内动态
          </button>
        </div>

        {/* 期号 + 往期回顾 */}
        <div className="flex items-center gap-3">
          {editionLabel && (
            <span className="text-xs" style={{color:'var(--c-tx-d)'}}>{editionLabel}</span>
          )}
          <Link
            to={`/${activeTab}/brief`}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{color:'var(--c-tx-m)'}}
            onMouseEnter={e => (e.currentTarget.style.color='var(--c-ac)')}
            onMouseLeave={e => (e.currentTarget.style.color='var(--c-tx-m)')}
          >
            <Clock size={11} />
            往期回顾
            <ChevronRight size={11} />
          </Link>
        </div>
      </div>

      {/* 速览内容 */}
      {currentArticle ? (
        <div>
          {/* 文章标题 */}
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{color:'var(--c-tx)'}}>
            {currentArticle.title.replace(/\s*[|｜]\s*.+$/, '').trim()}
          </h1>

          {/* meta 信息（时间周期 / 来源等） */}
          {readingMeta && (
            <div className="mb-4">
              {readingMeta.split('\n')
                .filter(line => !line.includes('时间窗口'))
                .map((line, i) => (
                  <p key={i} className="text-xs leading-relaxed" style={{color:'var(--c-tx-d)'}}>{line}</p>
                ))}
            </div>
          )}

          {/* Markdown 正文 */}
          <div className="prose-dark">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>

          {/* 底部：查看深度解读入口 */}
          <div className="mt-8 pt-6 flex items-center justify-between" style={{borderTop:'1px solid var(--c-bd)'}}>
            <Link
              to={`/${activeTab}/brief/${currentArticle.id}`}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{color:'var(--c-ac)'}}
              onMouseEnter={e => (e.currentTarget.style.opacity='0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity='1')}
            >
              查看完整页面（含深度解读入口）
              <ChevronRight size={14} />
            </Link>
            <Link
              to={`/${activeTab}/brief`}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{color:'var(--c-tx-m)'}}
              onMouseEnter={e => (e.currentTarget.style.color='var(--c-ac)')}
              onMouseLeave={e => (e.currentTarget.style.color='var(--c-tx-m)')}
            >
              <Clock size={11} />
              往期回顾
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-sm mb-3" style={{color:'var(--c-tx-d)'}}>
            暂无{activeTab === 'overseas' ? '海外' : '国内'}速览内容
          </p>
          <Link
            to={`/${activeTab}/brief`}
            className="text-xs"
            style={{color:'var(--c-ac)'}}
          >
            查看往期回顾
          </Link>
        </div>
      )}
    </div>
  )
}
