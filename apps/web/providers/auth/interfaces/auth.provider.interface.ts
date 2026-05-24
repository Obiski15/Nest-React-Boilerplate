import { UserRecord } from '@app/types';

export interface AuthContextType {
  user: UserRecord | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}
