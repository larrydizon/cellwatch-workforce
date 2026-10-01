import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldCheck, ArrowLeft } from 'lucide-react';
import OwnerMetrics from '@/components/owner/OwnerMetrics';
import TenantTable from '@/components/owner/TenantTable';
import OwnerAccessDenied from '@/components/owner/OwnerAccessDenied';

export default function OwnerConsole() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['owner-console', filter, search],
    queryFn: async () => {
      const response = await base44.functions.invoke('ownerConsole', { action: 'list', filter, search });
      return response.data;
    },
    retry: false,
    placeholderData: (previous) => previous,
  });

  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return <OwnerAccessDenied signedOut={status === 401} />;
  }

  const handleChanged = () => queryClient.invalidateQueries({ queryKey: ['owner-console'] });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-base font-semibold leading-tight">Platform Console</h1>
              <p className="text-xs text-muted-foreground">Cellwatch internal · all tenant workspaces</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data?.generated_at && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                Updated {new Date(data.generated_at).toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to app</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {error && status !== 401 && status !== 403 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.response?.data?.error || 'Could not load the console. Try refreshing.'}
          </div>
        )}

        <OwnerMetrics metrics={data?.metrics} />

        <TenantTable
          tenants={data?.tenants || []}
          loading={isLoading}
          filter={filter}
          onFilterChange={setFilter}
          search={term}
          onSearchChange={setTerm}
          onChanged={handleChanged}
        />
      </main>
    </div>
  );
}