'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import LoadingPanda from '@/components/LoadingPanda'

type Analysis = {
  id: number
  matchDate: string | null
  matchName: string | null
  content: string
  createdAt: string
  match: { id: number; date: string; matchType: string } | null
}

type OrderEntry = {
  id: number
  position: string
  match: { id: number; date: string; matchType: string; result: string | null; notes: string | null; team: { name: string } }
}

type MatchResult = {
  id: number
  position: string | null
  result: string
  score: string | null
  notes: string | null
  match: { id: number; date: string; matchType: string; notes: string | null }
  osakaPlayer: { id: number; name: string } | null
}

type Player = {
  id: number
  name: string
  nickname: string | null
  enrollmentYear: number
  isRetired: boolean
  team: { id: number; name: string; type: string }
  analyses: Analysis[]
  orderEntries: OrderEntry[]
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

export default function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  // 分析フォーム
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ matchDate: '', matchName: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  // AIサマリ
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  const fetchPlayer = async () => {
    const res = await fetch(`/api/players/${id}`)
    if (res.ok) setPlayer(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchPlayer() }, [id])

  const handleAddAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.content.trim()) return
    setSubmitting(true)
    await fetch('/api/player-analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: Number(id),
        matchDate: form.matchDate || null,
        matchName: form.matchName || null,
        content: form.content,
      }),
    })
    setForm({ matchDate: '', matchName: '', content: '' })
    setShowForm(false)
    setSubmitting(false)
    setSummary('')
    fetchPlayer()
  }

  const handleDeleteAnalysis = async (analysisId: number) => {
    if (!confirm('この分析メモを削除しますか？')) return
    await fetch(`/api/player-analyses/${analysisId}`, { method: 'DELETE' })
    setSummary('')
    fetchPlayer()
  }

  const handleSummarize = async () => {
    setSummaryLoading(true)
    setSummaryError('')
    setSummary('')
    try {
      const res = await fetch(`/api/players/${id}/summarize`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setSummaryError(data.error ?? 'エラーが発生しました')
      } else {
        setSummary(data.summary)
      }
    } catch {
      setSummaryError('通信エラーが発生しました')
    } finally {
      setSummaryLoading(false)
    }
  }

  const renderSummary = (text: string) => {
    return text.split('\n').map((line, i) => {
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
  }

  if (loading) return <LoadingPanda />
  if (!player) return <p className="text-red-500 text-center py-12">選手が見つかりません</p>

  const analysisDateOf = (a: Analysis) =>
    a.matchDate
      ? formatDate(a.matchDate)
      : a.match?.date
        ? formatDate(a.match.date)
        : null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
          <Link href="/teams" className="hover:text-gray-600">対戦大学</Link>
          <span>›</span>
          <Link href={`/teams/${player.team.id}`} className="hover:text-gray-600">{player.team.name}</Link>
          <span>›</span>
          <span className="text-gray-600">{player.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
          {player.nickname && <span className="text-gray-500">（{player.nickname}）</span>}
          {player.isRetired && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">引退済み</span>}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {player.team.name} ・ {gradeLabel(player.enrollmentYear)}
        </p>
      </div>

      {/* 分析メモセクション */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-700">組手分析メモ</h2>
            <p className="text-xs text-gray-400 mt-0.5">{player.analyses.length}件の記録</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#1a2e4a] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors"
          >
            ＋ 分析を追加
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddAnalysis} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">試合日（任意）</label>
                <input
                  type="date"
                  value={form.matchDate}
                  onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">試合名（任意）</label>
                <input
                  type="text"
                  value={form.matchName}
                  onChange={(e) => setForm({ ...form, matchName: e.target.value })}
                  placeholder="例：関西学生選手権2025"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">分析内容 *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                rows={4}
                placeholder="組手スタイル、得意技、傾向などを記入してください"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#1a2e4a] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#243d5f] transition-colors disabled:opacity-50"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm({ matchDate: '', matchName: '', content: '' }) }}
                className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        {player.analyses.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">分析メモがまだありません</p>
        ) : (
          <div className="space-y-3">
            {player.analyses.map((a) => {
              const dateStr = analysisDateOf(a)
              return (
                <div key={a.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {dateStr && (
                        <span className="text-xs text-gray-400">{dateStr}</span>
                      )}
                      {a.matchName && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{a.matchName}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAnalysis(a.id)}
                      className="text-xs text-gray-300 hover:text-red-400 shrink-0 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* AIサマリセクション */}
      {player.analyses.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-700">AIサマリ</h2>
              <p className="text-xs text-gray-400 mt-0.5">分析メモをもとにAIが傾向を要約します</p>
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
              ) : (
                'AIで要約する'
              )}
            </button>
          </div>

          {summaryError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 mb-3">
              {summaryError}
            </div>
          )}

          {summary ? (
            <div className="space-y-1">
              {renderSummary(summary)}
            </div>
          ) : !summaryLoading && (
            <p className="text-gray-400 text-sm text-center py-4">
              「AIで要約する」ボタンを押すと、分析メモから組手スタイルの傾向をまとめます
            </p>
          )}
        </section>
      )}

      {/* 試合出場履歴セクション */}
      {player.orderEntries.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">試合出場履歴</h2>
          <div className="space-y-1">
            {player.orderEntries.map((entry) => {
              // 同じ試合のMatchResultを探してbout-specific notesを取得
              const boutResult = player.matchResults.find(
                (r) => r.match.id === entry.match.id && r.position === entry.position
              )
              const matchNotes = entry.match.notes
              const boutNotes = boutResult?.notes
              return (
                <div key={entry.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#1a2e4a] text-white text-xs font-bold px-2 py-0.5 rounded">
                        {POS_LABEL[entry.position] ?? entry.position}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(entry.match.date)}</span>
                      <span className="text-xs text-gray-400">
                        {entry.match.matchType === 'OFFICIAL' ? '公式戦' : '練習試合'}
                      </span>
                    </div>
                    {entry.match.result && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_STYLE[entry.match.result]}`}>
                        {RESULT_LABEL[entry.match.result]}
                      </span>
                    )}
                  </div>
                  {boutNotes && (
                    <p className="mt-1.5 ml-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 whitespace-pre-wrap">
                      <span className="text-gray-400 mr-1">対戦メモ:</span>{boutNotes}
                    </p>
                  )}
                  {matchNotes && (
                    <p className="mt-1 ml-1 text-xs text-gray-400 bg-gray-50 rounded px-2 py-1 whitespace-pre-wrap">
                      <span className="mr-1">試合メモ:</span>{matchNotes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
