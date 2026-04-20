import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchTopic, fetchTopicComments, postTopicComment, postTopicReaction, type Topic, type Comment } from '../lib/api'
import Reactions from '../components/Reactions'
import CommentSection from '../components/CommentSection'
import ShareBar from '../components/ShareBar'

const categoryLabels: Record<string, string> = {
  discussion: '讨论',
  share: '分享',
  question: '提问',
  casual: '水贴',
}

export default function ForumTopicPage() {
  const { id } = useParams<{ id: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const [t, c] = await Promise.all([
          fetchTopic(id),
          fetchTopicComments(id),
        ])
        setTopic(t)
        setComments(c)
      } catch {
        // empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleReact = async (type: string) => {
    if (!topic) return
    const isToggleOff = topic.user_reaction === type
    await postTopicReaction(topic.id, type)
    setTopic((prev) => {
      if (!prev) return prev
      const currentCount = prev.reactions[type as keyof typeof prev.reactions] || 0
      return {
        ...prev,
        reactions: {
          ...prev.reactions,
          [type]: isToggleOff ? Math.max(0, currentCount - 1) : currentCount + 1,
        },
        user_reaction: isToggleOff ? null : type,
      }
    })
  }

  const handleComment = async (data: { nickname: string; content: string; parent_id?: string }) => {
    if (!topic) return
    const comment = await postTopicComment(topic.id, data)
    if (comment) setComments((prev) => [...prev, comment])
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">加载中...</div>
  }

  if (!topic) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">帖子不存在</p>
        <Link to="/forum" className="text-primary text-sm mt-2 inline-block">返回讨论区</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm mb-4" style={{color:'var(--c-tx-m)'}}>
        <Link
          to="/forum"
          className="transition-colors"
          style={{color:'var(--c-tx-m)'}}
          onMouseEnter={e => (e.currentTarget.style.color='var(--c-ac)')}
          onMouseLeave={e => (e.currentTarget.style.color='var(--c-tx-m)')}
        >
          讨论
        </Link>
        <span>/</span>
        <span style={{color:'var(--c-tx-d)'}}>正文</span>
      </div>

      <article>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 text-xs rounded-full" style={{
            background: 'var(--c-glow)',
            color: 'var(--c-tx-s)',
            border: '1px solid rgba(110,231,247,0.1)',
          }}>
            {categoryLabels[topic.category] || topic.category}
          </span>
          {topic.is_pinned && <span className="text-xs" style={{color:'#fbbf24'}}>置顶</span>}
        </div>

        <h1 className="text-2xl font-bold mb-3" style={{color:'var(--c-tx)'}}>{topic.title}</h1>

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-3 text-sm" style={{color:'var(--c-tx-m)'}}>
            <span className="font-medium" style={{color:'var(--c-ac)'}}>{topic.author_nick}</span>
            <span>{new Date(topic.created_at).toLocaleString('zh-CN')}</span>
            <span>{topic.view_count + 1} 浏览</span>
          </div>
          <ShareBar url={window.location.href} title={topic.title} />
        </div>

        <div className="prose-dark mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {topic.content}
          </ReactMarkdown>
        </div>

        <div className="pt-4 mb-6" style={{borderTop:'1px solid var(--c-bd)'}}>
          <Reactions
            reactions={topic.reactions}
            userReaction={topic.user_reaction}
            onReact={handleReact}
          />
        </div>
      </article>

      <div className="pt-6" style={{borderTop:'1px solid var(--c-bd)'}}>
        <CommentSection comments={comments} onSubmit={handleComment} />
      </div>
    </div>
  )
}
