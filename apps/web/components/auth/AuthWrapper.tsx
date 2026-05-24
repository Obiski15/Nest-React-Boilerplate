import Link from 'next/link';
import { Command } from 'lucide-react';
import { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AuthWrapperProps {
  children: ReactNode;
  title: string;
  description?: string;
  backButtonLabel?: string;
  backButtonHref?: string;
  footer?: ReactNode;
  showSocial?: boolean;
}

export function AuthWrapper({
  children,
  title,
  description,
  backButtonLabel,
  backButtonHref,
  footer,
}: AuthWrapperProps) {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="bg-primary/10 text-primary flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition-opacity hover:opacity-80"
          >
            <Command className="h-5 w-5" />
            <span>My SaaS App</span>
          </Link>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">{children}</CardContent>

          {(backButtonLabel ?? footer) && (
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Separator />
              {footer}
              {backButtonLabel && backButtonHref && (
                <p className="text-muted-foreground text-center text-sm">
                  {backButtonLabel}{' '}
                  <Link
                    href={backButtonHref}
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    {backButtonHref === '/register' ? 'Sign up' : 'Sign in'}
                  </Link>
                </p>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
