// GlassCard — 3-tier CSS glassmorphism (standard/strong/inset)
import type { CSSProperties, ReactNode } from 'react';

type Tier = 'standard' | 'strong' | 'inset';
type Glow = 'surplus' | 'warning' | undefined;

const tierStyles: Record<Tier, CSSProperties> = {
  standard: {
    background: 'rgba(255,255,255,0.38)',
    backdropFilter: 'blur(24px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.55)',
    borderTopColor: 'rgba(255,255,255,0.70)',
    borderLeftColor: 'rgba(255,255,255,0.60)',
    boxShadow: '0 8px 32px rgba(42,63,82,0.10)',
  },
  strong: {
    background: 'rgba(255,255,255,0.52)',
    backdropFilter: 'blur(32px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
    borderRadius: 20,
    border: '1.5px solid rgba(255,255,255,0.65)',
    borderTopColor: 'rgba(255,255,255,0.80)',
    borderLeftColor: 'rgba(255,255,255,0.70)',
    boxShadow: '0 16px 48px rgba(42,63,82,0.12)',
  },
  inset: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(14px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.20)',
    borderTopColor: 'rgba(255,255,255,0.30)',
    borderLeftColor: 'rgba(255,255,255,0.25)',
  },
};

const glowStyles: Record<string, CSSProperties> = {
  surplus: { boxShadow: '0 0 12px rgba(91,138,114,0.25)' },
  warning: { boxShadow: '0 0 14px rgba(154,123,79,0.30)' },
};

interface GlassCardProps {
  tier?: Tier;
  glow?: Glow;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ tier = 'standard', glow, children, style, className, onClick }: GlassCardProps) {
  const combined: CSSProperties = {
    ...tierStyles[tier],
    ...(glow ? glowStyles[glow] : {}),
    marginTop: 'var(--md)',
    marginBottom: 'var(--lg)',
    ...style,
  };

  return (
    <div style={combined} className={className} onClick={onClick}>
      {children}
    </div>
  );
}
