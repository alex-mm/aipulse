/**
 * 构建时预生成静态 JSON 数据
 * 把 content/ 目录里的 Markdown 文件解析成 JSON，输出到 public/data/
 *
 * 输出文件：
 *   public/data/editions.json          - 所有期次列表
 *   public/data/articles.json          - 所有文章（不含 content 字段，用于列表页）
 *   public/data/article-{slug}.json    - 单篇文章完整内容（含 content）
 *   public/data/context-{slug}.json    - brief 文章的上下文（deep + analysis）
 */

'use strict'

const fs = require('fs')
const path = require('path')

const CONTENT_DIR = path.join(__dirname, '..', 'content')
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data')

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta: {}, body: raw }
  const meta = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let val = line.slice(colonIdx + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    } else {
      meta[key] = val.replace(/^['"]|['"]$/g, '').trim()
    }
  }
  const body = raw.slice(match[0].length)
  return { meta, body }
}

function extractSummary(body) {
  const lines = body.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>'))
  const firstPara = lines.slice(0, 3).join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '').trim()
  return firstPara.slice(0, 200)
}

function slugFromFile(filePath) {
  return path.basename(filePath, '.md')
}

// ─── 扫描所有 Markdown 文件 ───────────────────────────────────────────────────

function scanContentFiles() {
  const results = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name))
      } else if (entry.name.endsWith('.md') && entry.name !== 'INDEX.md' && entry.name !== 'index.md') {
        results.push(path.join(dir, entry.name))
      }
    }
  }
  walk(CONTENT_DIR)
  return results
}

