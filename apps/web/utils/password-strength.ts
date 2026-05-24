export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const map: Record<
    number,
    { strength: PasswordStrength; label: string; color: string }
  > = {
    0: { strength: 'weak', label: 'Weak', color: 'bg-destructive' },
    1: { strength: 'weak', label: 'Weak', color: 'bg-destructive' },
    2: { strength: 'fair', label: 'Fair', color: 'bg-orange-500' },
    3: { strength: 'good', label: 'Good', color: 'bg-yellow-500' },
    4: { strength: 'strong', label: 'Strong', color: 'bg-emerald-500' },
  };

  return { ...map[score], score, checks };
}
