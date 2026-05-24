import { ProfileForm } from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Profile</h3>
        <p className="text-muted-foreground">
          Manage your personal information.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
