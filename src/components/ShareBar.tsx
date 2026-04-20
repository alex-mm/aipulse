import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { getShareLinks } from '../lib/api'

interface Props {
  url: string
  title: string
}

export default function ShareBar({ url, title }: Props) {
  const [copied, setCopied] = useState(false)
  const links = getShareLinks(url, title)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs" style={{color:'var(--c-tx-m)'}}>分享到</span>
      {links.weibo && (
        <a href={links.weibo} target="_blank" rel="noopener"
          className="inline-flex items-center px-2.5 py-1 text-xs rounded-lg transition-all"
          style={{ background: 'rgba(234,111,26,0.1)', color: '#ea6f1a', border: '1px solid rgba(234,111,26,0.2)' }}
        >
          微博
        </a>
      )}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all"
        style={copied ? {
          background: 'rgba(52,211,153,0.12)',
          color: '#34d399',
          border: '1px solid rgba(52,211,153,0.3)',
        } : {
          background: 'var(--c-bg-card)',
          color: 'var(--c-tx-s)',
          border: '1px solid var(--c-bd)',
        }}
      >
        {copied ? <Check size={11} /> : <Link2 size={11} />}
        {copied ? '已复制' : '复制链接'}
      </button>
    </div>
  )
}
