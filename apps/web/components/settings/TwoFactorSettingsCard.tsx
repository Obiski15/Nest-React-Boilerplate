'use client';

import { Copy, Loader2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { authService } from '@/app/api/services/auth.service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useAuth } from '@/providers/auth/useAuth';

type TwoFactorStep = 'idle' | 'setup' | 'recovery';

export function TwoFactorSettingsCard() {
  const { user, refetchUser } = useAuth();

  const [step, setStep] = useState<TwoFactorStep>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const is2FAEnabled = user?.is_two_factor_enabled ?? false;

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const { data } = await authService.generateTwoFactorSecret();
      if (data) {
        setQrCodeUri(data.qr_code_url);
        setManualSecret(data.manual_entry?.secret_key);
      }
      setStep('setup');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async (code: string) => {
    if (code.length !== 6) return;
    try {
      setIsLoading(true);
      const { data, message } = await authService.turnOnTwoFactorAuthentication(
        { code },
      );
      if (data && 'backup_codes' in data) {
        setBackupCodes(data.backup_codes);
      }
      toast.success(message);
      setStep('recovery');
    } catch (error) {
      toast.error((error as Error).message);
      setSetupCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (code: string) => {
    if (code.length !== 6) return;
    try {
      setIsLoading(true);
      await authService.disableTwoFactorAuthentication({ code });
      toast.success('Two-factor authentication disabled.');
      setIsDisableModalOpen(false);
      setDisableCode('');
      await refetchUser();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to disable 2FA.');
      setDisableCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard
      .writeText(backupCodes.join('\n'))
      .then(() => toast.success('Backup codes copied to clipboard'))
      .catch(() => toast.error('Failed to copy codes'));
  };

  const handleDone = async () => {
    await refetchUser();
    setStep('idle');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {is2FAEnabled ? (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            )}
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account by requiring a
            verification code from your authenticator app on every login.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── IDLE ── */}
          {step === 'idle' && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Status</p>
                <p
                  className={`text-sm ${is2FAEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`}
                >
                  {is2FAEnabled
                    ? 'Your account is protected with 2FA'
                    : 'Your account is not protected with 2FA'}
                </p>
              </div>
              <Button
                variant={is2FAEnabled ? 'destructive' : 'default'}
                onClick={
                  is2FAEnabled
                    ? () => setIsDisableModalOpen(true)
                    : handleGenerate
                }
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          )}

          {/* ── SETUP ── */}
          {step === 'setup' && qrCodeUri && (
            <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center space-y-6">
              <div className="space-y-1 text-center">
                <p className="font-medium">Scan with your authenticator app</p>
                <p className="text-muted-foreground text-sm">
                  Use Google Authenticator, Authy, or any TOTP app.
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <img
                  src={qrCodeUri}
                  alt="2FA QR Code"
                  className="size-48 object-contain"
                />
              </div>

              {manualSecret && (
                <div className="bg-muted w-full rounded-md p-3 text-center">
                  <p className="text-muted-foreground mb-1 text-xs">
                    Can't scan? Enter this key manually
                  </p>
                  <p className="font-mono text-sm tracking-widest select-all">
                    {manualSecret}
                  </p>
                </div>
              )}

              <div className="w-full space-y-2 text-center">
                <p className="text-sm font-medium">
                  Enter the 6-digit code to confirm setup
                </p>
                <Field>
                  <FieldLabel className="sr-only">Verification Code</FieldLabel>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={setupCode}
                      onChange={(val) => {
                        setSetupCode(val);
                        if (val.length === 6) void handleVerifySetup(val);
                      }}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </Field>
                {isLoading && (
                  <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => setStep('idle')}
                disabled={isLoading}
                className="w-full"
              >
                Cancel Setup
              </Button>
            </div>
          )}

          {/* ── RECOVERY CODES ── */}
          {step === 'recovery' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
              <div className="rounded-md bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
                <h4 className="flex items-center gap-2 font-semibold">
                  <Shield className="h-4 w-4" />
                  Save your backup codes
                </h4>
                <p className="mt-2 text-sm text-amber-600/80 dark:text-amber-400/80">
                  Store these somewhere safe. If you lose your authenticator
                  device, these are the only way to recover access to your
                  account. Each code can only be used once.
                </p>
              </div>

              <div className="bg-muted grid grid-cols-2 gap-2 rounded-md p-4 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div
                    key={i}
                    className="bg-background rounded px-2 py-1.5 text-center tracking-widest shadow-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyBackupCodes}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Codes
                </Button>
                <Button onClick={() => void handleDone()} className="flex-1">
                  I've saved them
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── DISABLE DIALOG ── */}
      <Dialog
        open={isDisableModalOpen}
        onOpenChange={(open) => {
          if (!isLoading) setIsDisableModalOpen(open);
          if (!open) setDisableCode('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to confirm.
              Your account will be less secure without 2FA.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-4">
            <InputOTP
              maxLength={6}
              value={disableCode}
              onChange={(val) => {
                setDisableCode(val);
                if (val.length === 6) void handleDisable(val);
              }}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {isLoading && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDisableModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDisable(disableCode)}
              disabled={isLoading || disableCode.length !== 6}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
