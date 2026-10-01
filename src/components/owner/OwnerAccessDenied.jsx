import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OwnerAccessDenied({ signedOut }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-heading font-semibold">Platform console</h1>
        <p className="text-sm text-muted-foreground">
          {signedOut
            ? 'Sign in with the Cellwatch platform owner account to open this console.'
            : 'This console is restricted to the Cellwatch platform owner. Your account does not have access.'}
        </p>
        <Button variant="outline" asChild>
          <a href="/dashboard">Back to the app</a>
        </Button>
      </div>
    </div>
  );
}