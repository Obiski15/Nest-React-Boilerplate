'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';

import { UserRecord } from '@app/types';
import { authService } from '@/app/api/services/auth.service';
import { TokenService } from '@/app/api/services/token.service';
import { userService } from '@/app/api/services/user.service';

import { AuthContextType } from './interfaces/auth.provider.interface';

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    if (isInitialized) return;

    try {
      setIsLoading(true);
      const { data } = await userService.getProfile();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, []);

  const logout = async () => {
    try {
      setIsLoading(true);
      const { message } = await authService.logout();
      toast.success(message);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      TokenService.clearAccessToken();
      setUser(null);
      setIsLoading(false);

      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitialized,
        isAuthenticated: !!user,
        refetchUser: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
