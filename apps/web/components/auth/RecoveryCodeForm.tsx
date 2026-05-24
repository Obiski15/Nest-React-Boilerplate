'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { authService } from '@/app/api/services/auth.service';
import { TokenService } from '@/app/api/services/token.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import {
  RecoveryCodeFormValues,
  recoveryCodeSchema,
} from '../../schemas/auth.schema';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { AuthWrapper } from './AuthWrapper';

function RecoveryCodeFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const tempToken = searchParams.get('temp_token');
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const form = useForm<RecoveryCodeFormValues>({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: { recovery_code: '' },
  });

  const onSubmit = async (values: RecoveryCodeFormValues) => {
    if (!tempToken) {
      toast.error('Session expired. Please sign in again.');
      router.replace('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { data, message } = await authService.authenticateWithRecoveryCode({
        recovery_code: values.recovery_code,
        temp_token: tempToken,
      });

      if (data?.tokens?.access_token) {
        TokenService.setAccessToken(data.tokens.access_token);
      }
      toast.success(message);
      router.replace(callbackUrl);
    } catch (error) {
      toast.error((error as Error).message);
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWrapper
      title="Use a recovery code"
      description="Enter one of your saved backup codes to access your account"
    >
      <Alert
        variant="destructive"
        className="border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Recovery codes are single-use. This code will be invalidated after
          use.
        </AlertDescription>
      </Alert>

      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        className="space-y-4"
      >
        <Controller
          name="recovery_code"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Recovery code</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                disabled={isLoading}
                placeholder="xxxxxxxx-xxxx"
                className="font-mono tracking-widest"
                autoComplete="off"
                spellCheck={false}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify recovery code
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isLoading}
            onClick={() => router.back()}
          >
            Back to authenticator
          </Button>
        </div>
      </form>
    </AuthWrapper>
  );
}

export function RecoveryCodeForm() {
  return (
    <Suspense fallback={<Spinner />}>
      <RecoveryCodeFormContent />
    </Suspense>
  );
}
