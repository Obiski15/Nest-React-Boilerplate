'use client';

import { cn } from '@/lib/utils';

import { getPasswordStrength } from '../../utils/password-strength';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const { score, label, color, checks } = getPasswordStrength(password);

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              score >= level ? color : 'bg-muted',
            )}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-muted-foreground text-xs">
        Strength:{' '}
        <span
          className={cn('font-medium', {
            'text-destructive': score <= 1,
            'text-orange-500': score === 2,
            'text-yellow-500': score === 3,
            'text-emerald-500': score === 4,
          })}
        >
          {label}
        </span>
      </p>

      {/* Requirement checklist */}
      <ul className="space-y-1">
        {[
          { key: 'length', label: 'At least 8 characters' },
          { key: 'uppercase', label: 'One uppercase letter' },
          { key: 'number', label: 'One number' },
          { key: 'special', label: 'One special character' },
        ].map(({ key, label }) => (
          <li
            key={key}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              checks[key as keyof typeof checks]
                ? 'text-emerald-500'
                : 'text-muted-foreground',
            )}
          >
            <span className="text-[10px]">
              {checks[key as keyof typeof checks] ? '✓' : '○'}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
