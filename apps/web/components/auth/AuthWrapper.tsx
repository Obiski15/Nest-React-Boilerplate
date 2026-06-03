import Link from 'next/link';
import { Command } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
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
  showSocial = false,
}: AuthWrapperProps) {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="no-scrollbar max-h-[80vh] w-full max-w-md space-y-6 overflow-y-auto">
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

        <Card className="shadow-sm ring-0">
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

          <CardContent className="space-y-4">
            {children}

            {/* Social Logins */}
            {showSocial && (
              <div className="space-y-4 pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card text-muted-foreground px-2">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" type="button">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </div>
            )}
          </CardContent>

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
