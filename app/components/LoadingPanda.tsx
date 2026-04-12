export default function LoadingPanda({ label = '読み込み中...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 select-none gap-2">
      <img src="/panda-loading.gif" alt="読み込み中" className="w-48 h-48 object-cover rounded-full" />
      <p className="text-gray-400 text-lg animate-pulse">{label}</p>
    </div>
  )
}
