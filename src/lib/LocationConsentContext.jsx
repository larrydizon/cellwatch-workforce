import React, { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// One-time location-tracking consent, stored on the employee's own directory
// record. Nothing location-related may run until consentGiven is true.
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

  const mutation = useMutation({
    mutationFn: (granted) =>
      base44.functions.invoke('employeeCommand', {
        fields: {
          location_consent: granted,
          location_consent_at: new Date().toISOString(),
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['location-consent'] }),
  });

  const value = useMemo(() => ({
    isLoading,
    hasRecord: !!record,
    decisionMade: !!record?.location_consent_at,
    consentGiven: !!record?.location_consent,
    saveConsent: (granted) => mutation.mutateAsync(granted),
    isSaving: mutation.isPending,
  }), [isLoading, record, mutation.isPending]);

  return (
    <LocationConsentContext.Provider value={value}>
      {children}
    </LocationConsentContext.Provider>
  );
}

export function useLocationConsent() {
  const context = useContext(LocationConsentContext);
  return context || {
    isLoading: false,
    hasRecord: false,
    decisionMade: false,
    consentGiven: false,
    saveConsent: async () => {},
    isSaving: false,
  };
}