import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { fetchEditions, type Edition } from '../lib/api'

export default function ArchivePage() {
  const [editions, setEditions] = useState<Edition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchEditions()
        setEditions(data)
      } catch {
        // empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{color:'#a78bfa'}}><Clock size={20} /> 往期回顾</h1>

      {loading ? (
        <div className="text-center py-12" style={{color:'var(--c-tx-m)'}}>加载中...</div>
      ) : editions.length === 0 ? (
        <div className="text-center py-12" style={{color:'var(--c-tx-m)'}}>暂无往期内容</div>
      ) : (
        <div className="space-y-2">
          {editions.map((ed) => (
            <div
              key={ed.id}
              className="p-4 rounded-xl transition-all"
              style={{
                background: 'var(--c-bg-card)',
                border: '1px solid var(--c-bd)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium" style={{color:'var(--c-tx2)'}}>第 {ed.number} 期</h3>
                  <p className="text-sm" style={{color:'var(--c-tx-m)'}}>{ed.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/overseas/brief?edition=${ed.id}`}
                    className="px-3 py-1 text-sm rounded-full transition-colors"
                    style={{
                      background: 'rgba(56,189,248,0.12)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56,189,248,0.25)',
                    }}
                  >
                    海外
                  </Link>
                  <Link
                    to={`/domestic/brief?edition=${ed.id}`}
                    className="px-3 py-1 text-sm rounded-full transition-colors"
                    style={{
                      background: 'rgba(244,114,182,0.12)',
                      color: '#f472b6',
                      border: '1px solid rgba(244,114,182,0.25)',
                    }}
                  >
                    国内
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
