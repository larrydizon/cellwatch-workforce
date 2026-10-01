import React, { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// One-time consent, stored on the employee's own directory record. Location
// tracking and office/remote presence checks are each asked once and remembered
// forever. Nothing in either feature may run until its consent is true.
const LocationConsentContext = createContext(null);

export function LocationConsentProvider({ user, children }) {
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery({
    queryKey: ['location-consent', user?.email],
    queryFn: async () => {
      const page = await base44.entities.Employee.filter(
        { organization_id: user.organization_id, email: user.email },
        { sort: '-created_date', limit: 1 }
      );
      return page.items?.[0] || null;
    },
    enabled: !!user?.email && !!user?.organization_id,
  });

  const save = (fields) =>
    base44.functions.invoke('employeeCommand', { fields });

  const mutation = useMutation({
    mutationFn: (granted) => save({
      location_consent: granted,
      location_consent_at: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['location-consent'] }),
  });

  const presenceMutation = useMutation({
    mutationFn: (granted) => save({
      presence_consent: granted,
      presence_consent_at: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['location-consent'] }),
  });

  const value = useMemo(() => ({
    isLoading,
    hasRecord: !!record,
    decisionMade: !!record?.location_consent_at,
    consentGiven: !!record?.location_consent,
    saveConsent: (granted) => mutation.mutateAsync(granted),
    isSaving: mutation.isPending || presenceMutation.isPending,

    // Office / remote presence checks
    presenceRequested: !!record?.office_remote,
    presenceDecisionMade: !!record?.presence_consent_at,
    presenceConsentGiven: !!record?.presence_consent,
    savePresenceConsent: (granted) => presenceMutation.mutateAsync(granted),
  }), [isLoading, record, mutation.isPending, presenceMutation.isPending]);

  return (
    <LocationConsentContext.Provider value={value}>
      {children}
    </LocationConsentContext.Provider>
  );
}

const FALLBACK = {
  isLoading: false,
  hasRecord: false,
  decisionMade: false,
  consentGiven: false,
  saveConsent: async () => {},
  isSaving: false,
  presenceRequested: false,
  presenceDecisionMade: false,
  presenceConsentGiven: false,
  savePresenceConsent: async () => {},
};

export function useLocationConsent() {
  return useContext(LocationConsentContext) || FALLBACK;
}