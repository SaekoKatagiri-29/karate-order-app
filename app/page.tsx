import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const RESULT_STYLE: Record<string, string> = {
  WIN: 'bg-green-100 text-green-700',
  LOSS: 'bg-red-100 text-red-700',
  DRAW: 'bg-gray-100 text-gray-600',
}
const RESULT_LABEL: Record<string, string> = { WIN: '勝', LOSS: '負', DRAW: '引分' }

export default async function Home() {
  const [teamCount, playerCount, osakaPlayerCount, matchCount] = await Promise.all([
    prisma.team.count(),
    prisma.player.count({ where: { isRetired: false } }),
    prisma.osakaPlayer.count({ where: { isRetired: false } }),
    prisma.match.count(),
  ])

  const recentMatches = await prisma.match.findMany({
    take: 10,
    orderBy: { date: 'desc' },
    include: { team: true, coach: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ホーム</h1>
        <p className="text-gray-500 text-sm mt-1">大阪大学空手道部 試合・選手情報管理</p>
      </div>

      {/* 試合を記録するボタン */}
      <Link
        href="/matches/new"
        className="flex items-center justify-center gap-3 w-full bg-[#1a2e4a] text-white py-4 rounded-xl font-semibold text-base hover:bg-[#243d5f] transition-colors shadow-sm"
      >
        <span className="text-2xl">📝</span>
        試合を記録する
      </Link>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="登録大学数" value={teamCount} unit="校" color="bg-blue-500" />
        <StatCard label="相手選手（現役）" value={playerCount} unit="名" color="bg-green-500" />
        <StatCard label="阪大選手（現役）" value={osakaPlayerCount} unit="名" color="bg-purple-500" />
        <StatCard label="試合記録数" value={matchCount} unit="件" color="bg-orange-500" />
      </div>

      {/* 試合記録一覧 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">試合記録</h2>
          <Link href="/matches" className="text-sm text-[#1a2e4a] hover:underline">
            すべて見る →
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-3">📋</div>
            <p>まだ試合記録がありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {recentMatches.map((match) => (
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
        )}
      </div>
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
