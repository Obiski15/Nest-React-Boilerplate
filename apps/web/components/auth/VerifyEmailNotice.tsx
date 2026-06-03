'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { authService } from '@/app/api/services/auth.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { useCountdown } from '../../hooks/useCountdown';
import { AuthWrapper } from './AuthWrapper';

const RESEND_COOLDOWN = 60;

function VerifyEmailNoticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const { seconds, isActive, start } = useCountdown(RESEND_COOLDOWN);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { message } = await authService.verifyEmail({
          token: token,
        });
        toast.success(message);
        setVerified(true);
      } catch (error) {
        setVerifyError((error as Error).message);
      } finally {
        setIsVerifying(false);
      }
    };

    void verify();
  }, [token, email]);

  const handleResend = async () => {
    if (!email || isActive) return;

    setIsResending(true);
    try {
      const { message } = await authService.resendVerification({
        email,
      });
      toast.success(message);
      start();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsResending(false);
    }
  };

  if (!email && !token) {
    return (
      <AuthWrapper
        title="Invalid verification link"
        description="The verification link is missing required information."
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The verification link is invalid or has expired.
          </AlertDescription>
        </Alert>
      </AuthWrapper>
    );
  }

  // Verifying token state
  if (isVerifying) {
    return (
      <AuthWrapper
        title="Verifying your email..."
        description="Please wait while we verify your email address."
      >
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </AuthWrapper>
    );
  }

  // Verification error
  if (verifyError) {
    return (
      <AuthWrapper
        title="Verification failed"
        description="We couldn't verify your email address."
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{verifyError}</AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Button className="w-full" onClick={() => void handleResend()}>
            {isResending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Sending...
              </>
            ) : isActive ? (
              `Resend in ${seconds}s`
            ) : (
              'Resend verification email'
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Back to sign in
          </Button>
        </div>
      </AuthWrapper>
    );
  }

  // Success state
  if (verified) {
    return (
      <AuthWrapper
        title="Email verified!"
        description="Your email address has been verified successfully."
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="rounded-full bg-emerald-500/10 p-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-muted-foreground text-sm">
            Your account is now active. You can sign in to get started.
          </p>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Continue to sign in
          </Button>
        </div>
      </AuthWrapper>
    );
  }

  // Default
  return;
}

export function VerifyEmailNotice() {
  return (
    <Suspense fallback={<Spinner />}>
      <VerifyEmailNoticeContent />
    </Suspense>
  );
}
