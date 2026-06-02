const DEVICE_ID_KEY = 'x_device_id';

export const DeviceService = {
  getDeviceId: (): string => {
    if (typeof window === 'undefined') return 'server_render';

    let deviceId = window.localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate a permanent UUID v4 for this specific browser
      deviceId = crypto.randomUUID();
      window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  },

  getDeviceMetadata: () => {
    return {
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },
};
