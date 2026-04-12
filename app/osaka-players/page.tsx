'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoadingPanda from '@/components/LoadingPanda'

type OsakaPlayer = { id: number; name: string; enrollmentYear: number; isRetired: boolean }

const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEAR = new Date().getMonth() >= 3 ? CURRENT_YEAR : CURRENT_YEAR - 1

function gradeLabel(enrollmentYear: number): string {
  const grade = ACADEMIC_YEAR - enrollmentYear + 1
  if (grade < 1 || grade > 4) return `${enrollmentYear}年入学`
  return `${grade}年生`
}

export default function OsakaPlayersPage() {
  const [players, setPlayers] = useState<OsakaPlayer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editPlayer, setEditPlayer] = useState<OsakaPlayer | null>(null)
  const [form, setForm] = useState({ name: '', enrollmentYear: String(ACADEMIC_YEAR), isRetired: false })
  const [loading, setLoading] = useState(true)

  const fetchPlayers = async () => {
    const res = await fetch('/api/osaka-players')
    setPlayers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchPlayers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { name: form.name, enrollmentYear: Number(form.enrollmentYear), isRetired: form.isRetired }
    if (editPlayer) {
      await fetch(`/api/osaka-players/${editPlayer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/osaka-players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setShowForm(false)
    setEditPlayer(null)
    setForm({ name: '', enrollmentYear: String(ACADEMIC_YEAR), isRetired: false })
    fetchPlayers()
  }

  const handleEdit = (player: OsakaPlayer) => {
    setEditPlayer(player)
    setForm({ name: player.name, enrollmentYear: String(player.enrollmentYear), isRetired: player.isRetired })
    setShowForm(true)
  }

  const handleDelete = async (player: OsakaPlayer) => {
    if (!confirm(`「${player.name}」を削除しますか？`)) return
    await fetch(`/api/osaka-players/${player.id}`, { method: 'DELETE' })
    fetchPlayers()
  }

  const activePlayers = players.filter((p) => !p.isRetired)
  const retiredPlayers = players.filter((p) => p.isRetired)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">阪大選手</h1>
          <p className="text-gray-500 text-sm mt-1">現役 {activePlayers.length}名</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditPlayer(null); setForm({ name: '', enrollmentYear: String(ACADEMIC_YEAR), isRetired: false }) }}
          className="bg-[#1a2e4a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors"
        >
          ＋ 選手を追加
        </button>
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editPlayer ? '選手情報を編集' : '新しい選手を登録'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">氏名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="山田 花子"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">入学年度 *</label>
                <input
                  type="number"
                  value={form.enrollmentYear}
                  onChange={(e) => setForm({ ...form, enrollmentYear: e.target.value })}
                  required
                  min="2015"
                  max="2100"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRetired}
                onChange={(e) => setForm({ ...form, isRetired: e.target.checked })}
                className="w-4 h-4"
              />
              引退済み
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="bg-[#1a2e4a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors">
                {editPlayer ? '更新' : '登録'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditPlayer(null) }} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 選手一覧 */}
      {loading ? (
        <LoadingPanda />
      ) : players.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👊</div>
          <p>まだ選手が登録されていません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {activePlayers.length > 0 && (
            <div className="divide-y divide-gray-50">
              {activePlayers.map((player) => (
                <div key={player.id} className="px-4 py-3 flex items-center justify-between">
                  <Link href={`/osaka-players/${player.id}`} className="flex-1 hover:opacity-70 transition-opacity">
                    <span className="font-medium text-gray-800">{player.name}</span>
                    <span className="ml-2 text-sm text-gray-400">{gradeLabel(player.enrollmentYear)}</span>
                  </Link>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(player)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">編集</button>
                    <button onClick={() => handleDelete(player)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50">削除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {retiredPlayers.length > 0 && (
            <details className="px-4 py-3 border-t border-gray-100">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">引退済み {retiredPlayers.length}名</summary>
              <div className="divide-y divide-gray-50 mt-2 opacity-60">
                {retiredPlayers.map((player) => (
                  <div key={player.id} className="py-2 flex items-center justify-between">
                    <Link href={`/osaka-players/${player.id}`} className="flex-1 hover:opacity-70 transition-opacity">
                      <span className="font-medium text-gray-700">{player.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{player.enrollmentYear}年入学</span>
                    </Link>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(player)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">編集</button>
                      <button onClick={() => handleDelete(player)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50">削除</button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
