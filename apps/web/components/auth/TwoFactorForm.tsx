'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { authService } from '@/app/api/services/auth.service';
import { TokenService } from '@/app/api/services/token.service';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

import {
  TwoFactorFormValues,
  twoFactorSchema,
} from '../../schemas/auth.schema';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { AuthWrapper } from './AuthWrapper';

interface TwoFactorFormProps {
  tempToken: string | null;
  callbackUrl: string;
  onBack: () => void;
}

export function TwoFactorForm({
  tempToken,
  callbackUrl,
  onBack,
}: TwoFactorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: '', trust_device: false },
  });

  const onSubmit = async (values: TwoFactorFormValues) => {
    if (!tempToken) return;
    setIsLoading(true);
    try {
      const { data, message } = await authService.authenticate2fa({
        code: values.code,
        temp_token: tempToken,
        // TODO: trust_device: values.trust_device,
      });

      if (data?.tokens?.access_token) {
        TokenService.setAccessToken(data.tokens.access_token);
      }
      toast.success(message);
      router.replace(callbackUrl);
    } catch (error) {
      toast.error((error as Error).message);
      form.setValue('code', '');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWrapper
      title="Two-factor authentication"
      description="Enter the 6-digit code from your authenticator app"
    >
      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        className="space-y-6"
      >
        <Controller
          name="code"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="sr-only">Authentication code</FieldLabel>
              <div className="flex justify-center py-2">
                <InputOTP
                  {...field}
                  maxLength={6}
                  disabled={isLoading}
                  onChange={(value) => {
                    field.onChange(value);
                    if (value.length === 6) {
                      void form.handleSubmit(onSubmit)();
                    }
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="trust_device"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="trust_device"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
              <label
                htmlFor="trust_device"
                className="text-muted-foreground cursor-pointer text-sm"
              >
                Trust this device for 30 days
              </label>
            </div>
          )}
        />

        <div className="space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isLoading}
            onClick={() =>
              router.push(`/recovery-code?temp_token=${tempToken}`)
            }
          >
            Use a recovery code instead
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isLoading}
            onClick={onBack}
          >
            Back to sign in
          </Button>
        </div>
      </form>
    </AuthWrapper>
  );
}
