-- 给 articles 表添加 source_article_id 字段
-- 用于关联「单条深析」文章与其来源「速览」文章
-- 运行方式：在 Supabase Dashboard > SQL Editor 中执行

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS source_article_id UUID REFERENCES articles(id) ON DELETE SET NULL;

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_articles_source_article_id
ON articles(source_article_id)
WHERE source_article_id IS NOT NULL;

COMMENT ON COLUMN articles.source_article_id IS '关联来源文章ID，用于 analysis 类型文章关联对应的 brief 文章';
