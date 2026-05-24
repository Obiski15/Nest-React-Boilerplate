'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { authService } from '@/app/api/services/auth.service';
import { TokenService } from '@/app/api/services/token.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { LoginFormValues, loginSchema } from '../../schemas/auth.schema';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { AuthWrapper } from './AuthWrapper';
import { TwoFactorForm } from './TwoFactorForm';

function LoginFormContent() {
  const [step, setStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data, message } = await authService.login({
        email: values.email,
        password: values.password,
      });

      if (data) {
        if ('requires_2fa' in data && data.requires_2fa) {
          setTempToken(data.temp_token ?? null);
          setStep('2FA');
          return;
        }

        if ('tokens' in data && data.tokens?.access_token) {
          TokenService.setAccessToken(data.tokens.access_token);
          toast.success(message);
          router.replace(callbackUrl);
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === '2FA') {
    return (
      <TwoFactorForm
        tempToken={tempToken}
        callbackUrl={callbackUrl}
        onBack={() => setStep('CREDENTIALS')}
      />
    );
  }

  return (
    <AuthWrapper
      title="Welcome back"
      description="Sign in to your account to continue"
      backButtonLabel="Don't have an account?"
      backButtonHref="/register"
    >
      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        className="space-y-4"
      >
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                autoComplete="email"
                disabled={isLoading}
                placeholder="name@example.com"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="current-password"
                disabled={isLoading}
                placeholder="••••••••"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthWrapper>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginFormContent />
    </Suspense>
  );
}
