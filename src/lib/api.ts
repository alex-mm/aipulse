const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const STATIC_BASE = '/data'

/** 内存缓存，避免同一文件被重复请求 */
const staticCache = new Map<string, Promise<unknown>>()

/** 从静态 JSON 读取，内存缓存防重复请求，失败则返回 null */
function fetchStatic<T>(path: string): Promise<T | null> {
  if (!staticCache.has(path)) {
    const promise = fetch(`${STATIC_BASE}/${path}`)
      .then(res => (res.ok ? res.json() : null))
      .catch(() => null)
    staticCache.set(path, promise)
  }
  return staticCache.get(path) as Promise<T | null>
}

export type Region = 'overseas' | 'domestic'
export type Tier = 'brief' | 'deep' | 'analysis'
export type ArticleCategory = 'release' | 'update' | 'news'
export type TopicCategory = 'discussion' | 'share' | 'question' | 'casual'

export interface Edition {
  id: string
  date: string
  number: number
  status: 'draft' | 'published'
}

export interface Article {
  id: string
  edition_id: string
  region: Region
  tier: Tier
  title: string
  summary: string
  content: string
  source_url: string
  source_name: string
  tags: string[]
  reactions: { like: number; fire: number; insightful: number }
  user_reaction?: string | null
  published_at: string
  created_at: string
}

export interface Comment {
  id: string
  article_id?: string
  topic_id?: string
  parent_id: string | null
  nickname: string
  content: string
  created_at: string
  replies?: Comment[]
}

export interface Topic {
  id: string
  title: string
  content: string
  category: TopicCategory
  author_nick: string
  view_count: number
  comment_count: number
  reactions: { like: number; fire: number; insightful: number }
  user_reaction?: string | null
  is_pinned: boolean
  created_at: string
}

// --- Read APIs ---

export async function fetchLatestEdition(): Promise<Edition | null> {
  // 优先读静态 JSON
  const staticEditions = await fetchStatic<Edition[]>('editions.json')
  if (staticEditions && staticEditions.length > 0) return staticEditions[0]
  // fallback 到 API
  const res = await fetch(`${API_BASE}/editions/latest`)
  if (!res.ok) return null
  return res.json()
}

export async function fetchEditions(page = 1): Promise<Edition[]> {
  // 优先读静态 JSON（暂不分页，静态数据量小）
  const staticEditions = await fetchStatic<Edition[]>('editions.json')
  if (staticEditions) return staticEditions
  // fallback 到 API
  const res = await fetch(`${API_BASE}/editions?page=${page}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchArticles(params: {
  edition_id?: string
  region?: Region
  tier?: Tier
}): Promise<Article[]> {
  // 优先读静态 JSON
  const staticArticles = await fetchStatic<Article[]>('articles.json')
  if (staticArticles) {
    return staticArticles.filter(a => {
      // 静态 JSON 里没有 edition_id，用 edition_date 匹配（edition_id 即 date 字符串）
      if (params.edition_id && (a as unknown as Record<string, string>).edition_date !== params.edition_id) return false
      if (params.region && a.region !== params.region) return false
      if (params.tier) {
        // deep tab 同时匹配 deep 和 category（阵营深读）
        if (params.tier === 'deep' && !['deep', 'category'].includes(a.tier)) return false
        // analysis tab 同时匹配 analysis 和 item（单条深析）
        else if (params.tier === 'analysis' && !['analysis', 'item'].includes(a.tier)) return false
        // 其他 tier 精确匹配
        else if (params.tier !== 'deep' && params.tier !== 'analysis' && a.tier !== params.tier) return false
      }
      return true
    })
  }
  // fallback 到 API
  const qs = new URLSearchParams()
  if (params.edition_id) qs.set('edition_id', params.edition_id)
  if (params.region) qs.set('region', params.region)
  if (params.tier) qs.set('tier', params.tier)
  const res = await fetch(`${API_BASE}/editions/${params.edition_id || 'latest'}/articles?${qs}`)
  if (!res.ok) return []
  return res.json()
}

/** 根据速览文章ID，查找所有关联的深析（analysis tier）文章 */
export async function fetchAnalysisBySourceId(sourceArticleId: string): Promise<Article[]> {
  const res = await fetch(`${API_BASE}/articles/${sourceArticleId}/analysis`)
  if (!res.ok) return []
  return res.json()
}

/** 通过 id（UUID 或 slug）找到对应的 slug */
async function resolveSlug(id: string): Promise<string> {
  // 如果 id 本身就是 slug 格式（不含连字符分隔的 UUID），直接用
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id)) return id
  // UUID 格式：从 articles.json 里找对应的 source_name（slug）
  const staticArticles = await fetchStatic<Article[]>('articles.json')
  const found = staticArticles?.find(a => a.id === id)
  return found?.source_name || id
}

export async function fetchArticle(id: string): Promise<Article | null> {
  const slug = await resolveSlug(id)
  const staticArticle = await fetchStatic<Article>(`article-${slug}.json`)
  if (staticArticle) return staticArticle
  // fallback 到 API
  const res = await fetch(`${API_BASE}/articles/${id}`)
  if (!res.ok) return null
  return res.json()
}

/** 获取 brief 文章 + 关联的 deep/analysis（合并端点，1 次请求替代 3 次） */
export async function fetchArticleWithContext(id: string): Promise<{
  article: Article
  deep: Article[]
  analysis: Article[]
} | null> {
  const slug = await resolveSlug(id)

  // brief 类型有 context 文件（含 deep + analysis）
  const staticContext = await fetchStatic<{ article: Article; deep: Article[]; analysis: Article[] }>(`context-${slug}.json`)
  if (staticContext) return staticContext

  // item/category 类型只有单篇文章文件，无 context
  const staticArticle = await fetchStatic<Article>(`article-${slug}.json`)
  if (staticArticle) return staticArticle as unknown as { article: Article; deep: Article[]; analysis: Article[] }

  // fallback 到 API
  const res = await fetch(`${API_BASE}/articles/${id}?include=context`)
  if (!res.ok) return null
  return res.json()
}

// --- Reactions ---

export async function postReaction(articleId: string, type: string): Promise<void> {
  await fetch(`${API_BASE}/articles/${articleId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })
}

