import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, MapPin, Bell, Clock, Users } from 'lucide-react';

const TRACKING_INTERVAL_KEY = 'location_tracking_interval_ms';

const INTERVAL_OPTIONS = [
  { label: 'Disabled', value: '0' },
  { label: 'Every 5 seconds', value: '5000' },
  { label: 'Every 15 seconds', value: '15000' },
  { label: 'Every 30 seconds', value: '30000' },
  { label: 'Every 1 minute', value: '60000' },
  { label: 'Every 2 minutes', value: '120000' },
  { label: 'Every 5 minutes', value: '300000' },
];

export default function Settings() {
  const [trackingInterval, setTrackingInterval] = useState(
    () => localStorage.getItem(TRACKING_INTERVAL_KEY) || '0'
  );

  const handleIntervalChange = (val) => {
    setTrackingInterval(val);
    localStorage.setItem(TRACKING_INTERVAL_KEY, val);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" /> GPS & Location
          </CardTitle>
          <CardDescription>Configure location tracking for your workforce</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Capture GPS on clock in/out</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Record employee location when they clock in or out</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label>Live location update interval</Label>
              <p className="text-xs text-muted-foreground mt-0.5">How often to refresh GPS while clocked in</p>
            </div>
            <Select value={trackingInterval} onValueChange={handleIntervalChange}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" /> Time Clock
          </CardTitle>
          <CardDescription>Time tracking rules and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Overtime alerts</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Alert when an employee exceeds 8 hours</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Late clock-in alerts</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Alert if clock-in is 15+ minutes after shift start</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Missed clock-out alerts</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Alert if employee hasn't clocked out after shift</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </CardTitle>
          <CardDescription>How you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>In-app notifications</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Show notifications within the app</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Email notifications</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Send important alerts via email</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" /> Privacy (NZ)
          </CardTitle>
          <CardDescription>Privacy controls for New Zealand compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-accent/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p>• GPS data is collected only during work hours (clock in/out)</p>
            <p>• Employees are notified when location is being tracked</p>
            <p>• Location data is retained for 90 days by default</p>
            <p>• Employees can request access to their own GPS records</p>
            <p>• All data is stored securely and encrypted at rest</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}