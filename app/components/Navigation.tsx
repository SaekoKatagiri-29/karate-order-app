'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/teams', label: '対戦大学', icon: '🏫' },
  { href: '/matches', label: '試合記録', icon: '📋' },
  { href: '/predict', label: 'AI予測', icon: '🤖' },
  { href: '/osaka-players', label: '阪大選手', icon: '👊' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* デスクトップ用トップナビ */}
      <nav className="hidden md:flex bg-navy-900 bg-[#1a2e4a] text-white shadow-md">
        <div className="max-w-5xl mx-auto w-full px-4 flex items-center gap-8 h-14">
          <Link href="/" className="font-bold text-lg tracking-wide hover:text-white/80 transition-colors">空手道オーダー予測</Link>
          <div className="flex gap-2 ml-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
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
                  : 'text-white/50'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* モバイル用ヘッダー */}
      <header className="md:hidden bg-[#1a2e4a] text-white px-4 h-12 flex items-center shadow-md">
        <Link href="/" className="font-bold text-base hover:text-white/80 transition-colors">空手道オーダー予測</Link>
      </header>
    </>
  )
}
