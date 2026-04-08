'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Match = {
  id: number
  date: string
  matchType: string
  isTournamentFirst: boolean
  result: string | null
  team: { id: number; name: string }
  coach: { id: number; name: string; nickname: string | null } | null
}

const RESULT_STYLE: Record<string, string> = {
  WIN: 'bg-green-100 text-green-700',
  LOSS: 'bg-red-100 text-red-700',
  DRAW: 'bg-gray-100 text-gray-600',
}
const RESULT_LABEL: Record<string, string> = { WIN: '勝', LOSS: '負', DRAW: '引分' }

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filterTeam, setFilterTeam] = useState('')
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMatches = async (teamId?: string) => {
    const url = teamId ? `/api/matches?teamId=${teamId}` : '/api/matches'
    const res = await fetch(url)
    setMatches(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then(setTeams)
    fetchMatches()
  }, [])

  const handleFilterChange = (teamId: string) => {
    setFilterTeam(teamId)
    setLoading(true)
    fetchMatches(teamId || undefined)
  }

  // 年ごとにグループ化
  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const year = new Date(m.date).getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(m)
    return acc
  }, {})
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">試合記録</h1>
          <p className="text-gray-500 text-sm mt-1">{matches.length}件の記録</p>
        </div>
        <Link
          href="/matches/new"
          className="bg-[#1a2e4a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors"
        >
          ＋ 試合を記録
        </Link>
      </div>

      {/* フィルター */}
      <div>
        <select
          value={filterTeam}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 bg-white"
        >
          <option value="">全大学</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">読み込み中...</p>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>試合記録がありません</p>
          <Link href="/matches/new" className="mt-4 inline-block text-[#1a2e4a] text-sm hover:underline">
            最初の試合を記録する →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {years.map((year) => (
            <div key={year}>
              <h2 className="text-sm font-semibold text-gray-400 mb-2">{year}年</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {grouped[year].map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{match.team.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${match.matchType === 'OFFICIAL' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {match.matchType === 'OFFICIAL' ? '公式戦' : '練習試合'}
                        </span>
                        {match.isTournamentFirst && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">初戦</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(match.date).toLocaleDateString('ja-JP')}
                        {match.coach && ` ・ ${match.coach.name}${match.coach.nickname ? `（${match.coach.nickname}）` : ''}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {match.result ? (
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${RESULT_STYLE[match.result]}`}>
                          {RESULT_LABEL[match.result]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">未記入</span>
                      )}
                      <span className="text-gray-300 text-sm">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
