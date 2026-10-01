import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';
import { MapPin, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import TrailMap from '@/components/location/TrailMap';
import PresenceLog from '@/components/location/PresenceLog';
import LocationHistoryFilters from '@/components/location/LocationHistoryFilters';
import { signPresenceFiles } from '@/lib/presence';
import useOrganization from '@/hooks/useOrganization';

const MANAGER_ROLES = ['admin', 'operations_manager', 'supervisor'];

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading this day...
    </div>
  );
}

function EmptyState({ title, reason }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {reason && <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{reason}</p>}
    </div>
  );
}

export default function LocationHistory() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const orgState = useOrganization(user);
  const canViewAll = MANAGER_ROLES.includes(user?.role);

  const [selectedEmail, setSelectedEmail] = useState(user?.email || '');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [focusPoint, setFocusPoint] = useState(null);
  const [clearing, setClearing] = useState(false);

  const targetEmail = canViewAll ? selectedEmail : user?.email;

  const { data: employees = [] } = useQuery({
    queryKey: ['location-history-employees', user?.organization_id],
    queryFn: async () => {
      const page = await base44.entities.Employee.filter(
        { organization_id: user.organization_id },
        { sort: 'full_name', limit: 300 }
      );
      return page.items || [];
    },
    enabled: !!user?.organization_id && canViewAll,
  });

  // Drives the empty-state wording, so an admin can tell a privacy opt-out apart
  // from a device that simply had nothing to report.
  const { data: targetRecord } = useQuery({
    queryKey: ['location-history-target', user?.organization_id, targetEmail],
    queryFn: async () => {
      const page = await base44.entities.Employee.filter(
        { organization_id: user.organization_id, email: targetEmail },
        { limit: 1 }
      );
      return page.items?.[0] || null;
    },
    enabled: !!user?.organization_id && !!targetEmail,
  });

  const start = moment(date).startOf('day').toISOString();
  const end = moment(date).endOf('day').add(1, 'millisecond').toISOString();

  const pointsQuery = useInfiniteQuery({
    queryKey: ['location-points', user?.organization_id, targetEmail, date],
    queryFn: ({ pageParam }) => base44.entities.LocationPoint.filter(
      {
        organization_id: user.organization_id,
        employee_email: targetEmail,
        captured_at: { $gte: start, $lt: end },
      },
      { sort: 'captured_at', limit: 300, cursor: pageParam }
    ),
    initialPageParam: undefined,
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    enabled: !!user?.organization_id && !!targetEmail,
  });

  const checksQuery = useInfiniteQuery({
    queryKey: ['presence-checks', user?.organization_id, targetEmail, date],
    queryFn: ({ pageParam }) => base44.entities.PresenceCheck.filter(
      {
        organization_id: user.organization_id,
        employee_email: targetEmail,
        captured_at: { $gte: start, $lt: end },
      },
      { sort: '-captured_at', limit: 50, cursor: pageParam }
    ),
    initialPageParam: undefined,
    getNextPageParam: (last) => last?.next_cursor ?? undefined,
    enabled: !!user?.organization_id && !!targetEmail,
  });

  const points = useMemo(
    () => (pointsQuery.data?.pages || []).flatMap((page) => page.items || []),
    [pointsQuery.data]
  );
  const checks = useMemo(
    () => (checksQuery.data?.pages || []).flatMap((page) => page.items || []),
    [checksQuery.data]
  );

  const fileUris = useMemo(
    () => Array.from(new Set(checks.map((check) => check.file_uri).filter(Boolean))),
    [checks]
  );

  // Snapshot images live in private storage, so each one is opened through a
  // short-lived signed link issued by the server.
  const { data: signedUrls = {} } = useQuery({
    queryKey: ['presence-signed', fileUris.join('|')],
    queryFn: () => signPresenceFiles(fileUris),
    enabled: fileUris.length > 0,
  });

  const trailReason = (() => {
    if (!targetRecord) return null;
    if (!targetRecord.location_consent_at) return 'This worker has not been asked for location consent yet.';
    if (!targetRecord.location_consent) return 'This worker has location tracking turned off.';
    if (!orgState.settings.capture_gps) return 'GPS capture is switched off for this workspace in Settings.';
    if (!orgState.settings.tracking_interval_ms) return 'No live location interval is set for this workspace in Settings.';
    return 'No GPS readings were captured for this worker on this day.';
  })();

  const presenceReason = (() => {
    if (!targetRecord) return null;
    if (!targetRecord.office_remote) return 'This worker is not flagged as an office / remote worker.';
    if (!targetRecord.presence_consent_at) return 'This worker has not been asked for presence-check consent yet.';
    if (!targetRecord.presence_consent) return 'This worker has presence checks turned off.';
    if (!orgState.settings.presence_checks_enabled) return 'Presence checks are switched off for this workspace in Settings.';
    return 'No checks were captured — the camera may have been blocked, or nothing was available at check time.';
  })();

  const clearHistory = async () => {
    setClearing(true);
    try {
      await base44.functions.invoke('locationCommand', {
        action: 'clear', employee_email: targetEmail, from: start, to: end,
      });
      await base44.functions.invoke('presenceCommand', {
        action: 'clear', employee_email: targetEmail, from: start, to: end,
      });
      queryClient.invalidateQueries({ queryKey: ['location-points'] });
      queryClient.invalidateQueries({ queryKey: ['presence-checks'] });
      setFocusPoint(null);
      toast.success('History cleared for that day');
    } catch {
      toast.error('Could not clear history');
    }
    setClearing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-display">Location History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {canViewAll
            ? 'Trace where a worker went, and confirm office and remote presence for the day.'
            : 'Your own trail and presence checks for the day.'}
        </p>
      </div>

      <LocationHistoryFilters
        canViewAll={canViewAll}
        employees={employees}
        selectedEmail={selectedEmail}
        onSelectEmail={(email) => { setSelectedEmail(email); setFocusPoint(null); }}
        date={date}
        onDateChange={(value) => { setDate(value); setFocusPoint(null); }}
        onClear={clearHistory}
        clearing={clearing}
        hasData={points.length > 0 || checks.length > 0}
      />

      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Trail
          </h2>
          <span className="text-xs text-muted-foreground">
            {points.length} point{points.length === 1 ? '' : 's'}
          </span>
        </div>

        {pointsQuery.isLoading ? (
          <Loading />
        ) : points.length > 0 ? (
          <>
            <TrailMap points={points} focusPoint={focusPoint} />
            {pointsQuery.hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pointsQuery.isFetchingNextPage}
                  onClick={() => pointsQuery.fetchNextPage()}
                >
                  {pointsQuery.isFetchingNextPage ? 'Loading...' : 'Load more points'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="No trail captured for this day" reason={trailReason} />
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" /> Presence checks
          </h2>
          <span className="text-xs text-muted-foreground">
            {checks.length} check{checks.length === 1 ? '' : 's'}
          </span>
        </div>

        {checksQuery.isLoading ? (
          <Loading />
        ) : checks.length > 0 ? (
          <>
            <PresenceLog
              checks={checks}
              signedUrls={signedUrls}
              onFocus={(check) => setFocusPoint({ latitude: check.latitude, longitude: check.longitude })}
            />
            {checksQuery.hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={checksQuery.isFetchingNextPage}
                  onClick={() => checksQuery.fetchNextPage()}
                >
                  {checksQuery.isFetchingNextPage ? 'Loading...' : 'Load more checks'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="No presence checks for this day" reason={presenceReason} />
        )}
      </div>
    </div>
  );
}