// AmountText — Source Code Pro financial display
import { formatAmountSigned, formatAmountUnsigned } from '../api';

interface AmountTextProps {
  cents: number;
  signed?: boolean;
  isIncome?: boolean;
  size?: number;
  style?: React.CSSProperties;
}

export function AmountText({ cents, signed = false, isIncome = false, size = 14, style }: AmountTextProps) {
  const text = signed ? formatAmountSigned(cents, isIncome) : formatAmountUnsigned(cents);
  const color = signed
    ? isIncome ? 'var(--surplus)' : 'var(--deep-sage)'
    : 'var(--deep-sage)';

  return (
    <span
      style={{
        fontFamily: 'var(--font-data)',
        fontSize: size,
        fontWeight: 600,
        color,
        ...style,
      }}
    >
      {text}
    </span>
  );
}
