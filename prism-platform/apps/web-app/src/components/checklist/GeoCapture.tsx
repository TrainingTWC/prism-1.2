'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

interface Props {
  onCapture: (geo: { lat: number; lng: number }) => void;
  autoCapture?: boolean;
}

export function GeoCapture({ onCapture, autoCapture = false }: Props) {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo: GeoLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setLocation(geo);
        setLoading(false);
        onCapture({ lat: geo.lat, lng: geo.lng });
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location permission denied'
            : err.code === 2
            ? 'Position unavailable'
            : 'Location request timed out',
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [onCapture]);

  // Auto-capture on mount
  useEffect(() => {
    if (autoCapture) {
      capture();
    }
  }, [autoCapture, capture]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={capture}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-obsidian-600/30 bg-obsidian-800/60
          px-3 py-2 text-xs text-obsidian-400 hover:border-[rgba(13,140,99,0.4)]
          hover:text-obsidian-200 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d8c63] border-t-transparent" />
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        )}
        {location ? 'Update Location' : 'Capture Location'}
      </button>

      {location && (
        <span className="text-xs text-obsidian-500">
          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          <span className="ml-1">(~{Math.round(location.accuracy)}m)</span>
        </span>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
