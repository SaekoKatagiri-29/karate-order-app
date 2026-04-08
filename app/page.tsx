import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function Home() {
  const [teamCount, playerCount, osakaPlayerCount, matchCount] = await Promise.all([
    prisma.team.count(),
    prisma.player.count({ where: { isRetired: false } }),
    prisma.osakaPlayer.count({ where: { isRetired: false } }),
    prisma.match.count(),
  ])

  const recentMatches = await prisma.match.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: { team: true, coach: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mt-1">大阪大学空手道部 女子組手 オーダー管理</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="登録大学数" value={teamCount} unit="校" color="bg-blue-500" />
        <StatCard label="相手選手（現役）" value={playerCount} unit="名" color="bg-green-500" />
        <StatCard label="阪大選手（現役）" value={osakaPlayerCount} unit="名" color="bg-purple-500" />
        <StatCard label="試合記録数" value={matchCount} unit="件" color="bg-orange-500" />
      </div>

      {/* クイックアクセス */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">クイックアクセス</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/teams" className="block p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏫</span>
              <div>
                <div className="font-semibold text-gray-800">対戦大学管理</div>
                <div className="text-sm text-gray-500">大学・監督・選手の登録・編集</div>
              </div>
            </div>
          </Link>
          <Link href="/osaka-players" className="block p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👊</span>
              <div>
                <div className="font-semibold text-gray-800">阪大選手管理</div>
                <div className="text-sm text-gray-500">大阪大学の選手情報</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 最近の試合記録 */}
      {recentMatches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">最近の試合記録</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {recentMatches.map((match) => (
              <div key={match.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{match.team.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {match.matchType === 'OFFICIAL' ? '公式戦' : '練習試合'}
                    {match.isTournamentFirst && ' ・ 初戦'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {new Date(match.date).toLocaleDateString('ja-JP')}
                  </span>
                  {match.result && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      match.result === 'WIN' ? 'bg-green-100 text-green-700' :
                      match.result === 'LOSS' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {match.result === 'WIN' ? '勝' : match.result === 'LOSS' ? '負' : '引分'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, unit, color }: {
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
      <div className="text-2xl font-bold text-gray-800">
        {value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
