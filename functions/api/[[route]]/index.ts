// Cloudflare Pages Functions - API Router
import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ADMIN_TOKEN: string
  CACHE: KVNamespace
}

// ─── 响应工具 ────────────────────────────────────────────────────────────────

/** 标记响应可被 Cache API 缓存的自定义头 */
const CACHE_TTL_HEADER = 'X-Cache-TTL'

function json(data: unknown, status = 200, cacheSeconds = 0) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }
  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, s-maxage=${cacheSeconds}, stale-while-revalidate=60`
    headers[CACHE_TTL_HEADER] = String(cacheSeconds)
  } else {
    headers['Cache-Control'] = 'no-store'
  }
  return new Response(JSON.stringify(data), { status, headers })
}

// ─── KV 缓存工具 ──────────────────────────────────────────────────────────────

async function kvGet<T>(kv: KVNamespace | undefined, key: string): Promise<T | null> {
  if (!kv) return null
  try {
    const val = await kv.get(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

async function kvSet(kv: KVNamespace | undefined, key: string, data: unknown, ttlSeconds: number): Promise<void> {
  if (!kv) return
  try {
    await kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds })
  } catch {
    // KV 写失败不影响主流程
  }
}

async function kvDel(kv: KVNamespace | undefined, ...keys: string[]): Promise<void> {
  if (!kv) return
  await Promise.allSettled(keys.map(k => kv.delete(k)))
}

function errorResp(message: string, status = 400) {
  return json({ error: message }, status)
}

// ─── Supabase 请求 ────────────────────────────────────────────────────────────

async function sbFetch(env: Env, table: string, opts: { method?: string; query?: string; body?: unknown } = {}) {
  const url = env.SUPABASE_URL + '/rest/v1/' + table + (opts.query ? '?' + opts.query : '')
  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json',
  }
  if (opts.method === 'POST') headers['Prefer'] = 'return=representation'
  const res = await fetch(url, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
  if (!res.ok) { console.error('SB error:', res.status, await res.text()); return null }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ─── IP Hash ─────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  let h = 0
  for (let i = 0; i < ip.length; i++) { h = ((h << 5) - h) + ip.charCodeAt(i); h = h & h }
  return Math.abs(h).toString(36)
}

// ─── Reactions 批量工具 ───────────────────────────────────────────────────────

/** 单条 reactions count */
async function getReactions(env: Env, table: string, idField: string, id: string) {
  const data = await sbFetch(env, table, { query: idField + '=eq.' + id + '&select=type' })
  const c: Record<string, number> = { like: 0, fire: 0, insightful: 0 }
  for (const r of data || []) c[r.type] = (c[r.type] || 0) + 1
  return c
}

/** 批量 reactions count，返回 Map<id, {like,fire,insightful}> */
async function getBatchReactions(env: Env, table: string, idField: string, ids: string[]) {
  if (!ids.length) return new Map<string, Record<string, number>>()
  const data = await sbFetch(env, table, { query: `${idField}=in.(${ids.join(',')})&select=${idField},type` }) || []
  const map = new Map<string, Record<string, number>>()
  for (const id of ids) map.set(id, { like: 0, fire: 0, insightful: 0 })
  for (const r of data) {
    const c = map.get(r[idField])
    if (c) c[r.type] = (c[r.type] || 0) + 1
  }
  return map
}

/** 批量获取当前用户 reaction，返回 Map<id, type|null> */
async function getBatchUserReacts(env: Env, table: string, idField: string, ids: string[], ipHash: string) {
  if (!ids.length) return new Map<string, string | null>()
  const data = await sbFetch(env, table, { query: `${idField}=in.(${ids.join(',')})&ip_hash=eq.${ipHash}&select=${idField},type` }) || []
  const map = new Map<string, string | null>()
  for (const id of ids) map.set(id, null)
  for (const r of data) map.set(r[idField], r.type)
  return map
}

/** 单条用户 reaction */
async function getUserReact(env: Env, table: string, idField: string, id: string, ipHash: string) {
  const d = await sbFetch(env, table, { query: idField + '=eq.' + id + '&ip_hash=eq.' + ipHash + '&select=type' })
  return d?.[0]?.type || null
}

// ─── 评论树 ───────────────────────────────────────────────────────────────────

function buildTree(comments: any[]) {
  const root = comments.filter(c => !c.parent_id)
  const map: Record<string, any[]> = {}
  for (const c of comments) { if (c.parent_id) { if (!map[c.parent_id]) map[c.parent_id] = []; map[c.parent_id].push(c) } }
  const build = (c: any): any => ({ ...c, replies: (map[c.id] || []).map(build) })
  return root.map(build)
}

// ─── 主路由 ───────────────────────────────────────────────────────────────────

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)
  const method = request.method

  if (method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } })

  // ─── Cache API 边缘缓存层 ──────────────────────────────────────────────────
  // 仅对 GET 请求启用；写操作直接穿透
  if (method === 'GET') {
    const cache = (caches as unknown as { default: Cache }).default
    // 去掉 ipHash 相关的个性化，用纯 URL 做缓存键
    const cacheKey = new Request(url.toString(), { method: 'GET' })
    const cached = await cache.match(cacheKey)
    if (cached) {
      // 缓存命中：添加标记头后直接返回
      const resp = new Response(cached.body, cached)
      resp.headers.set('X-Cache', 'HIT')
      return resp
    }

    // 缓存未命中：执行业务逻辑
    const response = await handleRequest(request, env, url)
    const ttl = response.headers.get(CACHE_TTL_HEADER)
    if (ttl && parseInt(ttl) > 0) {
      // 存入边缘缓存，删除内部标记头
      const toCache = new Response(response.body, response)
      toCache.headers.delete(CACHE_TTL_HEADER)
      toCache.headers.set('X-Cache', 'MISS')
      // waitUntil 异步写缓存，不阻塞响应
      context.waitUntil(cache.put(cacheKey, toCache.clone()))
      return toCache
    }
    return response
  }

  // 非 GET 请求直接执行
  return handleRequest(request, env, url)
}

async function handleRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname.replace(/^\/api\/?/, '')
  const method = request.method
  const ipHash = hashIp(request.headers.get('CF-Connecting-IP') || 'unknown')

  try {
    // ── 期刊列表 / 最新期刊（KV 缓存 5 分钟） ──────────────────────────────────
    if (path === 'editions/latest') {
      const kvKey = 'editions:latest'
      const cached = await kvGet<unknown>(env.CACHE, kvKey)
      if (cached !== null) return json(cached, 200, 300)
      const d = await sbFetch(env, 'editions', { query: 'status=eq.published&order=date.desc&limit=1' })
      const result = d?.[0] || null
      await kvSet(env.CACHE, kvKey, result, 300)
      return json(result, 200, 300)
    }
    if (path === 'editions') {
      const p = url.searchParams.get('page') || '1'
      const kvKey = 'editions:list:' + p
      const cached = await kvGet<unknown>(env.CACHE, kvKey)
      if (cached !== null) return json(cached, 200, 300)
      const d = await sbFetch(env, 'editions', { query: 'status=eq.published&order=date.desc&limit=20&offset=' + ((+p-1)*20) })
      const result = d || []
      await kvSet(env.CACHE, kvKey, result, 300)
      return json(result, 200, 300)
    }

    // ── 文章列表（KV 缓存 5 分钟，reactions 并行批量） ──────────────────────────
    const edMatch = path.match(/^editions\/([^/]+)\/articles$/)
    if (edMatch && method === 'GET') {
      let eid = edMatch[1]
      if (eid === 'latest') {
        const e = await sbFetch(env, 'editions', { query: 'status=eq.published&order=date.desc&limit=1&select=id' })
        if (e?.[0]) eid = e[0].id
      }
      const regionParam = url.searchParams.get('region')
      const tierParam = url.searchParams.get('tier')
      const kvKey = `editions:${eid}:articles:${regionParam || 'all'}:${tierParam || 'all'}`
      const cached = await kvGet<unknown>(env.CACHE, kvKey)
      if (cached !== null) return json(cached, 200, 300)

      let q = 'select=*,article_tags(tag)&published_at=not.is.null&order=published_at.desc&edition_id=eq.' + eid
      if (regionParam) q += '&region=eq.' + regionParam
      if (tierParam) q += '&tier=eq.' + tierParam
      const arts = await sbFetch(env, 'articles', { query: q }) || []

      if (arts.length === 0) return json([], 200, 300)

      const ids = arts.map((a: any) => a.id)
      // 并行：批量拉 reactions + 用户 reaction（2 次查询替代原来 2N 次）
      const [reactMap, userMap] = await Promise.all([
        getBatchReactions(env, 'article_reactions', 'article_id', ids),
        getBatchUserReacts(env, 'article_reactions', 'article_id', ids, ipHash),
      ])

      const out = arts.map((a: any) => {
        a.tags = a.article_tags?.map((x: any) => x.tag) || []; delete a.article_tags
        a.reactions = reactMap.get(a.id) || { like: 0, fire: 0, insightful: 0 }
        a.user_reaction = userMap.get(a.id) || null
        return a
      })
      await kvSet(env.CACHE, kvKey, out, 300)
      return json(out, 200, 300)
    }

    // ── 单篇文章（KV 缓存 10 分钟，支持 ?include=context 合并 deep+analysis） ────
    const aMatch = path.match(/^articles\/([^/]+)$/)
    if (aMatch && method === 'GET') {
      const id = aMatch[1]
      const includeContext = url.searchParams.get('include') === 'context'
      const kvKey = includeContext ? `article:${id}:context` : `article:${id}`
      const cached = await kvGet<unknown>(env.CACHE, kvKey)
      if (cached !== null) return json(cached, 200, 600)

      const d = await sbFetch(env, 'articles', { query: 'id=eq.' + id + '&select=*,article_tags(tag)' })
      if (!d?.[0]) return json(null, 200)
      const a = d[0]; a.tags = a.article_tags?.map((x: any) => x.tag) || []; delete a.article_tags
      const [reactions, user_reaction] = await Promise.all([
        getReactions(env, 'article_reactions', 'article_id', id),
        getUserReact(env, 'article_reactions', 'article_id', id, ipHash),
      ])
      a.reactions = reactions; a.user_reaction = user_reaction

      if (!includeContext || a.tier !== 'brief') {
        await kvSet(env.CACHE, kvKey, a, 600)
        return json(a, 200, 600)
      }

      // include=context: 并行加载 deep/category + analysis/item，合并到一次响应
      const [deepArts, anaArts] = await Promise.all([
        sbFetch(env, 'articles', { query: 'edition_id=eq.' + a.edition_id + '&region=eq.' + a.region + '&tier=in.(deep,category)&select=*,article_tags(tag)&order=published_at.asc' }),
        sbFetch(env, 'articles', { query: 'edition_id=eq.' + a.edition_id + '&region=eq.' + a.region + '&tier=in.(analysis,item)&select=*,article_tags(tag)&order=published_at.asc' }),
      ])
      const allCtx = [...(deepArts || []), ...(anaArts || [])]
      const ctxIds = allCtx.map((x: any) => x.id)
      const [ctxReactMap, ctxUserMap] = ctxIds.length ? await Promise.all([
        getBatchReactions(env, 'article_reactions', 'article_id', ctxIds),
        getBatchUserReacts(env, 'article_reactions', 'article_id', ctxIds, ipHash),
      ]) : [new Map(), new Map()]
      const hydrate = (list: any[]) => list.map((x: any) => {
        x.tags = x.article_tags?.map((t: any) => t.tag) || []; delete x.article_tags
        x.reactions = ctxReactMap.get(x.id) || { like: 0, fire: 0, insightful: 0 }
        x.user_reaction = ctxUserMap.get(x.id) || null
        return x
      })
      const contextResult = { article: a, deep: hydrate(deepArts || []), analysis: hydrate(anaArts || []) }
      await kvSet(env.CACHE, kvKey, contextResult, 600)
      return json(contextResult, 200, 600)
    }

    // ── 通过速览文章 ID 查配套深析（批量 reactions） ────────────────────────────
    const analysisMatch = path.match(/^articles\/([^/]+)\/analysis$/)
    if (analysisMatch && method === 'GET') {
      const sourceId = analysisMatch[1]
      const d = await sbFetch(env, 'articles', { query: 'source_article_id=eq.' + sourceId + '&tier=eq.analysis&select=*,article_tags(tag)' })
      if (!d?.length) return json([], 200)
      const ids = d.map((a: any) => a.id)
      const [reactMap, userMap] = await Promise.all([
        getBatchReactions(env, 'article_reactions', 'article_id', ids),
        getBatchUserReacts(env, 'article_reactions', 'article_id', ids, ipHash),
      ])
      const out = d.map((a: any) => {
        a.tags = a.article_tags?.map((x: any) => x.tag) || []; delete a.article_tags
        a.reactions = reactMap.get(a.id) || { like: 0, fire: 0, insightful: 0 }
        a.user_reaction = userMap.get(a.id) || null
        return a
      })
      return json(out, 200, 600)
    }

    // ── 文章 reaction（写操作，不缓存） ──────────────────────────────────────
    const arMatch = path.match(/^articles\/([^/]+)\/react$/)
    if (arMatch && method === 'POST') {
      const b = await request.json() as { type: string }
      if (!['like','fire','insightful'].includes(b.type)) return errorResp('Invalid type')
      await sbFetch(env, 'article_reactions', { method: 'POST', body: { article_id: arMatch[1], type: b.type, ip_hash: ipHash } })
      return json({ ok: true })
    }

    // ── 文章评论 ─────────────────────────────────────────────────────────────
    const acMatch = path.match(/^articles\/([^/]+)\/comments$/)
    if (acMatch) {
      const id = acMatch[1]
      if (method === 'GET') { const d = await sbFetch(env, 'article_comments', { query: 'article_id=eq.'+id+'&is_deleted=eq.false&order=created_at.asc&select=id,parent_id,nickname,content,created_at' }); return json(buildTree(d || [])) }
      if (method === 'POST') { const b = await request.json() as any; if (!b.nickname?.trim()||!b.content?.trim()) return errorResp('Missing fields'); const d = await sbFetch(env, 'article_comments', { method: 'POST', body: { article_id: id, nickname: b.nickname.trim(), content: b.content.trim().slice(0,2000), parent_id: b.parent_id||null, ip_hash: ipHash } }); return json(d?.[0]||d) }
    }

    // ── 论坛帖子列表（N+1 修复 + 缓存 2 分钟） ───────────────────────────────
    if (path === 'forum/topics') {
      if (method === 'GET') {
        const cat = url.searchParams.get('category')
        const sort = url.searchParams.get('sort') || 'latest'
        const page = +(url.searchParams.get('page') || '1')
        let q = 'is_deleted=eq.false'; if (cat) q += '&category=eq.' + cat
        q += sort === 'hot' ? '&order=is_pinned.desc,view_count.desc,created_at.desc' : '&order=is_pinned.desc,created_at.desc'
        q += '&limit=20&offset=' + ((page-1)*20) + '&select=id,title,content,category,author_nick,view_count,is_pinned,created_at'
        const topics = await sbFetch(env, 'topics', { query: q }) || []

        if (topics.length === 0) return json([], 200, 120)

        const tids = topics.map((t: any) => t.id)
        // 并行：批量 reactions + 批量 comment_count（2 次查询替代原来 2N 次）
        const [reactMap, allComments] = await Promise.all([
          getBatchReactions(env, 'topic_reactions', 'topic_id', tids),
          sbFetch(env, 'topic_comments', { query: `topic_id=in.(${tids.join(',')})&is_deleted=eq.false&select=topic_id` }),
        ])
        // 统计每个 topic 的评论数
        const commentCountMap = new Map<string, number>()
        for (const c of allComments || []) {
          commentCountMap.set(c.topic_id, (commentCountMap.get(c.topic_id) || 0) + 1)
        }

        const out = topics.map((t: any) => ({
          ...t,
          reactions: reactMap.get(t.id) || { like: 0, fire: 0, insightful: 0 },
          comment_count: commentCountMap.get(t.id) || 0,
        }))
        return json(out, 200, 120)
      }
      if (method === 'POST') {
        const b = await request.json() as any
        if (!b.title?.trim() || !b.content?.trim()) return errorResp('Missing fields')
        const d = await sbFetch(env, 'topics', { method: 'POST', body: { title: b.title.trim(), content: b.content.trim(), category: b.category, author_nick: b.author_nick.trim(), ip_hash: ipHash } })
        return json(d?.[0] || d)
      }
    }

    // ── 单个帖子（缓存 2 分钟） ──────────────────────────────────────────────
    const tMatch = path.match(/^forum\/topics\/([^/]+)$/)
    if (tMatch && method === 'GET') {
      const id = tMatch[1]
      const d = await sbFetch(env, 'topics', { query: 'id=eq.' + id + '&select=*' })
      if (!d?.[0]) return json(null)
      // 并行：浏览数 +1、reactions、user_reaction、comment_count
      const [, reactions, user_reaction, comments] = await Promise.all([
        sbFetch(env, 'rpc/increment_topic_views', { method: 'POST', body: { p_topic_id: id } }),
        getReactions(env, 'topic_reactions', 'topic_id', id),
        getUserReact(env, 'topic_reactions', 'topic_id', id, ipHash),
        sbFetch(env, 'topic_comments', { query: 'topic_id=eq.' + id + '&is_deleted=eq.false&select=id' }),
      ])
      const t = d[0]
      t.reactions = reactions; t.user_reaction = user_reaction; t.comment_count = comments?.length || 0
      return json(t, 200, 120)
    }

    const trMatch = path.match(/^forum\/topics\/([^/]+)\/react$/)
    if (trMatch && method === 'POST') {
      const b = await request.json() as { type: string }
      if (!['like','fire','insightful'].includes(b.type)) return errorResp('Invalid type')
      await sbFetch(env, 'topic_reactions', { method: 'POST', body: { topic_id: trMatch[1], type: b.type, ip_hash: ipHash } })
      return json({ ok: true })
    }

    const tcMatch = path.match(/^forum\/topics\/([^/]+)\/comments$/)
    if (tcMatch) {
      const id = tcMatch[1]
      if (method === 'GET') { const d = await sbFetch(env, 'topic_comments', { query: 'topic_id=eq.'+id+'&is_deleted=eq.false&order=created_at.asc&select=id,parent_id,nickname,content,created_at' }); return json(buildTree(d || [])) }
      if (method === 'POST') { const b = await request.json() as any; if (!b.nickname?.trim()||!b.content?.trim()) return errorResp('Missing fields'); const d = await sbFetch(env, 'topic_comments', { method: 'POST', body: { topic_id: id, nickname: b.nickname.trim(), content: b.content.trim().slice(0,2000), parent_id: b.parent_id||null, ip_hash: ipHash } }); return json(d?.[0]||d) }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    if (path.startsWith('admin/')) {
      if (request.headers.get('Authorization') !== 'Bearer ' + env.ADMIN_TOKEN) return errorResp('Unauthorized', 401)
      if (path === 'admin/editions' && method === 'POST') { const b = await request.json() as any; const d = await sbFetch(env, 'editions', { method: 'POST', body: { date: b.date, number: b.number, status: 'draft' } }); return json(d?.[0]||d) }
      if (path === 'admin/articles' && method === 'POST') { const b = await request.json() as any; const { tags, ...a } = b; const d = await sbFetch(env, 'articles', { method: 'POST', body: { ...a, summary: a.summary||'', source_url: a.source_url||'', source_name: a.source_name||'' } }); const art = d?.[0]; if (art && tags?.length) await sbFetch(env, 'article_tags', { method: 'POST', body: tags.map((t: string) => ({ article_id: art.id, tag: t })) }); return json(art) }
      const aaMatch = path.match(/^admin\/articles\/([^/]+)$/); if (aaMatch && method === 'PUT') { const id = aaMatch[1]; const b = await request.json() as any; const { tags, ...a } = b; await sbFetch(env, 'articles', { method: 'PATCH', query: 'id=eq.'+id, body: a }); if (tags) { await sbFetch(env, 'article_tags', { method: 'DELETE', query: 'article_id=eq.'+id }); if (tags.length) await sbFetch(env, 'article_tags', { method: 'POST', body: tags.map((t: string) => ({ article_id: id, tag: t })) }); } return json({ ok: true }) }
      if (path === 'admin/publish' && method === 'POST') { const b = await request.json() as any; await sbFetch(env, 'editions', { method: 'PATCH', query: 'id=eq.'+b.edition_id, body: { status: 'published' } }); await sbFetch(env, 'articles', { method: 'PATCH', query: 'edition_id=eq.'+b.edition_id, body: { published_at: new Date().toISOString() } }); return json({ ok: true }) }
    }

    return errorResp('Not found', 404)
  } catch (err: any) { console.error('API error:', err); return errorResp(err.message || 'Internal error', 500) }
}
