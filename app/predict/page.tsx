'use client'

import { useState, useEffect } from 'react'

type Team = { id: number; name: string; type: string }

export default function PredictPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamId, setTeamId] = useState('')
  const [isTournamentFirst, setIsTournamentFirst] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    prediction: string
    dataUsed: { officialMatchCount: number; practiceResultCount: number; activePlayerCount: number }
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then(setTeams)
  }, [])

  const handlePredict = async () => {
    if (!teamId) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: Number(teamId), isTournamentFirst }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'エラーが発生しました')
      } else {
        setResult(data)
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // マークダウン風の簡易レンダリング（太字・見出し）
  const renderPrediction = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-base font-bold text-gray-800 mt-5 mb-2">{line.replace('## ', '')}</h3>
      }
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-bold text-gray-700 mt-3 mb-1">{line.replace('### ', '')}</h4>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-gray-800 mt-3">{line.replace(/\*\*/g, '')}</p>
      }
      // インライン太字を処理
      const parts = line.split(/(\*\*[^*]+\*\*)/)
      const rendered = parts.map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
          : part
      )
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="text-sm text-gray-700 ml-4 list-disc">{rendered.map((p, j) => <span key={j}>{p}</span>)}</li>
      }
      if (line.startsWith('1.') || line.match(/^\d+\./)) {
        return <li key={i} className="text-sm text-gray-700 ml-4 list-decimal">{rendered.map((p, j) => <span key={j}>{p}</span>)}</li>
      }
      if (line === '') return <div key={i} className="h-1" />
      return <p key={i} className="text-sm text-gray-700 leading-relaxed">{rendered.map((p, j) => <span key={j}>{p}</span>)}</p>
    })
  }

  const selectedTeam = teams.find((t) => t.id === Number(teamId))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">オーダー予測</h1>
        <p className="text-gray-500 text-sm mt-1">AIが過去データをもとに次の試合のオーダーを予測します</p>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">対戦相手 *</label>
          <select
            value={teamId}
            onChange={(e) => { setTeamId(e.target.value); setResult(null) }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30"
          >
            <option value="">大学を選択してください</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}（{t.type === 'NATIONAL' ? '国立' : '公立'}）</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isTournamentFirst}
            onChange={(e) => setIsTournamentFirst(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">トーナメント初戦</span>
        </label>

        <button
          onClick={handlePredict}
          disabled={!teamId || loading}
          className="w-full bg-[#1a2e4a] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#243d5f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AIが分析中...
            </>
          ) : (
            '🤖 AIでオーダーを予測する'
          )}
        </button>
      </div>

      {/* エラー */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 予測結果 */}
      {result && (
        <div className="space-y-4">
          {/* データ使用状況 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-blue-700 mb-2">分析に使用したデータ（{selectedTeam?.name}）</p>
            <div className="flex gap-4 text-xs text-blue-600">
              <span>公式戦記録：{result.dataUsed.officialMatchCount}件</span>
              <span>練習試合対決：{result.dataUsed.practiceResultCount}件</span>
              <span>現役選手：{result.dataUsed.activePlayerCount}名</span>
            </div>
            {result.dataUsed.officialMatchCount === 0 && (
              <p className="text-xs text-amber-600 mt-1">⚠️ 公式戦データがないため、予測精度が低い場合があります</p>
            )}
          </div>

          {/* AI予測本文 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🤖</span>
              <h2 className="font-semibold text-gray-800">AI予測結果</h2>
            </div>
            <div className="space-y-1">
              {renderPrediction(result.prediction)}
            </div>
          </div>

          {/* 再予測 */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            再予測する
          </button>
        </div>
      )}
    </div>
  )
}
