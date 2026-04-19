import { Link } from 'react-router-dom'
import { Zap, BookOpen, Microscope } from 'lucide-react'
import type { Region, Tier } from '../lib/api'

interface Props {
  region: Region
  active: Tier
}

const tiers: { key: Tier; label: string; icon: typeof Zap; activeStyle: React.CSSProperties }[] = [
  {
    key: 'brief',
    label: '速览',
    icon: Zap,
    activeStyle: {
      background: 'rgba(52,211,153,0.15)',
      color: '#34d399',
      border: '1px solid rgba(52,211,153,0.3)',
    },
  },
  {
    key: 'deep',
    label: '阵营深读',
    icon: BookOpen,
    activeStyle: {
      background: 'rgba(167,139,250,0.15)',
      color: '#a78bfa',
      border: '1px solid rgba(167,139,250,0.3)',
    },
  },
  {
    key: 'analysis',
    label: '单条深析',
    icon: Microscope,
    activeStyle: {
      background: 'rgba(251,191,36,0.12)',
      color: '#fbbf24',
      border: '1px solid rgba(251,191,36,0.3)',
    },
  },
]

const inactiveStyle: React.CSSProperties = {
  color: 'var(--c-tx-s)',
  border: '1px solid transparent',
}

export default function TierSwitch({ region, active }: Props) {
  return (
    <div className="flex items-center gap-1 text-sm p-1 rounded-xl overflow-x-auto" style={{
      background: 'var(--c-bg-card)',
      border: '1px solid var(--c-bd)',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      {tiers.map(({ key, label, icon: Icon, activeStyle }) => (
        <Link
          key={key}
          to={`/${region}/${key}`}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all text-xs whitespace-nowrap"
          style={active === key ? activeStyle : inactiveStyle}
        >
          <Icon size={12} />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  )
}
