// SearchBar — 300ms debounced search input
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search transactions...' }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  const handleClear = () => {
    setLocal('');
    onChange('');
  };

  return (
    <div style={{ position: 'relative', marginTop: 12, marginBottom: 6 }}>
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          background: 'var(--glass-bg)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.20)',
          padding: '10px 36px 10px 14px',
          fontSize: 13,
          color: 'var(--deep-sage)',
          width: '100%',
          outline: 'none',
          fontFamily: 'var(--font-body)',
        }}
      />
      {local && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--neutral)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: 4,
          }}
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  );
}
