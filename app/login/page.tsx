'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<'women' | 'men' | null>(null)

  const handleLogin = async (section: 'women' | 'men') => {
    if (!password) {
      setError('パスワードを入力してください')
      return
    }
    setLoading(section)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, section }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'ログインに失敗しました')
      setLoading(null)
      return
    }

    router.push(section === 'women' ? '/' : '/mens')
    router.refresh()
  }

  return (
    <div className="fixed inset-0 bg-[#1a2e4a] flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-sm">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🥋</div>
          <h1 className="text-2xl font-bold text-white tracking-wide">空手道オーダー管理</h1>
          <p className="text-white/50 text-sm mt-1">大阪大学空手道部</p>
        </div>

        {/* ログインカード */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* パスワード入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin('women') }}
              placeholder="パスワードを入力"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/30 focus:border-[#1a2e4a]"
              autoFocus
            />
          </div>

          {/* エラー */}
          {error && (
            <p className="text-red-500 text-sm text-center -mt-2">{error}</p>
          )}

          {/* セクション選択ボタン */}
          <div>
            <p className="text-xs text-gray-400 text-center mb-3">セクションを選択してログイン</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLogin('women')}
                disabled={loading !== null}
                className="flex flex-col items-center gap-1.5 bg-[#1a2e4a] text-white py-4 rounded-xl font-medium text-sm hover:bg-[#243d5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'women' ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl">👩</span>
                )}
                女子組手
              </button>
              <button
                onClick={() => handleLogin('men')}
                disabled={loading !== null}
                className="flex flex-col items-center gap-1.5 bg-[#2d4a1a] text-white py-4 rounded-xl font-medium text-sm hover:bg-[#3a5f22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'men' ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl">👨</span>
                )}
                男子組手
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
