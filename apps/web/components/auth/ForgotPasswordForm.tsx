'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { authService } from '@/app/api/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
} from '../../schemas/auth.schema';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { AuthWrapper } from './AuthWrapper';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: values.email });
    } catch {
      // Intentionally swallow error to prevent account enumeration
    } finally {
      setIsLoading(false);
      setSubmittedEmail(values.email);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <AuthWrapper
        title="Check your email"
        description={`We sent a password reset link to ${submittedEmail}`}
        backButtonLabel="Back to"
        backButtonHref="/login"
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="rounded-full bg-emerald-500/10 p-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-muted-foreground text-sm">
            If an account exists for{' '}
            <span className="text-foreground font-medium">
              {submittedEmail}
            </span>
            , you will receive a password reset email shortly.
          </p>
          <p className="text-muted-foreground text-xs">
            Didn't receive it? Check your spam folder or{' '}
            <button
              onClick={() => {
                setSubmitted(false);
                form.setValue('email', submittedEmail);
              }}
              className="text-primary underline-offset-4 hover:underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link"
      backButtonLabel="Remember your password?"
      backButtonHref="/login"
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </form>
    </AuthWrapper>
  );
}
