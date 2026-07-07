export function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500 dark:text-slate-400"
      role="status"
      aria-live="polite"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-600 dark:border-t-blue-400" />
      <p className="text-sm">Loading returns…</p>
    </div>
  )
}
