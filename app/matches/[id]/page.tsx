'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type MatchDetail = {
  id: number
  date: string
  matchType: string
  isTournamentFirst: boolean
  result: string | null
  notes: string | null
  team: { id: number; name: string; type: string }
  coach: { id: number; name: string; nickname: string | null } | null
  orderEntries: {
    id: number
    position: string
    player: { id: number; name: string; nickname: string | null; enrollmentYear: number }
  }[]
  matchResults: {
    id: number
    position: string
    result: string
    score: string | null
    notes: string | null
    osakaPlayer: { id: number; name: string; enrollmentYear: number } | null
    opponentPlayer: { id: number; name: string; nickname: string | null; enrollmentYear: number } | null
  }[]
}

const POS_LABEL: Record<string, string> = { SENPO: '先鋒', CHUKEN: '中堅', TAISHO: '大将' }
const RESULT_STYLE: Record<string, string> = {
  WIN: 'bg-green-100 text-green-700',
  LOSS: 'bg-red-100 text-red-700',
  DRAW: 'bg-gray-100 text-gray-600',
}
const RESULT_LABEL: Record<string, string> = { WIN: '勝', LOSS: '負', DRAW: '引分' }

const ACADEMIC_YEAR = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1
function gradeLabel(enrollmentYear: number) {
  const grade = ACADEMIC_YEAR - enrollmentYear + 1
  if (grade < 1 || grade > 4) return `${enrollmentYear}年入学`
  return `${grade}年生`
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/matches/${id}`).then((r) => r.json()).then((data) => {
      setMatch(data)
      setLoading(false)
    })
  }, [id])

  const handleDelete = async () => {
    if (!match) return
    if (!confirm('この試合記録を削除しますか？')) return
    await fetch(`/api/matches/${id}`, { method: 'DELETE' })
    router.push('/matches')
  }

  if (loading) return <p className="text-gray-400 text-center py-12">読み込み中...</p>
  if (!match) return <p className="text-red-500 text-center py-12">試合記録が見つかりません</p>

  const isPractice = match.matchType === 'PRACTICE'
  const positions = ['SENPO', 'CHUKEN', 'TAISHO'] as const
  const resultByPos = Object.fromEntries(
    match.matchResults.filter((r) => r.position).map((r) => [r.position!, r])
  )
  const orderByPos = Object.fromEntries(match.orderEntries.map((o) => [o.position, o]))
  // 練習試合：positionなしの個人対決
  const practiceResults = match.matchResults.filter((r) => !r.position)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div>
        <Link href="/matches" className="text-sm text-gray-400 hover:text-gray-600">← 試合記録一覧</Link>
        <div className="flex items-start justify-between mt-1">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{match.team.name}</h1>
              {match.result && (
                <span className={`text-base font-bold px-3 py-0.5 rounded-full ${RESULT_STYLE[match.result]}`}>
                  {RESULT_LABEL[match.result]}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className="text-sm text-gray-500">{new Date(match.date).toLocaleDateString('ja-JP')}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${match.matchType === 'OFFICIAL' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                {match.matchType === 'OFFICIAL' ? '公式戦' : '練習試合'}
              </span>
              {match.isTournamentFirst && (
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">トーナメント初戦</span>
              )}
            </div>
            {match.coach && (
              <p className="text-sm text-gray-500 mt-1">
                相手監督：{match.coach.name}{match.coach.nickname ? `（${match.coach.nickname}）` : ''}
              </p>
            )}
          </div>
          <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400 transition-colors px-2 py-1">削除</button>
        </div>
      </div>

      {/* 練習試合：個人対決リスト */}
      {isPractice && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">個人対決結果</h2>
            <p className="text-xs text-gray-400 mt-0.5">個人の相性データ（{practiceResults.length}件）</p>
          </div>
          {practiceResults.length === 0 ? (
            <p className="text-center text-gray-300 text-sm py-6">記録なし</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {practiceResults.map((r, i) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-gray-400 shrink-0">#{i + 1}</span>
                    <div className="text-sm min-w-0">
                      <span className="font-medium text-gray-800">{r.osakaPlayer?.name ?? '—'}</span>
                      {r.osakaPlayer && <span className="text-xs text-gray-400 ml-1">{gradeLabel(r.osakaPlayer.enrollmentYear)}</span>}
                    </div>
                    <span className="text-gray-300 text-xs shrink-0">vs</span>
                    <div className="text-sm min-w-0">
                      <span className="font-medium text-gray-800">{r.opponentPlayer?.name ?? '—'}</span>
                      {r.opponentPlayer && <span className="text-xs text-gray-400 ml-1">{gradeLabel(r.opponentPlayer.enrollmentYear)}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${RESULT_STYLE[r.result]}`}>
                      {RESULT_LABEL[r.result]}
                    </span>
                    {r.score && <div className="text-xs text-gray-400 mt-0.5">{r.score}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 公式戦：オーダーと個人戦結果テーブル */}
      {!isPractice && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">オーダー・個人戦結果</h2>
        </div>

        {/* テーブルヘッダー */}
        <div className="grid grid-cols-4 text-xs font-medium text-gray-400 px-4 py-2 border-b border-gray-100">
          <div>ポジション</div>
          <div>阪大選手</div>
          <div>相手選手</div>
          <div className="text-center">結果</div>
        </div>

        {positions.map((pos) => {
          const bout = resultByPos[pos]
          const order = orderByPos[pos]
          const opponentPlayer = bout?.opponentPlayer ?? order?.player ?? null
          return (
            <div key={pos} className="grid grid-cols-4 items-center px-4 py-3 border-b border-gray-50 last:border-0">
              <div>
                <span className="bg-[#1a2e4a] text-white text-xs font-bold px-2 py-0.5 rounded">{POS_LABEL[pos]}</span>
              </div>
              <div className="text-sm">
                {bout?.osakaPlayer ? (
                  <div>
                    <div className="font-medium text-gray-800">{bout.osakaPlayer.name}</div>
                    <div className="text-xs text-gray-400">{gradeLabel(bout.osakaPlayer.enrollmentYear)}</div>
                  </div>
                ) : <span className="text-gray-300">—</span>}
              </div>
              <div className="text-sm">
                {opponentPlayer ? (
                  <div>
                    <div className="font-medium text-gray-800">{opponentPlayer.name}</div>
                    {'nickname' in opponentPlayer && opponentPlayer.nickname && (
                      <div className="text-xs text-gray-400">（{opponentPlayer.nickname}）</div>
                    )}
                    <div className="text-xs text-gray-400">{gradeLabel(opponentPlayer.enrollmentYear)}</div>
                  </div>
                ) : <span className="text-gray-300">—</span>}
              </div>
              <div className="text-center">
                {bout?.result ? (
                  <div>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${RESULT_STYLE[bout.result]}`}>
                      {RESULT_LABEL[bout.result]}
                    </span>
                    {bout.score && <div className="text-xs text-gray-400 mt-0.5">{bout.score}</div>}
                  </div>
                ) : <span className="text-gray-300 text-sm">—</span>}
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* メモ */}
      {match.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">メモ</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{match.notes}</p>
        </div>
      )}

      {/* アクション */}
      <div className="flex gap-3">
        <Link
          href={`/teams/${match.team.id}`}
          className="flex-1 text-center border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          {match.team.name}の詳細
        </Link>
        <Link
          href="/matches/new"
          className="flex-1 text-center bg-[#1a2e4a] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors"
        >
          次の試合を記録
        </Link>
      </div>
    </div>
  )
}