// --- Comments ---

export async function fetchComments(articleId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/articles/${articleId}/comments`)
  if (!res.ok) return []
  return res.json()
}

export async function postComment(
  articleId: string,
  data: { nickname: string; content: string; parent_id?: string }
): Promise<Comment> {
  const res = await fetch(`${API_BASE}/articles/${articleId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// --- Forum ---

export async function fetchTopics(params: {
  category?: TopicCategory
  sort?: 'latest' | 'hot'
  page?: number
}): Promise<Topic[]> {
  const qs = new URLSearchParams()
  if (params.category) qs.set('category', params.category)
  if (params.sort) qs.set('sort', params.sort)
  if (params.page) qs.set('page', String(params.page))
  const res = await fetch(`${API_BASE}/forum/topics?${qs}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchTopic(id: string): Promise<Topic | null> {
  const res = await fetch(`${API_BASE}/forum/topics/${id}`)
  if (!res.ok) return null
  return res.json()
}

export async function createTopic(data: {
  title: string
  content: string
  category: TopicCategory
  author_nick: string
}): Promise<Topic> {
  const res = await fetch(`${API_BASE}/forum/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function fetchTopicComments(topicId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/forum/topics/${topicId}/comments`)
  if (!res.ok) return []
  return res.json()
}

export async function postTopicComment(
  topicId: string,
  data: { nickname: string; content: string; parent_id?: string }
): Promise<Comment> {
  const res = await fetch(`${API_BASE}/forum/topics/${topicId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function postTopicReaction(topicId: string, type: string): Promise<void> {
  await fetch(`${API_BASE}/forum/topics/${topicId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })
}

// --- Share ---

export function getShareLinks(url: string, title: string) {
  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  return {
    wechat: null, // WeChat sharing is image-based
    weibo: `https://service.weibo.com/share/share.php?url=${encoded}&title=${encodedTitle}`,
    zhihu: `https://www.zhihu.com/share?url=${encoded}&title=${encodedTitle}`,
    xiaohongshu: null, // No direct share URL, copy link
    douyin: null, // No direct share URL, copy link
    jike: `https://m.okjike.com/share?url=${encoded}&title=${encodedTitle}`,
    copy: url,
  }
}
