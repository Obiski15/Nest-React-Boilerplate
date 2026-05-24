import { ReactNode } from 'react';

import { Protected } from '@/components/layout/Protected';
import { AuthProvider } from '@/providers/auth/AuthProvider';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Protected>{children}</Protected>
    </AuthProvider>
  );
}
