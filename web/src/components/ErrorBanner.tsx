// ErrorBanner — visible error state for failed API calls
interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: '1px solid var(--warning)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            color: 'var(--warning)',
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
