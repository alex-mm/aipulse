import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ExternalLink, Microscope, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { fetchArticleWithContext, fetchArticles, fetchComments, postComment, postReaction, type Article, type Comment, type Region, type Tier } from '../lib/api'
import Reactions from '../components/Reactions'
import CommentSection from '../components/CommentSection'
import ShareBar from '../components/ShareBar'

/** Extract plain text from React children recursively */
function extractText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

/**
 * Match heading text to a deep article using tags (exact match from DB).
 * Tags are structured data set during content-sync, e.g. ["Anthropic", "Claude"].
 */
function matchDeepByTags(headingText: string, deepArticles: Article[]): Article | null {
  const text = headingText.toLowerCase()
  // Skip generic sections
  if (text.includes('今日头条') || text.includes('行业动态')) return null
  for (const a of deepArticles) {
    for (const tag of a.tags || []) {
      if (text.includes(tag.toLowerCase())) return a
    }
  }
  return null
}

/**
 * Match list item text to an analysis article using tags (exact match from DB).
 * Only matches if at least one tag appears in the item text.
 */
function matchAnalysisByTags(itemText: string, analysisArticles: Article[]): Article | null {
  const text = itemText.toLowerCase()
  for (const a of analysisArticles) {
    for (const tag of a.tags || []) {
      if (tag.length >= 2 && text.includes(tag.toLowerCase())) return a
    }
  }
  return null
}

