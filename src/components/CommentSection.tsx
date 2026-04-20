import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import type { Comment } from '../lib/api'
import { getWuxiaNick, setWuxiaNick } from '../lib/wuxiaName'

interface Props {
  comments: Comment[]
  onSubmit: (data: { nickname: string; content: string; parent_id?: string }) => void
}

export default function CommentSection({ comments, onSubmit }: Props) {
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  useEffect(() => {
    setNickname(getWuxiaNick())
  }, [])

  const handleNicknameChange = (val: string) => {
    setNickname(val)
    if (val.trim()) setWuxiaNick(val.trim())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !content.trim()) return
    onSubmit({ nickname: nickname.trim(), content: content.trim(), parent_id: replyTo || undefined })
    setContent('')
    setReplyTo(null)
  }

  const renderComment = (comment: Comment | null, depth = 0) => {
    if (!comment) return null
    return (
    <div
      key={comment.id}
      className={depth > 0 ? 'ml-6 pl-4' : ''}
      style={depth > 0 ? { borderLeft: '2px solid rgba(110,231,247,0.1)' } : undefined}
    >
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--c-ac)' }}>
            {comment.nickname}
          </span>
          <span className="text-xs" style={{ color: 'var(--c-tx-d)' }}>
            {new Date(comment.created_at).toLocaleString('zh-CN')}
          </span>
          <button
            onClick={() => setReplyTo(comment.id)}
            className="text-xs ml-auto transition-colors"
            style={{ color: 'var(--c-tx-m)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-ac)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-tx-m)')}
          >
            回复
          </button>
        </div>
        <p className="text-sm" style={{ color: 'var(--c-tx3)' }}>{comment.content}</p>
      </div>
      {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
    </div>
  )
  }

  return (
    <div>
      <h3 className="text-base font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--c-tx2)' }}>
        <MessageSquare size={16} style={{ color: 'var(--c-tx-m)' }} />
        评论 {comments.length > 0 && <span className="text-xs font-normal" style={{ color: 'var(--c-tx-m)' }}>({comments.length})</span>}
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors"
            style={{
              background: 'var(--c-bg-input)',
              border: '1px solid rgba(110,231,247,0.12)',
              color: 'var(--c-ac)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(110,231,247,0.35)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(110,231,247,0.12)')}
          />
          <div className="flex gap-2">
          <input
            type="text"
            placeholder={replyTo ? '回复...' : '说点什么...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg focus:outline-none transition-colors"
            style={{
              background: 'var(--c-bg-input)',
              border: '1px solid rgba(110,231,247,0.12)',
              color: 'var(--c-tx2)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(110,231,247,0.35)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(110,231,247,0.12)')}
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              background: 'rgba(110,231,247,0.15)',
              color: 'var(--c-ac)',
              border: '1px solid rgba(110,231,247,0.3)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(110,231,247,0.25)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(110,231,247,0.5)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(110,231,247,0.15)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(110,231,247,0.3)'
            }}
          >
            发送
          </button>
          </div>
        </div>
        {replyTo && (
          <div className="flex items-center gap-2 text-xs mt-2" style={{ color: 'var(--c-tx-m)' }}>
            <span>正在回复评论</span>
            <button
              onClick={() => setReplyTo(null)}
              className="transition-colors"
              style={{ color: 'var(--c-ac)' }}
            >
              取消
            </button>
          </div>
        )}
      </form>

      <div style={{ borderTop: '1px solid var(--c-bd-s)' }}>
        {comments.map((comment) => renderComment(comment))}
      </div>

      {comments.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--c-tx-d)' }}>
          暂无评论，来做第一个发言的人吧
        </p>
      )}
    </div>
  )
}
