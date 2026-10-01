import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import moment from 'moment';

function pinIcon(color, label, size = 26) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:11px;font-family:sans-serif;
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const START_ICON = pinIcon('#22c55e', 'S');
const END_ICON = pinIcon('#f43f5e', 'E');
const FOCUS_ICON = pinIcon('#38bdf8', '', 18);

function FlyTo({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.latitude, point.longitude], 16, { duration: 0.6 });
  }, [point, map]);
  return null;
}

// The day's readings drawn as one connected path with a distinct start and end.
export default function TrailMap({ points = [], focusPoint = null }) {
  const coords = points.map((p) => [p.latitude, p.longitude]);
  const center = coords.length ? coords[coords.length - 1] : [-40.9006, 174.886];

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 420 }}>
      <MapContainer
        center={center}
        zoom={coords.length ? 14 : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coords.length > 1 && (
          <Polyline positions={coords} pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.85 }} />
        )}
        {coords.length > 0 && (
          <Marker position={coords[0]} icon={START_ICON}>
            <Popup>
              Start · {moment(points[0].captured_at).format('h:mm A')}
            </Popup>
          </Marker>
        )}
        {coords.length > 1 && (
          <Marker position={coords[coords.length - 1]} icon={END_ICON}>
            <Popup>
              End · {moment(points[points.length - 1].captured_at).format('h:mm A')}
            </Popup>
          </Marker>
        )}
        {focusPoint && (
          <Marker position={[focusPoint.latitude, focusPoint.longitude]} icon={FOCUS_ICON} />
        )}
        <FlyTo point={focusPoint} />
      </MapContainer>
    </div>
  );
}