'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/teams', label: '大学一覧', icon: '🏛️' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  // ログインページでは非表示
  if (pathname === '/login') return null

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* デスクトップ用トップナビ */}
      <nav className="hidden md:flex bg-[#1a2e4a] text-white shadow-md">
        <div className="max-w-5xl mx-auto w-full px-4 flex items-center gap-8 h-14">
          <Link href="/" className="font-bold text-lg tracking-wide hover:text-white/80 transition-colors">試合・選手情報管理</Link>
          <div className="flex gap-2 ml-4 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="text-white/80 hover:text-white text-sm transition-colors ml-auto"
          >
            ログアウト
          </button>
        </div>
      </nav>

      {/* モバイル用ボトムナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a2e4a] text-white shadow-lg z-50 safe-area-inset-bottom">
        <div className="flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
                  ? 'text-white'
                  : 'text-white/80'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* モバイル用ヘッダー */}
      <header className="md:hidden bg-[#1a2e4a] text-white px-4 h-12 flex items-center justify-between shadow-md">
        <Link href="/" className="font-bold text-base hover:text-white/80 transition-colors">試合・選手情報管理</Link>
        <button onClick={handleLogout} className="text-white/80 hover:text-white text-xs transition-colors">
          ログアウト
        </button>
      </header>
    </>
  )
}
