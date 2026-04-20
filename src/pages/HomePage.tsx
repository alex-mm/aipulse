import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Cpu, Zap, ChevronRight, Clock, BookOpen, Microscope } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { fetchLatestEdition, fetchArticles, fetchArticleWithContext, type Article, type Edition } from '../lib/api'

type RegionTab = 'overseas' | 'domestic'

/** 从 React children 递归提取纯文本 */
function extractText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

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
    // 只过滤整行都是导航链接的行（行首直接是 [→ 或 [← 开头），不过滤列表项里内嵌的链接
    if (/^\[[\s→←]/.test(trimmed) && /返回|速报|速览|分类|解读|列表/.test(trimmed)) return false
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

interface BriefContext {
  article: Article
  deep: Article[]
  analysis: Article[]
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<RegionTab>('overseas')
  const [edition, setEdition] = useState<Edition | null>(null)
  const [overseasCtx, setOverseasCtx] = useState<BriefContext | null>(null)
  const [domesticCtx, setDomesticCtx] = useState<BriefContext | null>(null)
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
          // 用 fetchArticleWithContext 获取完整内容 + deep/analysis 关联文章
          const [overseasResult, domesticResult] = await Promise.all([
            ob[0] ? fetchArticleWithContext(ob[0].id) : Promise.resolve(null),
            db[0] ? fetchArticleWithContext(db[0].id) : Promise.resolve(null),
          ])
          if (overseasResult && 'article' in overseasResult) setOverseasCtx(overseasResult as BriefContext)
          if (domesticResult && 'article' in domesticResult) setDomesticCtx(domesticResult as BriefContext)
        }
      } catch {
        // show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const currentCtx = activeTab === 'overseas' ? overseasCtx : domesticCtx
  const currentArticle = currentCtx?.article ?? null
  const deepArticles = currentCtx?.deep ?? []
  const analysisArticles = currentCtx?.analysis ?? []

  const { cleanContent, readingMeta } = useMemo(() => {
    if (!currentArticle?.content) return { cleanContent: '', readingMeta: '' }
    return cleanArticleContent(currentArticle.content)
  }, [currentArticle])

  /** 复用 ArticleDetailPage 的 markdownComponents：h2 加阵营深读入口，li 加单条深析入口 */
  const markdownComponents = useMemo(() => ({
    h2: ({ children }: { children?: ReactNode }) => {
      const text = extractText(children).toLowerCase()
      const matched = deepArticles.find(a =>
        (a.tags || []).some(tag => tag.length >= 2 && text.includes(tag.toLowerCase()))
      ) ?? null
      return (
        <h2 className="flex items-center gap-2 flex-wrap">
          <span>{children}</span>
          {matched && (
            <Link
              to={`/${matched.region}/${matched.tier}/${matched.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium no-underline transition-all cursor-pointer"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(167,139,250,0.24)'; el.style.borderColor = 'rgba(167,139,250,0.6)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(167,139,250,0.12)'; el.style.borderColor = 'rgba(167,139,250,0.35)' }}
            >
              <BookOpen size={10} />
              阵营深读 →
            </Link>
          )}
        </h2>
      )
    },
    li: ({ children }: { children?: ReactNode }) => {
      const text = extractText(children).toLowerCase()
      const matched = analysisArticles.find(a =>
        (a.tags || []).some(tag => tag.length >= 2 && text.includes(tag.toLowerCase()))
      ) ?? null
      return (
        <li className="mt-3">
          <div className="flex items-start gap-2">
            <span className="flex-1">{children}</span>
            {matched && (
              <Link
                to={`/${matched.region}/${matched.tier}/${matched.id}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium no-underline whitespace-nowrap flex-shrink-0 mt-0.5 transition-all cursor-pointer"
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(251,191,36,0.22)'; el.style.borderColor = 'rgba(251,191,36,0.6)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(251,191,36,0.1)'; el.style.borderColor = 'rgba(251,191,36,0.3)' }}
              >
                <Microscope size={10} />
                深析 →
              </Link>
            )}
          </div>
        </li>
      )
    },
  }), [deepArticles, analysisArticles])

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
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={activeTab === 'overseas' ? {
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
            } : {
              color: 'var(--c-tx-m)',
              border: '1px solid transparent',
            }}
          >
            <Globe size={12} />
            海外动态
          </button>
          <button
            onClick={() => setActiveTab('domestic')}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={activeTab === 'domestic' ? {
              background: 'rgba(244,114,182,0.15)',
              color: '#f472b6',
              border: '1px solid rgba(244,114,182,0.3)',
            } : {
              color: 'var(--c-tx-m)',
              border: '1px solid transparent',
            }}
          >
            <Cpu size={12} />
            国内动态
          </button>
        </div>

        {/* 期号（移动端隐藏）+ 往期回顾 */}
        <div className="flex items-center gap-2">
          {editionLabel && (
            <span className="hidden sm:inline text-xs" style={{color:'var(--c-tx-d)'}}>{editionLabel}</span>
          )}
          <Link
            to={`/${activeTab}/brief`}
            className="flex items-center gap-1 text-xs transition-colors whitespace-nowrap"
            style={{color:'var(--c-tx-m)'}}
            onMouseEnter={e => (e.currentTarget.style.color='var(--c-ac)')}
            onMouseLeave={e => (e.currentTarget.style.color='var(--c-tx-m)')}
          >
            <Clock size={11} />
            往期
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

          {/* 时间周期 + 其他 meta */}
          {readingMeta && (
            <div className="mb-4 flex flex-col gap-0.5">
              {readingMeta.split('\n').map((line, i) => (
                <p key={i} className="text-xs leading-relaxed" style={{color:'var(--c-tx-d)'}}>{line}</p>
              ))}
            </div>
          )}

          {/* Markdown 正文（含阵营深读/单条深析入口） */}
          <div className="prose-dark">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>

          {/* 底部：往期回顾入口 */}
          <div className="mt-8 pt-6 flex items-center justify-end" style={{borderTop:'1px solid var(--c-bd)'}}>
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
