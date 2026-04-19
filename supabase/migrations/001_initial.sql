-- AI Pulse: Initial Schema

-- Editions (期号)
create table editions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  number int not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create index idx_editions_date on editions(date desc);
create index idx_editions_status on editions(status);

-- Articles (文章)
create table articles (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions(id) on delete cascade,
  region text not null check (region in ('overseas', 'domestic')),
  tier text not null check (tier in ('brief', 'deep')),
  title text not null,
  summary text not null default '',
  content text not null default '',
  source_url text not null default '',
  source_name text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_articles_edition on articles(edition_id);
create index idx_articles_region_tier on articles(region, tier);
create index idx_articles_published on articles(published_at desc);

-- Article Tags (标签)
create table article_tags (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  tag text not null,
  unique(article_id, tag)
);

create index idx_article_tags_article on article_tags(article_id);
create index idx_article_tags_tag on article_tags(tag);

-- Reactions (点赞/表情) - 文章
create table article_reactions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  type text not null check (type in ('like', 'fire', 'insightful')),
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique(article_id, ip_hash, type)
);

create index idx_article_reactions_article on article_reactions(article_id);

-- Comments (评论) - 文章
create table article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  parent_id uuid references article_comments(id) on delete cascade,
  nickname text not null,
  content text not null,
  ip_hash text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_article_comments_article on article_comments(article_id);
create index idx_article_comments_parent on article_comments(parent_id);

-- Forum Topics (论坛话题)
create table topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  category text not null check (category in ('discussion', 'share', 'question', 'casual')),
  author_nick text not null,
  ip_hash text not null,
  view_count int not null default 0,
  is_pinned boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_topics_category on topics(category);
create index idx_topics_created on topics(created_at desc);
create index idx_topics_pinned on topics(is_pinned desc, created_at desc);

-- Topic Reactions (话题表情)
create table topic_reactions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  type text not null check (type in ('like', 'fire', 'insightful')),
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique(topic_id, ip_hash, type)
);

create index idx_topic_reactions_topic on topic_reactions(topic_id);

-- Topic Comments (话题评论)
create table topic_comments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  parent_id uuid references topic_comments(id) on delete cascade,
  nickname text not null,
  content text not null,
  ip_hash text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_topic_comments_topic on topic_comments(topic_id);
create index idx_topic_comments_parent on topic_comments(parent_id);

-- ============================================
-- Row Level Security
-- ============================================

-- Public read access for published content
alter table editions enable row level security;
alter table articles enable row level security;
alter table article_tags enable row level security;
alter table article_reactions enable row level security;
alter table article_comments enable row level security;
alter table topics enable row level security;
alter table topic_reactions enable row level security;
alter table topic_comments enable row level security;

-- Editions: anyone can read published
create policy "Published editions are public"
  on editions for select
  using (status = 'published');

-- Articles: anyone can read published articles
create policy "Published articles are public"
  on articles for select
  using (published_at is not null and published_at <= now());

-- Article tags: anyone can read
create policy "Article tags are public"
  on article_tags for select
  using (true);

-- Article reactions: anyone can read, anyone can insert
create policy "Article reactions are readable"
  on article_reactions for select
  using (true);

create policy "Anyone can react to articles"
  on article_reactions for insert
  with check (true);

-- Article comments: anyone can read, anyone can insert
create policy "Article comments are readable"
  on article_comments for select
  using (is_deleted = false);

create policy "Anyone can comment on articles"
  on article_comments for insert
  with check (true);

-- Topics: anyone can read, anyone can insert
create policy "Topics are readable"
  on topics for select
  using (is_deleted = false);

create policy "Anyone can create topics"
  on topics for insert
  with check (true);

-- Topic reactions: anyone can read, anyone can insert
create policy "Topic reactions are readable"
  on topic_reactions for select
  using (true);

create policy "Anyone can react to topics"
  on topic_reactions for insert
  with check (true);

-- Topic comments: anyone can read, anyone can insert
create policy "Topic comments are readable"
  on topic_comments for select
  using (is_deleted = false);

create policy "Anyone can comment on topics"
  on topic_comments for insert
  with check (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Get reaction counts for an article
create or replace function get_article_reaction_counts(p_article_id uuid)
returns json as $$
  select coalesce(json_object_agg(type, cnt), '{}'::json)
  from (
    select type, count(*) as cnt
    from article_reactions
    where article_id = p_article_id
    group by type
  ) sub;
$$ language sql stable;

-- Get reaction counts for a topic
create or replace function get_topic_reaction_counts(p_topic_id uuid)
returns json as $$
  select coalesce(json_object_agg(type, cnt), '{}'::json)
  from (
    select type, count(*) as cnt
    from topic_reactions
    where topic_id = p_topic_id
    group by type
  ) sub;
$$ language sql stable;

-- Get comment count for a topic
create or replace function get_topic_comment_count(p_topic_id uuid)
returns int as $$
  select count(*)::int from topic_comments where topic_id = p_topic_id and is_deleted = false;
$$ language sql stable;

-- Increment topic view count
create or replace function increment_topic_views(p_topic_id uuid)
returns void as $$
  update topics set view_count = view_count + 1 where id = p_topic_id;
$$ language sql;
