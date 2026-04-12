'use client'

import { useRouter } from 'next/navigation'

export default function MensPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">男子組手</h1>
        <p className="text-gray-500 text-sm mt-1">大阪大学空手道部 男子組手 オーダー管理</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">🥋</div>
        <p className="text-gray-500 text-lg font-medium">男子組手セクション</p>
        <p className="text-gray-400 text-sm mt-2">現在準備中です</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
      >
        ログアウト
      </button>
    </div>
  )
}
