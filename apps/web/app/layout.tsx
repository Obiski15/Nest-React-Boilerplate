import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';

import './globals.css';

import { ThemeProvider } from 'next-themes';

import { Toaster } from '@/components/ui/sonner';
import Providers from '@/providers/Providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Nest React Boilerplate',
    template: '%s | Nest React Boilerplate',
  },
  description:
    'A polished NestJS and Next.js starter with auth, profile, and security flows.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="app-shell flex min-h-full flex-col">
        <ThemeProvider defaultTheme="system" enableSystem>
          <Providers>
            <Toaster />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
