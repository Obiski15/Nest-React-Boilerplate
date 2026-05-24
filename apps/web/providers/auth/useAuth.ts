import { useContext } from 'react';

import { AuthContext } from './AuthProvider';
import { AuthContextType } from './interfaces/auth.provider.interface';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
