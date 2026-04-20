import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTopic, type TopicCategory } from '../lib/api'
import { getWuxiaNick, setWuxiaNick } from '../lib/wuxiaName'

const categories: { key: TopicCategory; label: string }[] = [
  { key: 'discussion', label: '讨论' },
  { key: 'share', label: '分享' },
  { key: 'question', label: '提问' },
  { key: 'casual', label: '水贴' },
]

export default function NewTopicPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<TopicCategory>('discussion')
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setNickname(getWuxiaNick())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !nickname.trim()) return
    setSubmitting(true)
    try {
      const topic = await createTopic({
        title: title.trim(),
        content: content.trim(),
        category,
        author_nick: nickname.trim(),
      })
      navigate(`/forum/${topic.id}`)
    } catch {
      alert('发帖失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl font-bold mb-6">发帖</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); if (e.target.value.trim()) setWuxiaNick(e.target.value.trim()) }}
            placeholder="你的昵称"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <div className="flex items-center gap-2">
            {categories.map(({ key, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => setCategory(key)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  category === key
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="帖子标题"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="支持 Markdown 格式..."
            rows={8}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim() || !nickname.trim()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? '发布中...' : '发布'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/forum')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
