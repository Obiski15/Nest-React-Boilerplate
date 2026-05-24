import { TwoFactorSettingsCard } from '@/components/settings/TwoFactorSettingsCard';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Security Settings</h3>
        <p className="text-muted-foreground">
          Manage your account security and authentication methods.
        </p>
      </div>
      <TwoFactorSettingsCard />
    </div>
  );
}
