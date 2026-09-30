import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import moment from 'moment';
import { MapPin } from 'lucide-react';

// Fix default marker icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(initials) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:#22c55e;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:12px;font-family:sans-serif;
    ">${initials}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function LiveFieldMap({ timeEntries = [] }) {
  const active = useMemo(
    () => timeEntries.filter(t => t.status === 'active' && t.clock_in_lat && t.clock_in_lng),
    [timeEntries]
  );

  const noLocation = useMemo(
    () => timeEntries.filter(t => t.status === 'active' && (!t.clock_in_lat || !t.clock_in_lng)),
    [timeEntries]
  );

  // Default center: New Zealand
  const center = active.length > 0
    ? [active[0].clock_in_lat, active[0].clock_in_lng]
    : [-40.9006, 174.886];

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 380 }}>
        <MapContainer
          center={center}
          zoom={active.length > 0 ? 13 : 5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {active.map((entry) => {
            const initials = entry.employee_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
            return (
              <Marker
                key={entry.id}
                position={[entry.clock_in_lat, entry.clock_in_lng]}
                icon={makeIcon(initials)}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-semibold">{entry.employee_name || entry.employee_email}</p>
                    {entry.job_title && (
                      <p className="text-gray-500 text-xs mt-0.5">{entry.job_title}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      <span>⏱</span> Since {moment(entry.clock_in).format('h:mm A')}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {entry.clock_in_lat.toFixed(5)}, {entry.clock_in_lng.toFixed(5)}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <a
                        href={`https://www.google.com/maps?q=${entry.clock_in_lat},${entry.clock_in_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-xs"
                      >
                        Google Maps
                      </a>
                      <a
                        href={`https://maps.apple.com/?q=${entry.clock_in_lat},${entry.clock_in_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-xs"
                      >
                        Apple Maps
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend / workers without location */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span>{active.length} technician{active.length !== 1 ? 's' : ''} pinned</span>
        </div>
        {noLocation.length > 0 && (
          <span className="text-amber-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {noLocation.length} without GPS
          </span>
        )}
      </div>

      {/* Workers without location */}
      {noLocation.length > 0 && (
        <div className="space-y-2">
          {noLocation.map(entry => (
            <div key={entry.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-[10px]">
                {entry.employee_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
              </div>
              <span>{entry.employee_name || entry.employee_email}</span>
              <span className="ml-auto italic">No GPS data</span>
            </div>
          ))}
        </div>
      )}

      {timeEntries.filter(t => t.status === 'active').length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">No workers currently clocked in</p>
      )}
    </div>
  );
}