// ─── 主逻辑 ──────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const files = scanContentFiles()
  console.log(`Found ${files.length} markdown files`)

  // 按日期分组，构建 editions
  const editionMap = new Map() // date -> { date, articles: [] }
  const allArticles = []       // 所有文章（不含 content）
  const articlesBySlug = new Map() // slug -> article（含 content）

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { meta, body } = parseFrontmatter(raw)

    const slug = slugFromFile(filePath)
    const pathParts = filePath.split(path.sep)
    const datePart = pathParts.find(p => /^\d{4}-\d{2}-\d{2}$/.test(p))
    if (!datePart) continue

    const region = meta.region || pathParts[pathParts.indexOf(datePart) + 1]
    const tier = meta.tier || slug.split('-')[1] || slug.split('_')[0]

    if (!['overseas', 'domestic'].includes(region)) continue
    if (!['brief', 'deep', 'analysis', 'category', 'item'].includes(tier)) continue

    const title = meta.title || (body.match(/^# (.+)$/m) || [])[1] || slug
    const summary = extractSummary(body)
    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : [])
    const publishedAt = new Date(datePart + 'T00:00:00Z').toISOString()

    const article = {
      // id 用 slug（构建时没有 UUID，前端用 source_name 匹配数据库 UUID）
      id: slug,
      slug,
      edition_date: datePart,
      region,
      tier,
      title,
      summary,
      content: body,
      source_url: meta.source_url || '',
      source_name: slug,
      tags,
      reactions: { like: 0, fire: 0, insightful: 0 },
      user_reaction: null,
      published_at: publishedAt,
      created_at: publishedAt,
    }

    articlesBySlug.set(slug, article)

    // 列表用（不含 content）
    const { content: _content, ...articleWithoutContent } = article
    allArticles.push(articleWithoutContent)

    // 按日期分组
    if (!editionMap.has(datePart)) {
      editionMap.set(datePart, { date: datePart, articles: [] })
    }
    editionMap.get(datePart).articles.push(articleWithoutContent)

    // 输出单篇文章 JSON
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `article-${slug}.json`),
      JSON.stringify(article, null, 2)
    )
  }

  // 构建 editions 列表（按日期倒序）
  const editions = Array.from(editionMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((ed, idx) => ({
      id: ed.date, // 用日期作为 id（前端用来查文章）
      date: ed.date,
      number: idx + 1,
      status: 'published',
    }))

  fs.writeFileSync(path.join(OUTPUT_DIR, 'editions.json'), JSON.stringify(editions, null, 2))
  console.log(`Written editions.json (${editions.length} editions)`)

  // 输出所有文章列表
  fs.writeFileSync(path.join(OUTPUT_DIR, 'articles.json'), JSON.stringify(allArticles, null, 2))
  console.log(`Written articles.json (${allArticles.length} articles)`)

  // 构建 brief 文章的 context（deep + analysis）
  for (const [slug, article] of articlesBySlug) {
    if (article.tier !== 'brief') continue

    const deep = allArticles.filter(a =>
      a.edition_date === article.edition_date &&
      a.region === article.region &&
      ['deep', 'category'].includes(a.tier)
    ).map(a => ({ ...a, content: articlesBySlug.get(a.slug)?.content || '' }))

    const analysis = allArticles.filter(a =>
      a.edition_date === article.edition_date &&
      a.region === article.region &&
      ['analysis', 'item'].includes(a.tier)
    ).map(a => ({ ...a, content: articlesBySlug.get(a.slug)?.content || '' }))

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `context-${slug}.json`),
      JSON.stringify({ article, deep, analysis }, null, 2)
    )
    console.log(`Written context-${slug}.json (deep: ${deep.length}, analysis: ${analysis.length})`)
  }

  // ─── 生成 sitemap.xml（传统 SEO）────────────────────────────────────────────
  const SITE = 'https://aipulse.top'
  const today = new Date().toISOString().slice(0, 10)
  const sitemapUrls = [
    `<url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${SITE}/overseas/brief</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${SITE}/domestic/brief</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
  ]
  for (const article of allArticles) {
    sitemapUrls.push(
      `<url><loc>${SITE}/${article.region}/${article.tier}/${article.slug}</loc><lastmod>${article.edition_date}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
    )
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), sitemap)
  console.log(`Written sitemap.xml (${sitemapUrls.length} urls)`)

  // ─── 生成 llms.txt（AI SEO 标准）────────────────────────────────────────────
  // 参考：https://llmstxt.org/ 规范
  const briefArticles = allArticles.filter(a => a.tier === 'brief')
  const categoryArticles = allArticles.filter(a => a.tier === 'category')
  const itemArticles = allArticles.filter(a => a.tier === 'item')

  let llmsTxt = `# AI Pulse

> AI Pulse 是一个专注于 AI 行业动态的周刊平台，提供海外和国内 AI 领域的速览、阵营深度解读和单条深度解读。每周更新，覆盖 OpenAI、Anthropic、Google、xAI、DeepSeek、阿里云等主要 AI 公司的最新动态。

## 关于本站

- 网站：${SITE}
- 更新频率：每周
- 内容类型：AI 行业情报、技术动态、产品发布
- 覆盖范围：海外（OpenAI/Anthropic/Google/xAI）+ 国内（DeepSeek/阿里云/字节/腾讯/Kimi 等）

## 速览文章（每期概览）

${briefArticles.map(a => `- [${a.title.replace(/\s*[|｜]\s*.+$/, '').trim()}](${SITE}/${a.region}/${a.tier}/${a.slug}): ${a.summary}`).join('\n')}

## 阵营深度解读

${categoryArticles.map(a => `- [${a.title.replace(/\s*[|｜]\s*.+$/, '').trim()}](${SITE}/${a.region}/${a.tier}/${a.slug}): ${a.summary}`).join('\n')}

## 单条深度解读

${itemArticles.map(a => `- [${a.title.replace(/\s*[|｜]\s*.+$/, '').trim()}](${SITE}/${a.region}/${a.tier}/${a.slug}): ${a.summary}`).join('\n')}
`
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'llms.txt'), llmsTxt)
  console.log(`Written llms.txt (${allArticles.length} articles indexed)`)

  // ─── 生成 llms-full.txt（完整内容版，供 AI 深度索引）────────────────────────
  let llmsFullTxt = `# AI Pulse - 完整内容索引\n\n`
  for (const article of allArticles) {
    const fullArticle = articlesBySlug.get(article.slug)
    if (!fullArticle) continue
    const cleanTitle = article.title.replace(/\s*[|｜]\s*.+$/, '').trim()
    llmsFullTxt += `---\n\n## ${cleanTitle}\n\nURL: ${SITE}/${article.region}/${article.tier}/${article.slug}\n类型: ${article.tier} | 地区: ${article.region === 'overseas' ? '海外' : '国内'}\n\n${fullArticle.content}\n\n`
  }
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'llms-full.txt'), llmsFullTxt)
  console.log(`Written llms-full.txt`)

  console.log('✅ Static data build complete!')
}

main()
