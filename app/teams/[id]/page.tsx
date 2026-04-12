'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

type Coach = { id: number; name: string; nickname: string | null; startYear: number; endYear: number | null }
type Player = { id: number; name: string; nickname: string | null; enrollmentYear: number; isRetired: boolean }
type Team = { id: number; name: string; type: string; coaches: Coach[]; players: Player[] }

type MatchOrder = {
  id: number
  date: string
  matchType: string
  isTournamentFirst: boolean
  result: string | null
  orderEntries: {
    id: number
    position: string
    player: { id: number; name: string; nickname: string | null }
  }[]
}

const POS_LABEL: Record<string, string> = { SENPO: '先鋒', CHUKEN: '中堅', TAISHO: '大将' }
const RESULT_STYLE: Record<string, string> = {
  WIN: 'bg-green-100 text-green-700',
  LOSS: 'bg-red-100 text-red-700',
  DRAW: 'bg-gray-100 text-gray-600',
}
const RESULT_LABEL: Record<string, string> = { WIN: '勝', LOSS: '負', DRAW: '引分' }

const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEAR = new Date().getMonth() >= 3 ? CURRENT_YEAR : CURRENT_YEAR - 1

function gradeLabel(enrollmentYear: number): string {
  const grade = ACADEMIC_YEAR - enrollmentYear + 1
  if (grade < 1 || grade > 4) return `（${enrollmentYear}年入学）`
  return `${grade}年生`
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<MatchOrder[]>([])

  // コーチフォーム
  const [showCoachForm, setShowCoachForm] = useState(false)
  const [editCoach, setEditCoach] = useState<Coach | null>(null)
  const [coachForm, setCoachForm] = useState({ name: '', nickname: '', startYear: String(CURRENT_YEAR), endYear: '' })

  // 選手フォーム
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [editPlayer, setEditPlayer] = useState<Player | null>(null)
  const [playerForm, setPlayerForm] = useState({ name: '', nickname: '', enrollmentYear: String(ACADEMIC_YEAR), isRetired: false })

  const fetchTeam = async () => {
    const res = await fetch(`/api/teams/${id}`)
    if (res.ok) setTeam(await res.json())
    setLoading(false)
  }

  const fetchMatches = async () => {
    const res = await fetch(`/api/matches?teamId=${id}`)
    if (res.ok) {
      const data: MatchOrder[] = await res.json()
      // 公式戦のみ表示（オーダーが意味を持つ試合）
      setMatches(data.filter((m) => m.matchType === 'OFFICIAL' && m.orderEntries.length > 0))
    }
  }

  useEffect(() => {
    fetchTeam()
    fetchMatches()
  }, [id])

  // --- Coach handlers ---
  const handleCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      name: coachForm.name,
      nickname: coachForm.nickname || null,
      startYear: Number(coachForm.startYear),
      endYear: coachForm.endYear ? Number(coachForm.endYear) : null,
      teamId: Number(id),
    }
    if (editCoach) {
      await fetch(`/api/coaches/${editCoach.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/coaches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setShowCoachForm(false)
    setEditCoach(null)
    setCoachForm({ name: '', nickname: '', startYear: String(CURRENT_YEAR), endYear: '' })
    fetchTeam()
  }

  const handleCoachEdit = (coach: Coach) => {
    setEditCoach(coach)
    setCoachForm({ name: coach.name, nickname: coach.nickname ?? '', startYear: String(coach.startYear), endYear: coach.endYear ? String(coach.endYear) : '' })
    setShowCoachForm(true)
  }

  const handleCoachDelete = async (coach: Coach) => {
    if (!confirm(`監督「${coach.name}」を削除しますか？`)) return
    await fetch(`/api/coaches/${coach.id}`, { method: 'DELETE' })
    fetchTeam()
  }

  // --- Player handlers ---
  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      name: playerForm.name,
      nickname: playerForm.nickname || null,
      enrollmentYear: Number(playerForm.enrollmentYear),
      isRetired: playerForm.isRetired,
      teamId: Number(id),
    }
    if (editPlayer) {
      await fetch(`/api/players/${editPlayer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setShowPlayerForm(false)
    setEditPlayer(null)
    setPlayerForm({ name: '', nickname: '', enrollmentYear: String(ACADEMIC_YEAR), isRetired: false })
    fetchTeam()
  }

  const handlePlayerEdit = (player: Player) => {
    setEditPlayer(player)
    setPlayerForm({ name: player.name, nickname: player.nickname ?? '', enrollmentYear: String(player.enrollmentYear), isRetired: player.isRetired })
    setShowPlayerForm(true)
  }

  const handlePlayerDelete = async (player: Player) => {
    if (!confirm(`選手「${player.name}」を削除しますか？`)) return
    await fetch(`/api/players/${player.id}`, { method: 'DELETE' })
    fetchTeam()
  }

  if (loading) return <p className="text-gray-400 text-center py-12">読み込み中...</p>
  if (!team) return <p className="text-red-500 text-center py-12">チームが見つかりません</p>

  const activePlayers = team.players.filter((p) => !p.isRetired)
  const retiredPlayers = team.players.filter((p) => p.isRetired)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <Link href="/teams" className="text-sm text-gray-400 hover:text-gray-600">← 対戦大学一覧</Link>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-2xl font-bold text-gray-800">{team.name}</h1>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            {team.type === 'NATIONAL' ? '国立' : '公立'}
          </span>
        </div>
      </div>

      {/* 監督セクション */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">監督</h2>
          <button
            onClick={() => { setShowCoachForm(true); setEditCoach(null); setCoachForm({ name: '', nickname: '', startYear: String(CURRENT_YEAR), endYear: '' }) }}
            className="text-sm text-[#1a2e4a] hover:underline"
          >
            ＋ 追加
          </button>
        </div>

        {showCoachForm && (
          <form onSubmit={handleCoachSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">氏名 *</label>
                <input type="text" value={coachForm.name} onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })} required placeholder="山田 太郎" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">あだ名</label>
                <input type="text" value={coachForm.nickname} onChange={(e) => setCoachForm({ ...coachForm, nickname: e.target.value })} placeholder="やまだ先生" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">就任年 *</label>
                <input type="number" value={coachForm.startYear} onChange={(e) => setCoachForm({ ...coachForm, startYear: e.target.value })} required min="2000" max="2100" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">退任年（現職なら空欄）</label>
                <input type="number" value={coachForm.endYear} onChange={(e) => setCoachForm({ ...coachForm, endYear: e.target.value })} min="2000" max="2100" placeholder="現職" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[#1a2e4a] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#243d5f] transition-colors">{editCoach ? '更新' : '登録'}</button>
              <button type="button" onClick={() => { setShowCoachForm(false); setEditCoach(null) }} className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">キャンセル</button>
            </div>
          </form>
        )}

        {team.coaches.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">監督が登録されていません</p>
        ) : (
          <div className="space-y-2">
            {team.coaches.map((coach) => (
              <div key={coach.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-gray-800">{coach.name}</span>
                  {coach.nickname && <span className="ml-2 text-sm text-gray-400">（{coach.nickname}）</span>}
                  {!coach.endYear && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">現職</span>}
                  <div className="text-xs text-gray-400 mt-0.5">
                    {coach.startYear}年〜{coach.endYear ? `${coach.endYear}年` : '現在'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleCoachEdit(coach)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">編集</button>
                  <button onClick={() => handleCoachDelete(coach)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50">削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 過去オーダーセクション */}
      {matches.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">過去のオーダー（公式戦）</h2>
          <div className="space-y-3">
            {matches.map((match) => {
              const orderByPos = Object.fromEntries(match.orderEntries.map((o) => [o.position, o]))
              return (
                <div key={match.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(match.date).toLocaleDateString('ja-JP')}
                    </span>
                    {match.isTournamentFirst && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">初戦</span>
                    )}
                    {match.result && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_STYLE[match.result]}`}>
                        {RESULT_LABEL[match.result]}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {(['SENPO', 'CHUKEN', 'TAISHO'] as const).map((pos) => {
                      const entry = orderByPos[pos]
                      return (
                        <div key={pos} className="flex items-center gap-1.5">
                          <span className="bg-[#1a2e4a] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                            {POS_LABEL[pos]}
                          </span>
                          {entry ? (
                            <Link
                              href={`/players/${entry.player.id}`}
                              className="text-sm text-gray-800 hover:text-[#1a2e4a] hover:underline"
                            >
                              {entry.player.name}
                              {entry.player.nickname && (
                                <span className="text-xs text-gray-400 ml-1">（{entry.player.nickname}）</span>
                              )}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 選手セクション */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">選手一覧</h2>
          <button
            onClick={() => { setShowPlayerForm(true); setEditPlayer(null); setPlayerForm({ name: '', nickname: '', enrollmentYear: String(ACADEMIC_YEAR), isRetired: false }) }}
            className="text-sm text-[#1a2e4a] hover:underline"
          >
            ＋ 追加
          </button>
        </div>

        {showPlayerForm && (
          <form onSubmit={handlePlayerSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">氏名 *</label>
                <input type="text" value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} required placeholder="鈴木 花子" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">あだ名</label>
                <input type="text" value={playerForm.nickname} onChange={(e) => setPlayerForm({ ...playerForm, nickname: e.target.value })} placeholder="はなちゃん" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">入学年度 *</label>
                <input type="number" value={playerForm.enrollmentYear} onChange={(e) => setPlayerForm({ ...playerForm, enrollmentYear: e.target.value })} required min="2015" max="2100" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={playerForm.isRetired} onChange={(e) => setPlayerForm({ ...playerForm, isRetired: e.target.checked })} className="w-4 h-4" />
                  引退済み
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[#1a2e4a] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#243d5f] transition-colors">{editPlayer ? '更新' : '登録'}</button>
              <button type="button" onClick={() => { setShowPlayerForm(false); setEditPlayer(null) }} className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">キャンセル</button>
            </div>
          </form>
        )}

        {team.players.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">選手が登録されていません</p>
        ) : (
          <>
            {activePlayers.length > 0 && (
              <div className="space-y-2">
                {activePlayers.map((player) => (
                  <PlayerRow key={player.id} player={player} onEdit={handlePlayerEdit} onDelete={handlePlayerDelete} />
                ))}
              </div>
            )}
            {retiredPlayers.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">引退済み選手 {retiredPlayers.length}名</summary>
                <div className="space-y-2 mt-2 opacity-60">
                  {retiredPlayers.map((player) => (
                    <PlayerRow key={player.id} player={player} onEdit={handlePlayerEdit} onDelete={handlePlayerDelete} />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function PlayerRow({ player, onEdit, onDelete }: { player: Player; onEdit: (p: Player) => void; onDelete: (p: Player) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <Link href={`/players/${player.id}`} className="flex-1 min-w-0 hover:text-[#1a2e4a] transition-colors">
        <span className="font-medium text-gray-800">{player.name}</span>
        {player.nickname && <span className="ml-2 text-sm text-gray-400">（{player.nickname}）</span>}
        <span className="ml-2 text-xs text-gray-400">{gradeLabel(player.enrollmentYear)}</span>
      </Link>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(player)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">編集</button>
        <button onClick={() => onDelete(player)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50">削除</button>
      </div>
    </div>
  )
}

