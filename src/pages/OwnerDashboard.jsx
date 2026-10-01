import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldCheck, ArrowLeft } from 'lucide-react';
import SignupPanel from '@/components/owner/SignupPanel';
import RevenuePanel from '@/components/owner/RevenuePanel';
import OwnerConsoleNav from '@/components/owner/OwnerConsoleNav';
import OwnerAccessDenied from '@/components/owner/OwnerAccessDenied';

export default function OwnerDashboard() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['owner-analytics'],
    queryFn: async () => {
      const response = await base44.functions.invoke('ownerAnalytics', {});
      return response.data;
    },
    retry: false,
    // Keeps the numbers live without a manual reload.
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return <OwnerAccessDenied signedOut={status === 401} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-base font-semibold leading-tight">Platform Overview</h1>
              <p className="text-xs text-muted-foreground">Cellwatch internal · signups & revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OwnerConsoleNav />
            <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden lg:inline">Back to app</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {error && status !== 401 && status !== 403 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.response?.data?.error || 'Could not load the dashboard. Try refreshing.'}
          </div>
        )}

        <SignupPanel signups={isLoading ? null : data?.signups} />
        <RevenuePanel revenue={isLoading ? null : data?.revenue} />

        {data?.generated_at && (
          <p className="text-xs text-muted-foreground text-center">
            Figures refresh automatically every minute · last updated {new Date(data.generated_at).toLocaleTimeString()}
          </p>
        )}
      </main>
    </div>
  );
}