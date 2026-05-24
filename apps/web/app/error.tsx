'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: Log the error to an error reporting service like Sentry
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="bg-destructive/10 mb-8 flex h-20 w-20 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-10 w-10" />
      </div>

      <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Something went wrong
      </h1>

      <p className="text-muted-foreground mb-8 max-w-125 text-lg">
        We've encountered an unexpected error. Our technical team has been
        notified. Please try again or return home.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button onClick={() => reset()} size="lg">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
