'use client';

import { formatDistanceToNow } from 'date-fns';
import { Laptop, Loader2, MonitorSmartphone, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthSessionResponse } from '@app/types';
import { authService } from '@/app/api/services/auth.service';
import { DeviceService } from '@/app/api/services/device.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/providers/auth/useAuth';

export function ActiveSessionsCard() {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<AuthSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);

  const currentDeviceId = DeviceService.getDeviceId();

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const { data } = await authService.getSessions();

      if (Array.isArray(data?.sessions)) {
        setSessions(data.sessions);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, []);

  const handleRevokeSession = async (
    sessionId: string,
    isCurrentDevice: boolean,
  ) => {
    try {
      if (isCurrentDevice) {
        await logout();
      } else {
        const { message } = await authService.revokeSession(sessionId);
        toast.success(message);
        void fetchSessions();
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleRevokeAll = async () => {
    try {
      setIsRevoking(true);
      const { message } = await authService.revokeAllSessions();
      toast.success(message);

      setTimeout(() => void logout(), 1500);
    } catch (error) {
      toast.error((error as Error).message);
      setIsRevoking(false);
    }
  };

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'MacBook / iMac';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Device';
    return 'Web Browser';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="text-primary h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              These are the devices that have logged into your account. Revoke
              any sessions that you do not recognize.
            </CardDescription>
          </div>
          <Button
            variant="destructive"
            onClick={() => void handleRevokeAll()}
            disabled={isRevoking || isLoading || sessions.length === 0}
          >
            {isRevoking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="mr-2 h-4 w-4" />
            )}
            Sign Out All Devices
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No active sessions found.
          </p>
        ) : (
          <div className="space-y-4 divide-y">
            {sessions.map((session) => {
              const isCurrentDevice = session.device_id === currentDeviceId;
              const deviceName = parseUserAgent(session.metadata?.userAgent);

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between pt-4 first:pt-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-muted rounded-full p-3">
                      <Laptop className="text-foreground h-5 w-5" />
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {deviceName}
                        {isCurrentDevice && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          >
                            This Device
                          </Badge>
                        )}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Location: {session.metadata?.timeZone ?? 'Unknown'}
                        {' • '}
                        Signed in:{' '}
                        {formatDistanceToNow(new Date(session.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      void handleRevokeSession(session.id, isCurrentDevice)
                    }
                  >
                    Revoke
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
