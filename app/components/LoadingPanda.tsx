export default function LoadingPanda({ label = '読み込み中...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 select-none gap-3">
      <div className="flex flex-col items-center gap-1">
        {/* 頭 */}
        <span className="text-5xl">🐼</span>

        {/* 胴体＋パンチアーム */}
        <div className="panda-body flex items-center gap-0">
          {/* 左腕（静止） */}
          <span className="text-xl opacity-60" style={{ transform: 'scaleX(-1) rotate(-20deg)', display: 'inline-block' }}>🤜</span>
          {/* 道着ボディ */}
          <span className="text-4xl">🥋</span>
          {/* 右腕（正拳突き） */}
          <span className="panda-punch text-2xl">🤜</span>
        </div>
      </div>

      <p className="text-gray-400 text-sm animate-pulse">{label}</p>
    </div>
  )
}
