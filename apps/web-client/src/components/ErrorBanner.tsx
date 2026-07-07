interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

/** A prominent, accessible error message with an optional retry action. */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200"
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 self-start rounded-md border border-red-400 bg-white/70 px-3 py-1.5 text-sm font-medium text-red-800 transition hover:bg-white sm:self-auto dark:border-red-700 dark:bg-red-900/40 dark:text-red-100 dark:hover:bg-red-900/70"
        >
          Retry
        </button>
      )}
    </div>
  )
}
