import { ActiveSessionsCard } from '@/components/settings/ActiveSessionsCard';
import { TwoFactorSettingsCard } from '@/components/settings/TwoFactorSettingsCard';

export default function SecuritySettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security Settings</h2>
        <p className="text-muted-foreground">
          Manage your authentication methods and active device sessions.
        </p>
      </div>

      <TwoFactorSettingsCard />

      <ActiveSessionsCard />
    </div>
  );
}
