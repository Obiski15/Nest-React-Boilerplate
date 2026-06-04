'use client';

import { Loader2, Mail, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  NotificationChannel,
  NotificationPreferenceResponse,
  SubscribableNotificationEventType,
} from '@app/types';
import { notificationService } from '@/app/api/services/notification.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// UI Configuration Map for human-readable labels
const EVENT_META_MAP: Record<
  SubscribableNotificationEventType,
  { title: string; desc: string; disabledChannels?: string[] }
> = {
  [SubscribableNotificationEventType.PROMOTIONAL]: {
    title: 'Promotional Updates',
    desc: 'Stay informed about the latest products, services, and special offers.',
  },
};

export function NotificationPreferencesCard() {
  const [preferences, setPreferences] = useState<
    NotificationPreferenceResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await notificationService.getPreferences();

        if (Array.isArray(data?.preferences)) {
          setPreferences(data.preferences);
        }
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    void loadConfig();
  }, []);

  const handleToggle = async (
    eventType: SubscribableNotificationEventType,
    channel: NotificationChannel,
    currentValue: boolean,
  ) => {
    const nextValue = !currentValue;

    // Optimistic UI Update: Mutate state immediately before sending HTTP request
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.event_type === eventType
          ? { ...pref, [channel]: nextValue }
          : pref,
      ),
    );

    try {
      const { message } = await notificationService.updatePreference({
        event_type: eventType,
        [channel]: nextValue,
      });
      toast.success(message);
    } catch (error) {
      toast.error((error as Error).message);
      // Revert back to original value if connection or backend validation drops
      setPreferences((prev) =>
        prev.map((pref) =>
          pref.event_type === eventType
            ? { ...pref, [channel]: currentValue }
            : pref,
        ),
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm ring-0">
      <CardHeader>
        <CardTitle>Notification Matrix</CardTitle>
        <CardDescription>
          Configure how channels fan out system notifications to your specific
          devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Matrix Column Titles Header Block */}
        <div className="text-muted-foreground hidden grid-cols-12 gap-4 border-b pb-2 text-xs font-semibold tracking-wider uppercase md:grid">
          <div className="col-span-6">Notification Type</div>
          <div className="col-span-2 flex items-center justify-center gap-1.5 text-center">
            <Mail className="h-3.5 w-3.5" /> Email
          </div>
          <div className="col-span-2 flex items-center justify-center gap-1.5 text-center">
            <MessageSquare className="h-3.5 w-3.5" /> SMS
          </div>
          <div className="col-span-2 flex items-center justify-center gap-1.5 text-center">
            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
          </div>
        </div>

        {/* Matrix Setting Nodes */}
        <div className="space-y-4 divide-y md:space-y-0">
          {preferences.map((pref) => {
            const meta = EVENT_META_MAP[pref.event_type];
            if (!meta) return null;

            return (
              <div
                key={pref.event_type}
                className="grid grid-cols-1 items-center gap-4 pt-4 first:pt-0 md:grid-cols-12 md:py-4"
              >
                {/* Meta Description Context */}
                <div className="col-span-1 space-y-0.5 md:col-span-6">
                  <h4 className="text-sm font-medium tracking-tight">
                    {meta.title}
                  </h4>
                  <p className="text-muted-foreground max-w-md text-xs">
                    {meta.desc}
                  </p>
                </div>

                {/* Interactive Toggles Container */}
                <div className="col-span-1 grid grid-cols-3 items-center gap-2 text-center md:col-span-6 md:grid-cols-6">
                  {/* Email Toggle node */}
                  <div className="col-span-1 flex flex-col items-center justify-center gap-2 md:col-span-2 md:flex-row">
                    <span className="text-muted-foreground text-[10px] font-medium uppercase md:hidden">
                      Email
                    </span>
                    <Switch
                      checked={pref.email}
                      disabled={meta.disabledChannels?.includes(
                        NotificationChannel.EMAIL,
                      )}
                      onCheckedChange={() =>
                        void handleToggle(
                          pref.event_type,
                          NotificationChannel.EMAIL,
                          pref.email,
                        )
                      }
                    />
                  </div>

                  {/* In-App Toggle node */}
                  <div className="col-span-1 flex flex-col items-center justify-center gap-2 md:col-span-2 md:flex-row">
                    <span className="text-muted-foreground text-[10px] font-medium uppercase md:hidden">
                      In-App
                    </span>
                    <Switch
                      checked={pref.sms}
                      disabled={meta.disabledChannels?.includes(
                        NotificationChannel.SMS,
                      )}
                      onCheckedChange={() =>
                        void handleToggle(
                          pref.event_type,
                          NotificationChannel.SMS,
                          pref.sms,
                        )
                      }
                    />
                  </div>

                  {/* WhatsApp Toggle node */}
                  <div className="col-span-1 flex flex-col items-center justify-center gap-2 md:col-span-2 md:flex-row">
                    <span className="text-muted-foreground text-[10px] font-medium uppercase md:hidden">
                      WhatsApp
                    </span>
                    <Switch
                      checked={pref.whatsapp}
                      disabled={meta.disabledChannels?.includes(
                        NotificationChannel.WHATSAPP,
                      )}
                      onCheckedChange={() =>
                        void handleToggle(
                          pref.event_type,
                          NotificationChannel.WHATSAPP,
                          pref.whatsapp,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
