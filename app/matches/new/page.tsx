'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Team = { id: number; name: string; type: string }
type Coach = { id: number; name: string; nickname: string | null; startYear: number; endYear: number | null }
type Player = { id: number; name: string; nickname: string | null; enrollmentYear: number; isRetired: boolean }
type OsakaPlayer = { id: number; name: string; enrollmentYear: number; isRetired: boolean }

const POSITIONS = [
  { key: 'SENPO', label: '先鋒' },
  { key: 'CHUKEN', label: '中堅' },
  { key: 'TAISHO', label: '大将' },
] as const

const RESULTS = [
  { value: 'WIN', label: '勝', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'LOSS', label: '負', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'DRAW', label: '引分', color: 'bg-gray-100 text-gray-600 border-gray-300' },
]

const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEAR = new Date().getMonth() >= 3 ? CURRENT_YEAR : CURRENT_YEAR - 1

function gradeLabel(enrollmentYear: number) {
  const grade = ACADEMIC_YEAR - enrollmentYear + 1
  if (grade < 1 || grade > 4) return `${enrollmentYear}年入学`
  return `${grade}年生`
}

function playerDisplayName(p: Player | OsakaPlayer) {
  const name = 'nickname' in p && p.nickname ? `${p.name}（${p.nickname}）` : p.name
  return `${name} / ${gradeLabel(p.enrollmentYear)}`
}

// 公式戦の個人戦結果（先鋒/中堅/大将固定）
type OfficialBout = { osakPlayerId: string; result: string; score: string }
// 練習試合の個人対決（自由追加）
type PracticeBout = { id: number; osakPlayerId: string; opponentPlayerId: string; result: string; score: string }

