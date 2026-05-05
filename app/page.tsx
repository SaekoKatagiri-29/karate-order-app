import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [teamCount, playerCount, osakaPlayerCount, matchCount] = await Promise.all([
    prisma.team.count(),
    prisma.player.count({ where: { isRetired: false } }),
    prisma.osakaPlayer.count({ where: { isRetired: false } }),
    prisma.match.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ホーム</h1>
        <p className="text-gray-500 text-sm mt-1">大阪大学空手道部 試合・選手情報管理</p>
      </div>

      {/* メインアクションボタン */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/matches/new"
          className="flex items-center justify-center gap-3 w-full bg-[#1a2e4a] text-white py-5 rounded-xl font-semibold text-base hover:bg-[#243d5f] transition-colors shadow-sm"
        >
          <span className="text-2xl">📝</span>
          試合を記録する
        </Link>
        <Link
          href="/matches"
          className="flex items-center justify-center gap-3 w-full bg-white text-[#1a2e4a] py-5 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
        >
          <span className="text-2xl">📋</span>
          試合結果を確認する
        </Link>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="登録大学数" value={teamCount} unit="校" color="bg-blue-500" />
        <StatCard label="相手選手（現役）" value={playerCount} unit="名" color="bg-green-500" />
        <StatCard label="阪大選手（現役）" value={osakaPlayerCount} unit="名" color="bg-purple-500" />
        <StatCard label="試合記録数" value={matchCount} unit="件" color="bg-orange-500" />
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
