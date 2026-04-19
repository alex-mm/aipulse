import type { ReactNode } from 'react'
import { ThumbsUp, Flame, Lightbulb } from 'lucide-react'

interface Props {
  reactions: { like: number; fire: number; insightful: number }
  userReaction?: string | null
  onReact: (type: string) => void
}

const iconMap: Record<string, { icon: ReactNode; label: string }> = {
  like: { icon: <ThumbsUp size={13} />, label: '赞' },
  fire: { icon: <Flame size={13} />, label: '火' },
  insightful: { icon: <Lightbulb size={13} />, label: '有洞察' },
}

export default function Reactions({ reactions, userReaction, onReact }: Props) {
  return (
    <div className="flex items-center gap-2">
      {Object.entries(iconMap).map(([type, { icon, label }]) => {
        const active = userReaction === type
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
            style={active ? {
              background: 'rgba(110,231,247,0.12)',
              color: 'var(--c-ac)',
              border: '1px solid rgba(110,231,247,0.3)',
            } : {
              background: 'var(--c-bg-card)',
              color: 'var(--c-tx-s)',
              border: '1px solid var(--c-bd)',
            }}
          >
            {icon}
            <span className="text-xs">{label}</span>
            <span className="text-xs">{reactions[type as keyof typeof reactions] || 0}</span>
          </button>
        )
      })}
    </div>
  )
}
