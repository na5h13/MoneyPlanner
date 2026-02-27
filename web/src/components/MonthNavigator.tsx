// MonthNavigator — left/right arrows with month label
import { format } from 'date-fns';

interface MonthNavigatorProps {
  period: string; // YYYY-MM
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ period, onPrev, onNext }: MonthNavigatorProps) {
  const [year, month] = period.split('-').map(Number);
  const label = format(new Date(year, month - 1), 'MMMM yyyy');

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      marginBottom: 'var(--lg)',
    }}>
      <button onClick={onPrev} style={arrowStyle} aria-label="Previous month">
        &#9664;
      </button>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--deep-sage)',
      }}>
        {label}
      </span>
      <button onClick={onNext} style={arrowStyle} aria-label="Next month">
        &#9654;
      </button>
    </div>
  );
}

const arrowStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--steel-blue)',
  fontSize: 14,
  cursor: 'pointer',
  padding: '4px 8px',
  lineHeight: 1,
};
