'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export interface MapStore {
  id: string;
  storeCode: string | null;
  storeName: string;
  city: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  region: { id: string; name: string } | null;
  amName: string | null;
  trainer1Name: string | null;
  regionalTrainerName: string | null;
  storeFormat: string | null;
  menuType: string | null;
  priceGroup: string | null;
  isActive: boolean;
}

export function useStoreMapData() {
  const [stores, setStores] = useState<MapStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/stores?companyId=${COMPANY_ID}&active=true`);
        if (!res.ok) throw new Error('Failed to fetch stores');
        const json = await res.json();
        if (!cancelled) {
          // Only include stores that have geo coordinates
          const geoStores = (json.data || []).filter(
            (s: MapStore) => s.latitude != null && s.longitude != null
          );
          setStores(geoStores);
        }
      } catch (err) {
        console.error('Store map data fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { stores, loading };
}
