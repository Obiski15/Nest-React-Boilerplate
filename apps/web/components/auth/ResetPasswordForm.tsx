'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { authService } from '@/app/api/services/auth.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import {
  ResetPasswordFormValues,
  resetPasswordSchema,
} from '../../schemas/auth.schema';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { AuthWrapper } from './AuthWrapper';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

function ResetPasswordFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = form.watch('password');

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const { message } = await authService.resetPassword({
        token,
        new_password: values.password,
      });
      toast.success(message);
      setSuccess(true);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthWrapper
        title="Invalid link"
        description="This password reset link is invalid or has expired."
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This link is invalid or has expired. Please request a new one.
          </AlertDescription>
        </Alert>
        <Button
          className="w-full"
          onClick={() => router.push('/forgot-password')}
        >
          Request new link
        </Button>
      </AuthWrapper>
    );
  }

  if (success) {
    return (
      <AuthWrapper
        title="Password updated"
        description="Your password has been reset successfully"
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="rounded-full bg-emerald-500/10 p-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-muted-foreground text-sm">
            You can now sign in with your new password.
          </p>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Back to sign in
          </Button>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper
      title="Reset password"
      description="Enter a new password for your account"
    >
      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        className="space-y-4"
      >
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>New password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                placeholder="••••••••"
              />
              {password && <PasswordStrengthMeter password={password} />}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                placeholder="••••••••"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset password
        </Button>
      </form>
    </AuthWrapper>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
