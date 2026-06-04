export const parseUserAgent = (userAgent?: string) => {
  if (!userAgent) return 'Unknown Device';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac')) return 'MacBook / iMac';
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('Android')) return 'Android Device';
  return 'Web Browser';
};
