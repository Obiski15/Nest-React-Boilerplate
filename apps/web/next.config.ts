import type { NextConfig } from 'next';

import { config } from './config';

const nextConfig: NextConfig = {
  rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${config.API_BASE_URL}/api/v1/:path*`,
      },
    ];
  },
  transpilePackages: ['@app/types'],
};

export default nextConfig;
