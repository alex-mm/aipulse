/**
 * 本地开发 API Server
 * 直接代理到 Supabase REST API，模拟 Cloudflare Functions 的行为
 * 运行: node dev-api.cjs
 */
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

// 读取 .env.local
const envFile = path.join(__dirname, '.env.local')
const env = {}
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([^=]+)=(.+)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
}

const SUPABASE_URL = env['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL
// 本地用 service_role key 以绕过 RLS（也可以用 anon key，只要 RLS 开放读）
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'] || env['VITE_SUPABASE_ANON_KEY']

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or key in .env.local')
  process.exit(1)
}

console.log('Using Supabase:', SUPABASE_URL)
console.log('Key type:', SUPABASE_KEY.includes('"role":"service_role"') ? 'service_role' : 'anon')

// --- Supabase fetch helper ---
function sbFetch(table, query = '', method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlStr = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`
    const url = new URL(urlStr)
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
    }
    if (method === 'POST' || method === 'PATCH') headers['Prefer'] = 'return=representation'

    const data = body ? JSON.stringify(body) : null
    if (data) headers['Content-Length'] = Buffer.byteLength(data)

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers,
    }, (res) => {
      let text = ''
      res.on('data', c => text += c)
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.error('SB error', res.statusCode, text.slice(0, 200))
          resolve(null)
          return
        }
        try { resolve(text ? JSON.parse(text) : null) } catch { resolve(null) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

function getReactions(table, idField, id) {
  return sbFetch(table, `${idField}=eq.${id}&select=type`).then(data => {
    const c = { like: 0, fire: 0, insightful: 0 }
    for (const r of data || []) c[r.type] = (c[r.type] || 0) + 1
    return c
  })
}

function buildTree(comments) {
  const root = comments.filter(c => !c.parent_id)
  const map = {}
  for (const c of comments) {
    if (c.parent_id) { if (!map[c.parent_id]) map[c.parent_id] = []; map[c.parent_id].push(c) }
  }
  const build = c => ({ ...c, replies: (map[c.id] || []).map(build) })
  return root.map(build)
}

function json(res, data, status = 200) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', c => data += c)
    req.on('end', () => { try { resolve(JSON.parse(data)) } catch { resolve({}) } })
  })
}

// --- Router ---
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname.replace(/^\/api\/?/, '')
  const method = req.method

  if (method === 'OPTIONS') { json(res, {}); return }

  console.log(`[${method}] /api/${path}`)

  try {
    // GET /editions/latest
    if (path === 'editions/latest' && method === 'GET') {
      const d = await sbFetch('editions', 'status=eq.published&order=date.desc&limit=1')
      json(res, d?.[0] || null)
      return
    }

    // GET /editions
    if (path === 'editions' && method === 'GET') {
      const p = url.searchParams.get('page') || '1'
      const d = await sbFetch('editions', `status=eq.published&order=date.desc&limit=20&offset=${(+p - 1) * 20}`)
      json(res, d || [])
      return
    }

    // GET /editions/:id/articles
    const edMatch = path.match(/^editions\/([^/]+)\/articles$/)
    if (edMatch && method === 'GET') {
      let eid = edMatch[1]
      if (eid === 'latest') {
        const e = await sbFetch('editions', 'status=eq.published&order=date.desc&limit=1&select=id')
        if (e?.[0]) eid = e[0].id
      }
      let q = `select=*,article_tags(tag)&order=published_at.desc&edition_id=eq.${eid}`
      const r = url.searchParams.get('region'); if (r) q += '&region=eq.' + r
      const t = url.searchParams.get('tier'); if (t) q += '&tier=eq.' + t
      const arts = await sbFetch('articles', q) || []
      const out = []
      for (const a of arts) {
        a.tags = a.article_tags?.map(x => x.tag) || []; delete a.article_tags
        a.reactions = await getReactions('article_reactions', 'article_id', a.id)
        a.user_reaction = null
        // 补全 published_at
        if (!a.published_at) a.published_at = a.created_at
        out.push(a)
      }
      json(res, out)
      return
    }

    // GET /articles/:id (supports ?include=context for brief articles)
    const aMatch = path.match(/^articles\/([^/]+)$/)
    if (aMatch && method === 'GET') {
      const id = aMatch[1]
      const includeContext = url.searchParams.get('include') === 'context'
      const d = await sbFetch('articles', `id=eq.${id}&select=*,article_tags(tag)`)
      if (!d?.[0]) { json(res, null); return }
      const a = d[0]; a.tags = a.article_tags?.map(x => x.tag) || []; delete a.article_tags
      a.reactions = await getReactions('article_reactions', 'article_id', id)
      a.user_reaction = null
      if (!a.published_at) a.published_at = a.created_at

      if (!includeContext || a.tier !== 'brief') { json(res, a); return }

      // include=context: load deep + analysis in parallel
      const [deepArts, anaArts] = await Promise.all([
        sbFetch('articles', `edition_id=eq.${a.edition_id}&region=eq.${a.region}&tier=eq.deep&select=*,article_tags(tag)&order=published_at.desc`),
        sbFetch('articles', `source_article_id=eq.${id}&tier=eq.analysis&select=*,article_tags(tag)`),
      ])
      const hydrate = (list) => (list || []).map(x => {
        x.tags = x.article_tags?.map(t => t.tag) || []; delete x.article_tags
        x.reactions = { like: 0, fire: 0, insightful: 0 }; x.user_reaction = null
        if (!x.published_at) x.published_at = x.created_at
        return x
      })
      json(res, { article: a, deep: hydrate(deepArts), analysis: hydrate(anaArts) })
      return
    }

    // POST /articles/:id/react
    const arMatch = path.match(/^articles\/([^/]+)\/react$/)
    if (arMatch && method === 'POST') {
      json(res, { ok: true })
      return
    }

    // GET /articles/:id/analysis (all analysis articles linked to this brief)
    const anaMatch = path.match(/^articles\/([^/]+)\/analysis$/)
    if (anaMatch && method === 'GET') {
      const sourceId = anaMatch[1]
      const d = await sbFetch('articles', `source_article_id=eq.${sourceId}&tier=eq.analysis&select=*,article_tags(tag)`) || []
      const out = []
      for (const a of d) {
        a.tags = a.article_tags?.map(x => x.tag) || []; delete a.article_tags
        a.reactions = await getReactions('article_reactions', 'article_id', a.id)
        a.user_reaction = null
        if (!a.published_at) a.published_at = a.created_at
        out.push(a)
      }
      json(res, out)
      return
    }

    // GET/POST /articles/:id/comments
    const acMatch = path.match(/^articles\/([^/]+)\/comments$/)
    if (acMatch) {
      const id = acMatch[1]
      if (method === 'GET') {
        const d = await sbFetch('article_comments', `article_id=eq.${id}&is_deleted=eq.false&order=created_at.asc&select=id,parent_id,nickname,content,created_at`)
        json(res, buildTree(d || []))
        return
      }
      if (method === 'POST') {
        const b = await readBody(req)
        if (!b.nickname?.trim() || !b.content?.trim()) { json(res, { error: 'Missing fields' }, 400); return }
        const d = await sbFetch('article_comments', '', 'POST', { article_id: id, nickname: b.nickname.trim(), content: b.content.trim().slice(0, 2000), parent_id: b.parent_id || null, ip_hash: 'dev' })
        json(res, d?.[0] || d)
        return
      }
    }

    // GET /forum/topics
    if (path === 'forum/topics' && method === 'GET') {
      const cat = url.searchParams.get('category')
      const sort = url.searchParams.get('sort') || 'latest'
      const page = +(url.searchParams.get('page') || '1')
      let q = 'is_deleted=eq.false'; if (cat) q += '&category=eq.' + cat
      q += sort === 'hot' ? '&order=is_pinned.desc,view_count.desc,created_at.desc' : '&order=is_pinned.desc,created_at.desc'
      q += `&limit=20&offset=${(page - 1) * 20}&select=id,title,content,category,author_nick,view_count,is_pinned,created_at`
      const topics = await sbFetch('topics', q) || []
      const out = []
      for (const t of topics) {
        t.reactions = await getReactions('topic_reactions', 'topic_id', t.id)
        const c = await sbFetch('topic_comments', `topic_id=eq.${t.id}&is_deleted=eq.false&select=id`)
        t.comment_count = c?.length || 0; out.push(t)
      }
      json(res, out)
      return
    }

    // POST /forum/topics
    if (path === 'forum/topics' && method === 'POST') {
      const b = await readBody(req)
      if (!b.title?.trim() || !b.content?.trim()) { json(res, { error: 'Missing fields' }, 400); return }
      const d = await sbFetch('topics', '', 'POST', { title: b.title.trim(), content: b.content.trim(), category: b.category, author_nick: b.author_nick.trim(), ip_hash: 'dev' })
      json(res, d?.[0] || d)
      return
    }

    // GET /forum/topics/:id
    const tMatch = path.match(/^forum\/topics\/([^/]+)$/)
    if (tMatch && method === 'GET') {
      const id = tMatch[1]
      const d = await sbFetch('topics', `id=eq.${id}&select=*`)
      if (!d?.[0]) { json(res, null); return }
      const t = d[0]
      t.reactions = await getReactions('topic_reactions', 'topic_id', id)
      t.user_reaction = null
      const c = await sbFetch('topic_comments', `topic_id=eq.${id}&is_deleted=eq.false&select=id`)
      t.comment_count = c?.length || 0
      json(res, t)
      return
    }

    // GET/POST /forum/topics/:id/comments
    const tcMatch = path.match(/^forum\/topics\/([^/]+)\/comments$/)
    if (tcMatch) {
      const id = tcMatch[1]
      if (method === 'GET') {
        const d = await sbFetch('topic_comments', `topic_id=eq.${id}&is_deleted=eq.false&order=created_at.asc&select=id,parent_id,nickname,content,created_at`)
        json(res, buildTree(d || []))
        return
      }
      if (method === 'POST') {
        const b = await readBody(req)
        if (!b.nickname?.trim() || !b.content?.trim()) { json(res, { error: 'Missing fields' }, 400); return }
        const d = await sbFetch('topic_comments', '', 'POST', { topic_id: id, nickname: b.nickname.trim(), content: b.content.trim().slice(0, 2000), parent_id: b.parent_id || null, ip_hash: 'dev' })
        json(res, d?.[0] || d)
        return
      }
    }

    json(res, { error: 'Not found' }, 404)
  } catch (err) {
    console.error('API error:', err)
    json(res, { error: err.message }, 500)
  }
})

server.listen(3001, () => {
  console.log('Dev API server running at http://localhost:3001')
})
