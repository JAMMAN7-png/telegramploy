import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold mb-2 text-neon-cyan">
        {label}
      </label>
      <input
        className={`input-brutal ${error ? 'border-neon-magenta' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-neon-magenta">{error}</p>}
    </div>
  );
}