export default function ArticleDetailPage() {
  const { region, tier, id } = useParams<{ region: Region; tier: Tier; id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceArticle, setSourceArticle] = useState<Article | null>(null)
  const [deepArticles, setDeepArticles] = useState<Article[]>([])
  const [analysisArticles, setAnalysisArticles] = useState<Article[]>([])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setSourceArticle(null)
    setDeepArticles([])
    setAnalysisArticles([])
    setComments([])

    // 优先加载文章内容（静态 JSON，极快）
    fetchArticleWithContext(id).then(ctxResult => {
      if (ctxResult && 'article' in ctxResult && 'deep' in ctxResult) {
        setArticle(ctxResult.article)
        setDeepArticles(ctxResult.deep)
        setAnalysisArticles(ctxResult.analysis)
      } else {
        const a = ctxResult as unknown as Article | null
        setArticle(a)
        if (a?.tier === 'analysis') {
          // 异步加载关联 brief 文章，不阻塞渲染
          fetchArticles({ edition_id: a.edition_id, region: a.region, tier: 'brief' })
            .then(briefList => setSourceArticle(briefList[0] || null))
            .catch(() => {})
        }
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // 评论和点赞异步后台加载，不阻塞文章渲染
    fetchComments(id)
      .then(c => setComments(c))
      .catch(() => {})
  }, [id])

  // Custom Markdown components for brief articles
  const markdownComponents = useMemo(() => {
    if (!article || article.tier !== 'brief') return {}

    return {
      h2: ({ children }: { children?: ReactNode }) => {
        const text = extractText(children)
        const matched = matchDeepByTags(text, deepArticles)
        return (
          <h2 className="flex items-center gap-2 flex-wrap">
            <span>{children}</span>
            {matched && (
              <Link
                to={`/${matched.region}/${matched.tier}/${matched.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium no-underline transition-all cursor-pointer"
                style={{
                  background: 'rgba(167,139,250,0.12)',
                  color: '#a78bfa',
                  border: '1px solid rgba(167,139,250,0.35)',
                  boxShadow: '0 1px 4px rgba(167,139,250,0.1)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(167,139,250,0.24)'
                  el.style.borderColor = 'rgba(167,139,250,0.6)'
                  el.style.boxShadow = '0 2px 8px rgba(167,139,250,0.2)'
                  el.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(167,139,250,0.12)'
                  el.style.borderColor = 'rgba(167,139,250,0.35)'
                  el.style.boxShadow = '0 1px 4px rgba(167,139,250,0.1)'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <BookOpen size={10} />
                阵营深读 →
              </Link>
            )}
          </h2>
        )
      },
      li: ({ children }: { children?: ReactNode }) => {
        const text = extractText(children)
        const matched = matchAnalysisByTags(text, analysisArticles)
        return (
          <li className="mt-3">
            <div className="flex items-start gap-2">
              <span className="flex-1">{children}</span>
              {matched && (
                <Link
                  to={`/${matched.region}/${matched.tier}/${matched.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium no-underline whitespace-nowrap flex-shrink-0 mt-0.5 transition-all cursor-pointer"
                  style={{
                    background: 'rgba(251,191,36,0.1)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251,191,36,0.3)',
                    boxShadow: '0 1px 4px rgba(251,191,36,0.08)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(251,191,36,0.22)'
                    el.style.borderColor = 'rgba(251,191,36,0.6)'
                    el.style.boxShadow = '0 2px 8px rgba(251,191,36,0.18)'
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(251,191,36,0.1)'
                    el.style.borderColor = 'rgba(251,191,36,0.3)'
                    el.style.boxShadow = '0 1px 4px rgba(251,191,36,0.08)'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <Microscope size={10} />
                  深析 →
                </Link>
              )}
            </div>
          </li>
        )
      },
    }
  }, [article, deepArticles, analysisArticles])

  // Strip duplicate h1 title + all leading blockquote lines; extract reading meta
  const { cleanContent, readingMeta } = useMemo(() => {
    if (!article) return { cleanContent: '', readingMeta: '' }
    const lines = article.content.split('\n')
    let idx = 0
    const metaParts: string[] = []

    // Skip leading blank lines
    while (idx < lines.length && lines[idx].trim() === '') idx++
    // Skip h1 title
    if (idx < lines.length && /^#\s+/.test(lines[idx].trim())) idx++
    // Skip blank lines after title
    while (idx < lines.length && lines[idx].trim() === '') idx++
    // Consume ALL consecutive blockquote lines as meta
    while (idx < lines.length && lines[idx].trim().startsWith('>')) {
      const part = lines[idx].trim().replace(/^>\s*/, '').replace(/&nbsp;/g, ' ').trim()
      if (part) metaParts.push(part)
      idx++
    }
    // Skip blank lines after blockquote
    while (idx < lines.length && lines[idx].trim() === '') idx++

    // 过滤掉末尾的斜体注释行（如：*生成方式：AI 自动搜集 + 人工校验 | 数据截止：...*）
    // 同时过滤掉 Markdown 内容里的导航链接行（如：[→ Anthropic 分类深度解读](../category/...)）
    const contentLines = lines.slice(idx).filter(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) return false
      // 过滤掉独立成行的导航链接（→ 分类深度解读 / → 单条解读 / ← 返回速览）
      if (/^\[[\s→←].*(分类深度解读|单条解读|返回速览|返回列表)\]/.test(trimmed)) return false
      return true
    })

    // 把 blockquote 列表行（"> - xxx"）转换为普通列表行（"- xxx"），避免引用样式
    const normalizedLines = contentLines.map(line => {
      const blockquoteListMatch = line.match(/^>\s*(-|\*|\d+\.)\s+(.*)$/)
      if (blockquoteListMatch) return `${blockquoteListMatch[1]} ${blockquoteListMatch[2]}`
      return line
    })

    // 去掉 emoji 字符（Unicode emoji 范围）
    const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}]/gu
    const cleanedContent = normalizedLines.join('\n').replace(emojiRegex, '').replace(/^\s+/gm, match => match.replace(/ +/, ' '))

    return {
      cleanContent: cleanedContent,
      readingMeta: metaParts.join('\n').replace(emojiRegex, '').trim(),
    }
  }, [article])

  // SEO：动态更新 title 和 meta description
  useEffect(() => {
    if (!article) return
    const cleanTitle = article.title.replace(/\s*[|｜]\s*.+$/, '').trim()
    document.title = `${cleanTitle} - AI Pulse`
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', article.summary || cleanTitle)
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', `${cleanTitle} - AI Pulse`)
    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', article.summary || cleanTitle)
    return () => {
      document.title = 'AI Pulse - 感受 AI 行业的心跳'
      metaDesc?.setAttribute('content', '3分钟速览 + 深度阵营解读，每周 AI 前沿情报，海外+国内双板块')
      ogTitle?.setAttribute('content', 'AI Pulse - 感受 AI 行业的心跳')
      ogDesc?.setAttribute('content', '3分钟速览 + 深度阵营解读，每周 AI 前沿情报')
    }
  }, [article])

  const handleReact = async (type: string) => {
    if (!article) return
    await postReaction(article.id, type)
    setArticle((prev) => prev ? {
      ...prev,
      reactions: { ...prev.reactions, [type]: (prev.reactions[type as keyof typeof prev.reactions] || 0) + 1 },
      user_reaction: type,
    } : prev)
  }

  const handleComment = async (data: { nickname: string; content: string; parent_id?: string }) => {
    if (!article) return
    const comment = await postComment(article.id, data)
    setComments((prev) => [...prev, comment])
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-center" style={{color:'var(--c-tx-m)'}}>加载中...</div>
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p style={{color:'var(--c-tx-m)'}}>文章不存在</p>
        <Link to={`/${region}/${tier}`} className="text-sm mt-2 inline-block" style={{color:'var(--c-ac)'}}>返回列表</Link>
      </div>
    )
  }

  const pageUrl = `${window.location.origin}/${article.region}/${article.tier}/${article.id}`
  const tierMeta: Record<string, { label: string; style: React.CSSProperties }> = {
    brief:    { label: '速览',   style: { background: 'rgba(52,211,153,0.15)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.3)'  } },
    deep:     { label: '深读',   style: { background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' } },
    category: { label: '阵营解读', style: { background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' } },
    analysis: { label: '深析',   style: { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)'  } },
    item:     { label: '单条深读', style: { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)'  } },
  }
  const currentTierMeta = tierMeta[article.tier] || tierMeta.brief

  const regionLabel = article.region === 'overseas' ? '海外' : '国内'
  // category/item/analysis 都回到 brief 列表
  const backTier = ['analysis', 'category', 'item'].includes(article.tier) ? 'brief' : article.tier

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-3">
        <Link
          to={`/${article.region}/${backTier}`}
          className="flex items-center gap-1 transition-colors"
          style={{color:'var(--c-tx-m)'}}
          onMouseEnter={e => (e.currentTarget.style.color='var(--c-ac)')}
          onMouseLeave={e => (e.currentTarget.style.color='var(--c-tx-m)')}
        >
          <ChevronLeft size={14} />
          {regionLabel} · {currentTierMeta.label}
        </Link>
      </div>

      {/* Header */}
      <article>
        <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
          <span className="px-2 py-0.5 text-xs rounded-md font-medium flex items-center gap-1" style={currentTierMeta.style}>
            {article.tier === 'analysis' && <Microscope size={10} />}
            {currentTierMeta.label}
          </span>
          {article.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-md" style={{
              background: 'var(--c-glow)',
              color: 'var(--c-tx-s)',
              border: '1px solid rgba(110,231,247,0.1)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
          <h1 className="text-lg sm:text-2xl font-bold" style={{color:'var(--c-tx)'}}>
            {/* 去掉标题中 " | 时间周期" 部分，如 "AI 五巨头动态速报 | 2026 W16（04.13-04.19）" → "AI 五巨头动态速报" */}
            {article.title.replace(/\s*[|｜]\s*.+$/, '').trim()}
          </h1>
          {/* 移动端隐藏分享栏，避免挤压标题 */}
          <div className="flex-shrink-0 pt-0.5 hidden sm:block">
            <ShareBar url={pageUrl} title={article.title} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm" style={{color:'var(--c-tx-m)'}}>
            {/* 时间周期从标题提取，如 "2026 W16（04.13-04.19）"，没有则显示发布日期 */}
            {(() => {
              const periodMatch = article.title.match(/[|｜]\s*(.+)$/)
              return periodMatch
                ? <span>{periodMatch[1].trim()}</span>
                : <span>{new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
            })()}
          </div>
          {readingMeta && (
            <div className="flex flex-col gap-0.5">
              {readingMeta.split('\n')
                .filter(line => !line.includes('时间窗口'))
                .map((line, i) => (
                  <p key={i} className="text-xs leading-relaxed" style={{color:'var(--c-tx-d)'}}>
                    {line}
                  </p>
                ))}
            </div>
          )}
        </div>

        {/* analysis: back link to brief */}
        {article.tier === 'analysis' && sourceArticle && (
          <Link
            to={`/${sourceArticle.region}/brief/${sourceArticle.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-6 text-sm transition-all"
            style={{
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.2)',
              color: 'var(--c-tx-s)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,211,153,0.4)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,211,153,0.2)'}
          >
            <ChevronLeft size={13} style={{color:'#34d399'}} />
            <span style={{color:'#34d399'}}>返回速览 · </span>
            <span className="line-clamp-1">{sourceArticle.title}</span>
          </Link>
        )}

        {/* Content with inline deep/analysis entry points for brief */}
        <div className="prose-dark mb-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={markdownComponents}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>

        {/* Source link */}
        {article.source_url && (
          <div className="p-4 rounded-xl mb-6" style={{
            background: 'var(--c-glow)',
            border: '1px solid var(--c-bd)',
          }}>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{color:'var(--c-ac)'}}
            >
              <ExternalLink size={13} />
              查看原文 — {article.source_name}
            </a>
          </div>
        )}

        {/* Reactions */}
        <div className="pt-4 mb-6" style={{borderTop:'1px solid var(--c-bd-s)'}}>
          <Reactions
            reactions={article.reactions}
            userReaction={article.user_reaction}
            onReact={handleReact}
          />
        </div>

        {/* 移动端分享栏（PC 端已在标题旁显示） */}
        <div className="sm:hidden pt-4 mb-2" style={{borderTop:'1px solid var(--c-bd-s)'}}>
          <ShareBar url={pageUrl} title={article.title} />
        </div>
      </article>

      {/* Comments */}
      <div className="pt-6" style={{borderTop:'1px solid var(--c-bd-s)'}}>
        <CommentSection comments={comments} onSubmit={handleComment} />
      </div>
    </div>
  )
}
