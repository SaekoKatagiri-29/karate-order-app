'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import LoadingPanda from '@/components/LoadingPanda'

type MatchResult = {
  id: number
  position: string | null
  result: string
  score: string | null
  osakaPlayerNotes: string | null
  opponentPlayerNotes: string | null
  match: { id: number; date: string; matchType: string; result: string | null; team: { name: string } }
  opponentPlayer: { id: number; name: string; nickname: string | null } | null
}

type OsakaPlayer = {
  id: number
  name: string
  enrollmentYear: number
  isRetired: boolean
  matchResults: MatchResult[]
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

export default function OsakaPlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [player, setPlayer] = useState<OsakaPlayer | null>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    fetch(`/api/osaka-players/${id}`)
      .then((r) => r.json())
      .then((data) => { setPlayer(data); setLoading(false) })
  }, [id])

  const handleSummarize = async () => {
    setSummaryLoading(true)
    setSummaryError('')
    setSummary('')
    try {
      const res = await fetch(`/api/osaka-players/${id}/summarize`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setSummaryError(data.error ?? 'エラーが発生しました')
      else setSummary(data.summary)
    } catch {
      setSummaryError('通信エラーが発生しました')
    } finally {
      setSummaryLoading(false)
    }
  }

  const renderSummary = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-bold text-gray-800 mt-4 mb-1">{line.replace(/^#{2,3} /, '')}</h4>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-gray-800 mt-3 text-sm">{line.replace(/\*\*/g, '')}</p>
      }
      const parts = line.split(/(\*\*[^*]+\*\*)/)
      const rendered = parts.map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
          : part
      )
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="text-sm text-gray-700 ml-4 list-disc">{rendered}</li>
      }
      if (line === '') return <div key={i} className="h-1" />
      return <p key={i} className="text-sm text-gray-700 leading-relaxed">{rendered}</p>
    })

  if (loading) return <LoadingPanda />
  if (!player) return <p className="text-red-500 text-center py-12">選手が見つかりません</p>

  const resultsWithNotes = player.matchResults.filter((r) => r.osakaPlayerNotes)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
          <Link href="/osaka-players" className="hover:text-gray-600">阪大選手</Link>
          <span>›</span>
          <span className="text-gray-600">{player.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
          {player.isRetired && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">引退済み</span>}
        </div>
        <p className="text-sm text-gray-500 mt-1">大阪大学 ・ {gradeLabel(player.enrollmentYear)}</p>
      </div>

      {/* 試合メモ一覧 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-1">試合メモ記録</h2>
        <p className="text-xs text-gray-400 mb-4">試合記録に入力された「阪大選手メモ」が表示されます</p>

        {resultsWithNotes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">まだメモが記録されていません</p>
        ) : (
          <div className="space-y-3">
            {resultsWithNotes.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">{new Date(r.match.date).toLocaleDateString('ja-JP')}</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{r.match.team.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${r.match.matchType === 'OFFICIAL' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {r.match.matchType === 'OFFICIAL' ? '公式戦' : '練習試合'}
                    </span>
                    {r.position && (
                      <span className="bg-[#1a2e4a] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        {POS_LABEL[r.position] ?? r.position}
                      </span>
                    )}
                    {r.opponentPlayer && (
                      <span className="text-xs text-gray-500">vs {r.opponentPlayer.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {r.result && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_STYLE[r.result]}`}>
                        {RESULT_LABEL[r.result]}
                      </span>
                    )}
                    <Link href={`/matches/${r.match.id}`} className="text-xs text-gray-400 hover:text-[#1a2e4a] hover:underline">
                      詳細 →
                    </Link>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.osakaPlayerNotes}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AIサマリ */}
      {resultsWithNotes.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-700">AIサマリ</h2>
              <p className="text-xs text-gray-400 mt-0.5">試合メモをもとにAIが傾向を要約します</p>
            </div>
            <button
              onClick={handleSummarize}
              disabled={summaryLoading}
              className="bg-[#1a2e4a] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {summaryLoading ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  分析中...
                </>
              ) : 'AIで要約する'}
            </button>
          </div>
          {summaryError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 mb-3">{summaryError}</div>
          )}
          {summary ? (
            <div className="space-y-1">{renderSummary(summary)}</div>
          ) : !summaryLoading && (
            <p className="text-gray-400 text-sm text-center py-4">
              「AIで要約する」ボタンを押すと、試合メモから組手の傾向をまとめます
            </p>
          )}
        </section>
      )}

      {/* 試合出場履歴 */}
      {player.matchResults.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">試合出場履歴</h2>
          <div className="space-y-1">
            {player.matchResults.map((r) => (
              <div key={r.id} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.position && (
                      <span className="bg-[#1a2e4a] text-white text-xs font-bold px-2 py-0.5 rounded">
                        {POS_LABEL[r.position] ?? r.position}
                      </span>
                    )}
                    <Link href={`/matches/${r.match.id}`} className="text-sm text-gray-500 hover:text-[#1a2e4a] hover:underline">
                      {new Date(r.match.date).toLocaleDateString('ja-JP')}
                    </Link>
                    <span className="text-xs text-gray-400">{r.match.team.name}</span>
                    <span className="text-xs text-gray-400">
                      {r.match.matchType === 'OFFICIAL' ? '公式戦' : '練習試合'}
                    </span>
                  </div>
                  {r.result && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_STYLE[r.result]}`}>
                      {RESULT_LABEL[r.result]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
