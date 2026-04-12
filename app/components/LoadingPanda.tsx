export default function LoadingPanda({ label = '読み込み中...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 select-none gap-2">
      <img src="/panda-loading.gif" alt="読み込み中" className="w-32 h-32 object-contain" />
      <p className="text-gray-400 text-sm animate-pulse">{label}</p>
    </div>
  )
}