export default function NewMatchPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [teams, setTeams] = useState<Team[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [opponentPlayers, setOpponentPlayers] = useState<Player[]>([])
  const [osakaPlayers, setOsakaPlayers] = useState<OsakaPlayer[]>([])

  // Step1
  const [basicInfo, setBasicInfo] = useState({
    teamId: '',
    coachId: '',
    date: new Date().toISOString().slice(0, 10),
    matchType: 'OFFICIAL',
    isTournamentFirst: false,
  })

  // Step2: 公式戦オーダー
  const [orders, setOrders] = useState<Record<string, string>>({ SENPO: '', CHUKEN: '', TAISHO: '' })

  // Step3: 公式戦個人戦結果（先鋒/中堅/大将）
  const [officialBouts, setOfficialBouts] = useState<Record<string, OfficialBout>>({
    SENPO: { osakPlayerId: '', result: '', score: '' },
    CHUKEN: { osakPlayerId: '', result: '', score: '' },
    TAISHO: { osakPlayerId: '', result: '', score: '' },
  })

  // Step3: 練習試合個人対決（自由追加）
  const newPracticeBout = (): PracticeBout => ({
    id: Date.now(), osakPlayerId: '', opponentPlayerId: '', result: '', score: '',
  })
  const [practiceBouts, setPracticeBouts] = useState<PracticeBout[]>([newPracticeBout()])

  const [teamResult, setTeamResult] = useState('')
  const [notes, setNotes] = useState('')

  const isPractice = basicInfo.matchType === 'PRACTICE'

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then(setTeams)
    fetch('/api/osaka-players').then((r) => r.json()).then((data) =>
      setOsakaPlayers(data.filter((p: OsakaPlayer) => !p.isRetired))
    )
  }, [])

  useEffect(() => {
    if (!basicInfo.teamId) { setCoaches([]); setOpponentPlayers([]); return }
    fetch(`/api/teams/${basicInfo.teamId}`).then((r) => r.json()).then((data) => {
      setCoaches(data.coaches ?? [])
      setOpponentPlayers((data.players ?? []).filter((p: Player) => !p.isRetired))
      setBasicInfo((prev) => ({ ...prev, coachId: '' }))
      setOrders({ SENPO: '', CHUKEN: '', TAISHO: '' })
    })
  }, [basicInfo.teamId])

  // 公式戦：個人戦からチーム結果を自動計算
  useEffect(() => {
    if (isPractice) return
    const results = POSITIONS.map((p) => officialBouts[p.key].result)
    const wins = results.filter((r) => r === 'WIN').length
    const losses = results.filter((r) => r === 'LOSS').length
    if (results.some((r) => !r)) return
    setTeamResult(wins > losses ? 'WIN' : losses > wins ? 'LOSS' : 'DRAW')
  }, [officialBouts, isPractice])

  const updateOfficialBout = (pos: string, field: string, value: string) =>
    setOfficialBouts((prev) => ({ ...prev, [pos]: { ...prev[pos], [field]: value } }))

  const updatePracticeBout = (id: number, field: string, value: string) =>
    setPracticeBouts((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b))

  const addPracticeBout = () => setPracticeBouts((prev) => [...prev, newPracticeBout()])

  const removePracticeBout = (id: number) =>
    setPracticeBouts((prev) => prev.length > 1 ? prev.filter((b) => b.id !== id) : prev)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const matchResults = isPractice
        ? practiceBouts
            .filter((b) => b.result)
            .map((b) => ({
              position: null,
              osakPlayerId: b.osakPlayerId || null,
              opponentPlayerId: b.opponentPlayerId || null,
              result: b.result,
              score: b.score || null,
            }))
        : POSITIONS.map((p) => ({
            position: p.key,
            osakPlayerId: officialBouts[p.key].osakPlayerId || null,
            opponentPlayerId: orders[p.key] || null,
            result: officialBouts[p.key].result || null,
            score: officialBouts[p.key].score || null,
          }))

      const payload = {
        date: basicInfo.date,
        teamId: Number(basicInfo.teamId),
        coachId: basicInfo.coachId ? Number(basicInfo.coachId) : null,
        matchType: basicInfo.matchType,
        isTournamentFirst: basicInfo.isTournamentFirst,
        result: teamResult || null,
        notes: notes || null,
        orders: isPractice ? [] : POSITIONS.map((p) => ({ position: p.key, playerId: orders[p.key] || null })),
        matchResults,
      }

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const match = await res.json()
        router.push(`/matches/${match.id}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const steps = isPractice
    ? [{ label: '基本情報' }, { label: '個人対決結果' }]
    : [{ label: '基本情報' }, { label: 'オーダー' }, { label: '個人戦結果' }]
  const displayStep = isPractice && step === 3 ? 2 : step

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← 戻る</button>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">試合記録の入力</h1>
      </div>

      {/* ステップインジケーター */}
      <div className="flex gap-2 items-center flex-wrap">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              displayStep === i + 1 ? 'bg-[#1a2e4a] text-white' :
              displayStep > i + 1 ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {displayStep > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm hidden md:inline ${displayStep === i + 1 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
        {isPractice && (
          <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">練習試合モード</span>
        )}
      </div>

      {/* ---- Step 1: 基本情報 ---- */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-700 text-lg">基本情報</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">対戦相手 *</label>
            <select value={basicInfo.teamId} onChange={(e) => setBasicInfo({ ...basicInfo, teamId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30">
              <option value="">大学を選択してください</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}（{t.type === 'NATIONAL' ? '国立' : '公立'}）</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">試合日 *</label>
            <input type="date" value={basicInfo.date} onChange={(e) => setBasicInfo({ ...basicInfo, date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">試合種別 *</label>
            <div className="flex gap-2">
              {[{ value: 'OFFICIAL', label: '公式戦' }, { value: 'PRACTICE', label: '練習試合' }].map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setBasicInfo({ ...basicInfo, matchType: opt.value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    basicInfo.matchType === opt.value ? 'bg-[#1a2e4a] text-white border-[#1a2e4a]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={basicInfo.isTournamentFirst}
              onChange={(e) => setBasicInfo({ ...basicInfo, isTournamentFirst: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm text-gray-700">トーナメント初戦</span>
          </label>

          {coaches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">相手チームの監督</label>
              <select value={basicInfo.coachId} onChange={(e) => setBasicInfo({ ...basicInfo, coachId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30">
                <option value="">監督を選択（任意）</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.nickname ? `（${c.nickname}）` : ''} / {c.startYear}年〜{c.endYear ? `${c.endYear}年` : '現在'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <button onClick={() => isPractice ? setStep(3) : setStep(2)}
              disabled={!basicInfo.teamId || !basicInfo.date}
              className="w-full bg-[#1a2e4a] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#243d5f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {isPractice ? '次へ：個人対決を入力' : '次へ：オーダーを入力'}
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 2: オーダー（公式戦のみ） ---- */}
      {step === 2 && !isPractice && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-700 text-lg">相手チームのオーダー</h2>
          <p className="text-sm text-gray-400">相手チームが出場させた選手を各ポジションに選択してください</p>

          {POSITIONS.map((pos) => (
            <div key={pos.key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                <span className="inline-block bg-[#1a2e4a] text-white text-xs px-2 py-0.5 rounded mr-2">{pos.label}</span>
                相手選手
              </label>
              <select value={orders[pos.key]} onChange={(e) => setOrders({ ...orders, [pos.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30">
                <option value="">選手を選択（任意）</option>
                {opponentPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{playerDisplayName(p)}</option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">戻る</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-[#1a2e4a] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#243d5f] transition-colors">次へ：個人戦結果を入力</button>
          </div>
        </div>
      )}

      {/* ---- Step 3a: 公式戦 個人戦結果（先鋒/中堅/大将） ---- */}
      {step === 3 && !isPractice && (
        <div className="space-y-4">
          {POSITIONS.map((pos) => {
            const opponentPlayer = opponentPlayers.find((p) => p.id === Number(orders[pos.key]))
            const bout = officialBouts[pos.key]
            return (
              <div key={pos.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1a2e4a] text-white text-sm font-bold px-3 py-1 rounded">{pos.label}</span>
                  {opponentPlayer && (
                    <span className="text-sm text-gray-500">vs {opponentPlayer.name}{opponentPlayer.nickname ? `（${opponentPlayer.nickname}）` : ''}</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">阪大の出場選手</label>
                  <select value={bout.osakPlayerId} onChange={(e) => updateOfficialBout(pos.key, 'osakPlayerId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30">
                    <option value="">選手を選択（任意）</option>
                    {osakaPlayers.map((p) => <option key={p.id} value={p.id}>{playerDisplayName(p)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">勝敗</label>
                  <div className="flex gap-2">
                    {RESULTS.map((r) => (
                      <button key={r.value} type="button"
                        onClick={() => updateOfficialBout(pos.key, 'result', bout.result === r.value ? '' : r.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${bout.result === r.value ? r.color : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">スコア（任意）</label>
                  <input type="text" value={bout.score} onChange={(e) => updateOfficialBout(pos.key, 'score', e.target.value)}
                    placeholder="例：3-1"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
                </div>
              </div>
            )
          })}

          <TeamResultSection teamResult={teamResult} setTeamResult={setTeamResult} notes={notes} setNotes={setNotes} autoLabel="個人戦から自動計算しました（変更可）" />

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">戻る</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 bg-[#1a2e4a] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#243d5f] transition-colors disabled:opacity-40">
              {submitting ? '保存中...' : '試合記録を保存'}
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 3b: 練習試合 個人対決（自由追加） ---- */}
      {step === 3 && isPractice && (
        <div className="space-y-4">
          {practiceBouts.map((bout, index) => (
            <div key={bout.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">試合 {index + 1}</span>
                {practiceBouts.length > 1 && (
                  <button onClick={() => removePracticeBout(bout.id)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors">削除</button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">阪大選手</label>
                  <select value={bout.osakPlayerId} onChange={(e) => updatePracticeBout(bout.id, 'osakPlayerId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30">
                    <option value="">選手を選択</option>
                    {osakaPlayers.map((p) => <option key={p.id} value={p.id}>{playerDisplayName(p)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">相手選手</label>
                  <select value={bout.opponentPlayerId} onChange={(e) => updatePracticeBout(bout.id, 'opponentPlayerId', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30">
                    <option value="">選手を選択</option>
                    {opponentPlayers.map((p) => <option key={p.id} value={p.id}>{playerDisplayName(p)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">勝敗（阪大視点）</label>
                <div className="flex gap-2">
                  {RESULTS.map((r) => (
                    <button key={r.value} type="button"
                      onClick={() => updatePracticeBout(bout.id, 'result', bout.result === r.value ? '' : r.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${bout.result === r.value ? r.color : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">スコア（任意）</label>
                <input type="text" value={bout.score} onChange={(e) => updatePracticeBout(bout.id, 'score', e.target.value)}
                  placeholder="例：3-1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30" />
              </div>
            </div>
          ))}

          {/* 試合追加ボタン */}
          <button onClick={addPracticeBout}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#1a2e4a] hover:text-[#1a2e4a] transition-colors">
            ＋ 試合を追加
          </button>

          {/* メモ・保存 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">メモ（任意）</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="練習試合の気づきなど" rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 resize-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">戻る</button>
            <button onClick={handleSubmit} disabled={submitting || practiceBouts.every((b) => !b.result)}
              className="flex-1 bg-[#1a2e4a] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#243d5f] transition-colors disabled:opacity-40">
              {submitting ? '保存中...' : '試合記録を保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TeamResultSection({ teamResult, setTeamResult, notes, setNotes, autoLabel }: {
  teamResult: string
  setTeamResult: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  autoLabel: string
}) {
  const RESULTS = [
    { value: 'WIN', label: '勝', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'LOSS', label: '負', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'DRAW', label: '引分', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  ]
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h3 className="font-semibold text-gray-700">チーム全体の結果</h3>
      <div className="flex gap-2">
        {RESULTS.map((r) => (
          <button key={r.value} type="button"
            onClick={() => setTeamResult(teamResult === r.value ? '' : r.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${teamResult === r.value ? r.color : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
            {r.label}
          </button>
        ))}
      </div>
      {teamResult && <p className="text-xs text-gray-400">{autoLabel}</p>}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">メモ（任意）</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="試合の気づきや特記事項など" rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 resize-none" />
      </div>
    </div>
  )
}
