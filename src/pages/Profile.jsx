import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import EmployeeProfileForm from '@/components/profile/EmployeeProfileForm';
import CertificatesList from '@/components/profile/CertificatesList';
import LocationTrackingCard from '@/components/profile/LocationTrackingCard';

export default function Profile() {
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(user);

  useEffect(() => { setProfile(user); }, [user]);

  const refresh = async () => {
    const me = await base44.auth.me();
    setProfile(me);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your details, photos, and certificates</p>
      </div>

      {profile && (
        <EmployeeProfileForm targetUser={profile} viewer={user} onSaved={refresh} />
      )}

      <LocationTrackingCard />

      {profile && <CertificatesList user={profile} />}

      <div className="flex justify-start">
        <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => base44.auth.logout()}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}