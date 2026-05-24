import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted mb-8 flex h-20 w-20 items-center justify-center rounded-full">
        <FileQuestion className="text-muted-foreground h-10 w-10" />
      </div>

      <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Page not found
      </h1>

      <p className="text-muted-foreground mb-8 max-w-125 text-lg">
        Sorry, we couldn't find the page you're looking for. It might have been
        removed, renamed, or didn't exist in the first place.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
