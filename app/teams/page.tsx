'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoadingPanda from '@/components/LoadingPanda'

type Team = {
  id: number
  name: string
  type: string
  coaches: { id: number; name: string; nickname: string | null; startYear: number; endYear: number | null }[]
  _count: { players: number; matches: number }
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [form, setForm] = useState({ name: '', type: 'NATIONAL' })
  const [loading, setLoading] = useState(true)

  const fetchTeams = async () => {
    const res = await fetch('/api/teams')
    const data = await res.json()
    setTeams(data)
    setLoading(false)
  }

  useEffect(() => { fetchTeams() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editTeam) {
      await fetch(`/api/teams/${editTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    setEditTeam(null)
    setForm({ name: '', type: 'NATIONAL' })
    fetchTeams()
  }

  const handleEdit = (team: Team) => {
    setEditTeam(team)
    setForm({ name: team.name, type: team.type })
    setShowForm(true)
  }

  const handleDelete = async (team: Team) => {
    if (!confirm(`「${team.name}」を削除しますか？\n関連する監督・選手データもすべて削除されます。`)) return
    await fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
    fetchTeams()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditTeam(null)
    setForm({ name: '', type: 'NATIONAL' })
  }

  const currentCoach = (team: Team) =>
    team.coaches.find((c) => !c.endYear) ?? team.coaches[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">大学一覧</h1>
          <p className="text-gray-500 text-sm mt-1">大阪大学・対戦校 {teams.length + 1}校</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1a2e4a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors"
        >
          ＋ 大学を追加
        </button>
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editTeam ? '大学情報を編集' : '新しい大学を登録'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">大学名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：京都大学"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">種別 *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30"
              >
                <option value="NATIONAL">国立大学</option>
                <option value="PUBLIC">公立大学</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="bg-[#1a2e4a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243d5f] transition-colors"
              >
                {editTeam ? '更新' : '登録'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 大学一覧 */}
      {loading ? (
        <LoadingPanda />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {/* 大阪大学（自チーム）*/}
          <Link
            href="/osaka-players"
            className="bg-[#1a2e4a] text-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:bg-[#243d5f] transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">大阪大学</h3>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">自チーム</span>
              </div>
              <div className="text-xs text-white/70 mt-1">阪大選手一覧を見る</div>
            </div>
            <span className="text-white/60 text-lg">›</span>
          </Link>

          {teams.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🏫</div>
              <p>対戦大学が登録されていません</p>
            </div>
          ) : teams.map((team) => {
            const coach = currentCoach(team)
            return (
              <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/teams/${team.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 hover:text-[#1a2e4a] transition-colors">
                        {team.name}
                      </h3>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {team.type === 'NATIONAL' ? '国立' : '公立'}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-4 text-sm text-gray-500">
                      <span>
                        監督：{coach ? `${coach.name}${coach.nickname ? `（${coach.nickname}）` : ''}` : '未登録'}
                        {coach && !coach.endYear && <span className="ml-1 text-xs text-green-600">現職</span>}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-gray-400">
                      <span>選手 {team._count.players}名</span>
                      <span>試合記録 {team._count.matches}件</span>
                    </div>
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(team)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(team)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
