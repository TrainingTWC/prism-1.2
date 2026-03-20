'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { MapStore } from '@/hooks/use-store-map-data';
import type { StoreScore } from '@/hooks/use-map-analytics';

/* ── GeoJSON source (India states) ── */
const GEOJSON_URL =
  'https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson';
const GEOJSON_FALLBACK =
  'https://raw.githubusercontent.com/Subhash9325/GeosJSON-India-Map/master/Indian_States';

/* ── Region colors ── */
const REGION_COLORS: Record<string, string> = {
  south: '#10b37d',
  north: '#3B82F6',
  west: '#A855F7',
  'rest of south': '#EF4444',
  central: '#EAB308',
};
const DEFAULT_COLOR = '#10b37d';

/* ── Zoom level thresholds (4 levels) ── */
const ZOOM_REGION = 2;       // below → region bubbles
const ZOOM_AM = 3.5;         // below → AM patch clusters
const ZOOM_TRAINER = 5;      // below → trainer clusters
                              // above → individual store dots

/* ── Score color scale ── */
function scoreColor(score: number | null): string {
  if (score == null) return '#6B7280';
  if (score >= 85) return '#22C55E';
  if (score >= 70) return '#EAB308';
  if (score >= 50) return '#F97316';
  return '#EF4444';
}

/* ── Helpers ── */
function isDark() {
  return !document.documentElement.classList.contains('light');
}

interface Cluster { key: string; label: string; cx: number; cy: number; count: number; color: string; avgScore: number | null; stores: MapStore[] }

export interface MapDrillEvent {
  scope: 'all' | 'region' | 'am' | 'trainer' | 'store';
  scopeValue?: string;
}

interface IndiaMapProps {
  stores: MapStore[];
  storeScores?: StoreScore[];
  filteredStoreIds?: Set<string> | null;
  className?: string;
  onDrill?: (event: MapDrillEvent) => void;
}


export function IndiaMap({ stores, storeScores, filteredStoreIds, className, onDrill }: IndiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);
  const [selected, setSelected] = useState<MapStore | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const detailCache = useRef<Map<string, any>>(new Map());
  const hoverIdRef = useRef<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const geoStores = useMemo(
    () => {
      const geo = stores.filter(s => s.latitude != null && s.longitude != null);
      if (filteredStoreIds && filteredStoreIds.size > 0) return geo.filter(s => filteredStoreIds.has(s.id));
      return geo;
    },
    [stores, filteredStoreIds]
  );

  /* ── Store score lookup ── */
  const scoreMap = useMemo(() => {
    const m = new Map<string, number>();
    if (storeScores) {
      for (const ss of storeScores) {
        if (ss.avgScore != null) m.set(ss.storeId, ss.avgScore);
      }
    }
    return m;
  }, [storeScores]);

  /* ── Responsive resize ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width, height: Math.max(420, width * 0.85) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Load GeoJSON ── */
  useEffect(() => {
    let cancelled = false;
    async function load(url: string): Promise<FeatureCollection | null> {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    }
    (async () => {
      let data = await load(GEOJSON_URL);
      if (!data && !cancelled) data = await load(GEOJSON_FALLBACK);
      if (!cancelled && data) setGeoData(data);
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Region color for a store ── */
  const regionColor = useCallback((s: MapStore) => {
    const r = s.region?.name?.toLowerCase() || '';
    return REGION_COLORS[r] || DEFAULT_COLOR;
  }, []);

  /* ── Cluster average score helper ── */
  const clusterAvg = useCallback((arr: MapStore[]): number | null => {
    const scores = arr.map(s => scoreMap.get(s.id)).filter((v): v is number => v != null);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 : null;
  }, [scoreMap]);

  /* ── Build clusters at region level ── */
  const regionClusters = useMemo((): Cluster[] => {
    const map = new Map<string, MapStore[]>();
    geoStores.forEach(s => {
      const key = s.region?.name || 'Unknown';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([key, arr]) => ({
      key,
      label: key,
      cx: d3.mean(arr, s => s.longitude!)!,
      cy: d3.mean(arr, s => s.latitude!)!,
      count: arr.length,
      color: REGION_COLORS[key.toLowerCase()] || DEFAULT_COLOR,
      avgScore: clusterAvg(arr),
      stores: arr,
    }));
  }, [geoStores, clusterAvg]);

  /* ── Build clusters at AM patch level ── */
  const amClusters = useMemo((): Cluster[] => {
    const map = new Map<string, MapStore[]>();
    geoStores.forEach(s => {
      const key = s.amName || 'Unassigned';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([key, arr]) => ({
      key,
      label: key,
      cx: d3.mean(arr, s => s.longitude!)!,
      cy: d3.mean(arr, s => s.latitude!)!,
      count: arr.length,
      color: REGION_COLORS[arr[0]?.region?.name?.toLowerCase() || ''] || DEFAULT_COLOR,
      avgScore: clusterAvg(arr),
      stores: arr,
    }));
  }, [geoStores, clusterAvg]);

  /* ── Build clusters at trainer level ── */
  const trainerClusters = useMemo((): Cluster[] => {
    const map = new Map<string, MapStore[]>();
    geoStores.forEach(s => {
      const key = s.trainer1Name || 'Unassigned';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([key, arr]) => ({
      key,
      label: key,
      cx: d3.mean(arr, s => s.longitude!)!,
      cy: d3.mean(arr, s => s.latitude!)!,
      count: arr.length,
      color: REGION_COLORS[arr[0]?.region?.name?.toLowerCase() || ''] || DEFAULT_COLOR,
      avgScore: clusterAvg(arr),
      stores: arr,
    }));
  }, [geoStores, clusterAvg]);

  /* ── D3 Render ── */
  useEffect(() => {
    if (!svgRef.current || !geoData) return;
    const { width, height } = dimensions;
    const dark = isDark();
    const isFiltered = !!(filteredStoreIds && filteredStoreIds.size > 0);

    // Theme-aware colors
    const stateFill = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const stateStroke = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
    const labelFill = dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)';
    const labelShadow = dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs for drop-shadow
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'label-bg');
    filter.append('feFlood').attr('flood-color', labelShadow).attr('flood-opacity', 0.7);
    filter.append('feComposite').attr('in2', 'SourceGraphic').attr('operator', 'in');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const projection = d3.geoMercator()
      .center([78.9629, 23.5937])
      .fitSize([width, height], geoData);
    const pathGen = d3.geoPath().projection(projection);

    const g = svg.append('g');

    /* ── Zoom ── */
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 100])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        const k = event.transform.k as number;
        setZoomLevel(k);
        updateVisibility(k);
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    // Clear tooltip when mouse leaves the SVG entirely
    svg.on('mouseleave', () => setTooltip(null));

    /* ── Region fill: color each state polygon by region ── */
    // Map state names to regions by finding closest store
    function stateRegionColor(feature: Feature<Geometry>): string {
      const centroid = pathGen.centroid(feature as any);
      if (!centroid || isNaN(centroid[0])) return stateFill;
      // Find nearest stores to this state centroid
      let minDist = Infinity;
      let nearestRegion = '';
      geoStores.forEach(s => {
        const pt = projection([s.longitude!, s.latitude!]);
        if (!pt) return;
        const dist = Math.hypot(pt[0] - centroid[0], pt[1] - centroid[1]);
        if (dist < minDist) {
          minDist = dist;
          nearestRegion = s.region?.name?.toLowerCase() || '';
        }
      });
      const color = REGION_COLORS[nearestRegion] || DEFAULT_COLOR;
      return color;
    }

    /* ── States ── */
    g.selectAll<SVGPathElement, Feature<Geometry>>('path.state')
      .data(geoData.features)
      .join('path')
      .attr('class', 'state')
      .attr('d', pathGen as any)
      .attr('fill', d => {
        const c = stateRegionColor(d);
        return d3.color(c)!.copy({ opacity: 0.12 }).formatRgb();
      })
      .attr('stroke', stateStroke)
      .attr('stroke-width', 0.5)
      .on('mouseover', function (_event, d) {
        const c = stateRegionColor(d);
        d3.select(this).attr('fill', d3.color(c)!.copy({ opacity: 0.25 }).formatRgb());
      })
      .on('mouseout', function (_event, d) {
        const c = stateRegionColor(d);
        d3.select(this).attr('fill', d3.color(c)!.copy({ opacity: 0.12 }).formatRgb());
      });

    /* ── Region clusters (zoom < ZOOM_REGION) ── */
    const regionG = g.append('g').attr('class', 'layer-regions');
    regionClusters.forEach(cl => {
      const pt = projection([cl.cx, cl.cy]);
      if (!pt) return;
      const grp = regionG.append('g').attr('class', 'region-cluster')
        .attr('transform', `translate(${pt[0]},${pt[1]})`).style('cursor', 'pointer');
      const sc = scoreColor(cl.avgScore);
      // Outer ring
      grp.append('circle').attr('r', 28)
        .attr('fill', d3.color(cl.color)!.copy({ opacity: 0.15 }).formatRgb())
        .attr('stroke', cl.color).attr('stroke-width', 1.5).attr('stroke-opacity', 0.4);
      // Inner circle
      grp.append('circle').attr('r', 18).attr('fill', cl.color).attr('opacity', 0.85);
      // Count
      grp.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', '#fff').attr('font-size', '11px').attr('font-weight', '700')
        .attr('font-family', 'JetBrains Mono, monospace').text(cl.count);
      // Label
      grp.append('text').attr('text-anchor', 'middle').attr('dy', '-32')
        .attr('fill', labelFill).attr('font-size', '10px').attr('font-weight', '600')
        .attr('font-family', 'JetBrains Mono, monospace').text(cl.label);
      // Score badge
      if (cl.avgScore != null) {
        grp.append('text').attr('text-anchor', 'middle').attr('dy', '40')
          .attr('fill', sc).attr('font-size', '8px').attr('font-weight', '700')
          .attr('font-family', 'JetBrains Mono, monospace').text(`${cl.avgScore.toFixed(1)}%`);
      }
      grp.on('click', () => {
        onDrill?.({ scope: 'region', scopeValue: cl.key });
        const bounds = cl.stores.map(s => projection([s.longitude!, s.latitude!])!);
        const x0 = d3.min(bounds, b => b[0])! - 30;
        const y0 = d3.min(bounds, b => b[1])! - 30;
        const x1 = d3.max(bounds, b => b[0])! + 30;
        const y1 = d3.max(bounds, b => b[1])! + 30;
        const dx = x1 - x0, dy = y1 - y0;
        const scale = Math.min(25, 0.9 / Math.max(dx / width, dy / height));
        const tx = width / 2 - scale * (x0 + dx / 2);
        const ty = height / 2 - scale * (y0 + dy / 2);
        svg.transition().duration(750).call(
          zoom.transform as any,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
      });
    });

    /* ── AM connection lines (hub-and-spoke from centroid to stores) ── */
    const amLinesG = g.append('g').attr('class', 'layer-am-lines');
    amClusters.forEach(cl => {
      const centroid = projection([cl.cx, cl.cy]);
      if (!centroid) return;
      cl.stores.forEach(s => {
        const pt = projection([s.longitude!, s.latitude!]);
        if (!pt) return;
        amLinesG.append('line')
          .attr('x1', centroid[0]).attr('y1', centroid[1])
          .attr('x2', pt[0]).attr('y2', pt[1])
          .attr('stroke', cl.color)
          .attr('stroke-width', 0.8)
          .attr('stroke-opacity', 0.35)
          .attr('stroke-dasharray', '3,2');
      });
    });

    /* ── AM clusters (ZOOM_REGION ≤ zoom < ZOOM_AM) ── */
    const amG = g.append('g').attr('class', 'layer-am');
    amClusters.forEach(cl => {
      const pt = projection([cl.cx, cl.cy]);
      if (!pt) return;
      const sc = scoreColor(cl.avgScore);
      const grp = amG.append('g').attr('class', 'am-cluster')
        .attr('transform', `translate(${pt[0]},${pt[1]})`).style('cursor', 'pointer');
      grp.append('circle').attr('r', 14)
        .attr('fill', d3.color(cl.color)!.copy({ opacity: 0.2 }).formatRgb())
        .attr('stroke', cl.color).attr('stroke-width', 1).attr('stroke-opacity', 0.5);
      grp.append('circle').attr('r', 9).attr('fill', cl.color).attr('opacity', 0.8);
      grp.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', '#fff').attr('font-size', '8px').attr('font-weight', '700')
        .attr('font-family', 'JetBrains Mono, monospace').text(cl.count);
      grp.append('text').attr('text-anchor', 'middle').attr('dy', '-18')
        .attr('fill', labelFill).attr('font-size', '7px').attr('font-weight', '600')
        .attr('font-family', 'JetBrains Mono, monospace').text(cl.label);
      if (cl.avgScore != null) {
        grp.append('text').attr('text-anchor', 'middle').attr('dy', '22')
          .attr('fill', sc).attr('font-size', '6px').attr('font-weight', '700')
          .attr('font-family', 'JetBrains Mono, monospace').text(`${cl.avgScore.toFixed(1)}%`);
      }
      grp.on('click', () => {
        onDrill?.({ scope: 'am', scopeValue: cl.key });
        const bounds = cl.stores.map(s => projection([s.longitude!, s.latitude!])!);
        const x0 = d3.min(bounds, b => b[0])! - 20;
        const y0 = d3.min(bounds, b => b[1])! - 20;
        const x1 = d3.max(bounds, b => b[0])! + 20;
        const y1 = d3.max(bounds, b => b[1])! + 20;
        const dx = x1 - x0, dy = y1 - y0;
        const scale = Math.min(40, 0.9 / Math.max(dx / width, dy / height));
        const tx = width / 2 - scale * (x0 + dx / 2);
        const ty = height / 2 - scale * (y0 + dy / 2);
        svg.transition().duration(750).call(
          zoom.transform as any,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
      });
    });

    /* ── Trainer connection lines (hub-and-spoke from centroid to stores) ── */
    const trainerLinesG = g.append('g').attr('class', 'layer-trainer-lines');
    trainerClusters.forEach(cl => {
      const centroid = projection([cl.cx, cl.cy]);
      if (!centroid) return;
      const sc = scoreColor(cl.avgScore);
      cl.stores.forEach(s => {
        const pt = projection([s.longitude!, s.latitude!]);
        if (!pt) return;
        trainerLinesG.append('line')
          .attr('x1', centroid[0]).attr('y1', centroid[1])
          .attr('x2', pt[0]).attr('y2', pt[1])
          .attr('stroke', sc)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.4);
      });
    });

    /* ── Trainer clusters (ZOOM_AM ≤ zoom < ZOOM_TRAINER) ── */
    const trainerG = g.append('g').attr('class', 'layer-trainer');
    trainerClusters.forEach(cl => {
      const pt = projection([cl.cx, cl.cy]);
      if (!pt) return;
      const sc = scoreColor(cl.avgScore);
      const grp = trainerG.append('g').attr('class', 'trainer-cluster')
        .attr('transform', `translate(${pt[0]},${pt[1]})`).style('cursor', 'pointer');
      grp.append('circle').attr('r', 10)
        .attr('fill', d3.color(cl.color)!.copy({ opacity: 0.2 }).formatRgb())
        .attr('stroke', sc).attr('stroke-width', 1.5).attr('stroke-opacity', 0.7);
      grp.append('circle').attr('r', 6).attr('fill', sc).attr('opacity', 0.85);
      grp.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', '#fff').attr('font-size', '6px').attr('font-weight', '700')
        .attr('font-family', 'JetBrains Mono, monospace').text(cl.count);
      grp.append('text').attr('text-anchor', 'middle').attr('dy', '-14')
        .attr('fill', labelFill).attr('font-size', '5.5px').attr('font-weight', '600')
        .attr('font-family', 'JetBrains Mono, monospace').text(cl.label);
      if (cl.avgScore != null) {
        grp.append('text').attr('text-anchor', 'middle').attr('dy', '16')
          .attr('fill', sc).attr('font-size', '5px').attr('font-weight', '700')
          .attr('font-family', 'JetBrains Mono, monospace').text(`${cl.avgScore.toFixed(1)}%`);
      }
      grp.on('click', () => {
        onDrill?.({ scope: 'trainer', scopeValue: cl.key });
        const bounds = cl.stores.map(s => projection([s.longitude!, s.latitude!])!);
        const x0 = d3.min(bounds, b => b[0])! - 15;
        const y0 = d3.min(bounds, b => b[1])! - 15;
        const x1 = d3.max(bounds, b => b[0])! + 15;
        const y1 = d3.max(bounds, b => b[1])! + 15;
        const dx = x1 - x0, dy = y1 - y0;
        const scale = Math.min(60, 0.9 / Math.max(dx / width, dy / height));
        const tx = width / 2 - scale * (x0 + dx / 2);
        const ty = height / 2 - scale * (y0 + dy / 2);
        svg.transition().duration(750).call(
          zoom.transform as any,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
      });
    });

    /* ── Store dots (zoom ≥ ZOOM_TRAINER) ── */
    const storeG = g.append('g').attr('class', 'layer-stores');
    // Pulse
    storeG.selectAll<SVGCircleElement, MapStore>('circle.store-pulse')
      .data(geoStores, d => d.id)
      .join('circle')
      .attr('class', 'store-pulse')
      .attr('cx', d => projection([d.longitude!, d.latitude!])![0])
      .attr('cy', d => projection([d.longitude!, d.latitude!])![1])
      .attr('r', 7)
      .attr('fill', d => scoreColor(scoreMap.get(d.id) ?? null))
      .attr('opacity', 0.18);
    // Dot — colored by score, NO outline
    storeG.selectAll<SVGCircleElement, MapStore>('circle.store-dot')
      .data(geoStores, d => d.id)
      .join('circle')
      .attr('class', 'store-dot')
      .attr('cx', d => projection([d.longitude!, d.latitude!])![0])
      .attr('cy', d => projection([d.longitude!, d.latitude!])![1])
      .attr('r', 4)
      .attr('fill', d => scoreColor(scoreMap.get(d.id) ?? null))
      .attr('stroke', 'none')
      .attr('stroke-width', 0)
      .style('cursor', 'pointer')
      .on('mouseover', function (event: MouseEvent, d) {
        hoverIdRef.current = d.id;
        const curK = d3.zoomTransform(svgRef.current!).k;
        d3.select(this).attr('r', 6 / curK);
        const rect = svgRef.current!.getBoundingClientRect();
        const sc = scoreMap.get(d.id);
        const scoreHtml = sc != null ? `<span style="color:${scoreColor(sc)};font-weight:700">${sc.toFixed(1)}%</span>` : '<span style="opacity:.5">No data</span>';
        // Quick tooltip
        const quickHtml = `<div style="margin-bottom:4px"><b>${d.storeName}</b> <span style="opacity:.5">${d.storeCode || ''}</span></div>` +
          `<div style="display:flex;gap:8px;font-size:10px;opacity:.7;">` +
            `<span>AM: ${d.amName || '—'}</span>` +
            `<span>Trainer: ${d.trainer1Name || '—'}</span>` +
          `</div>` +
          `<div style="margin-top:4px">Score: ${scoreHtml}</div>` +
          `<div style="margin-top:4px;opacity:.4;font-size:9px">Loading details…</div>`;
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, html: quickHtml });

        // Fetch rich detail
        const cached = detailCache.current.get(d.id);
        if (cached) {
          if (hoverIdRef.current === d.id) setTooltip(prev => prev ? { ...prev, html: buildRichTooltip(cached) } : null);
        } else {
          fetch(`${API_URL}/api/map-analytics/store-detail/${encodeURIComponent(d.id)}`)
            .then(r => r.ok ? r.json() : null)
            .then(json => {
              if (!json?.data) return;
              detailCache.current.set(d.id, json.data);
              if (hoverIdRef.current === d.id) setTooltip(prev => prev ? { ...prev, html: buildRichTooltip(json.data) } : null);
            })
            .catch(() => {});
        }
      })
      .on('mousemove', function (event: MouseEvent) {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip(prev => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
      })
      .on('mouseout', function () {
        hoverIdRef.current = null;
        const curK = d3.zoomTransform(svgRef.current!).k;
        d3.select(this).attr('r', 4 / curK);
        setTooltip(null);
      })
      .on('click', (_event: MouseEvent, d) => {
        setSelected(prev => prev?.id === d.id ? null : d);
        onDrill?.({ scope: 'store', scopeValue: d.id });
      });

    // Start with correct visibility
    updateVisibility(1);

    function updateVisibility(k: number) {
      const invK = 1 / k;

      if (isFiltered) {
        // ── Filtered mode: hide ALL cluster bubbles, show only stores + lines ──
        regionG.style('display', 'none');
        amG.style('display', 'none');
        trainerG.style('display', 'none');
        // Always show connection lines when filtered
        amLinesG.style('display', 'block').style('opacity', '0.5');
        amLinesG.selectAll('line').attr('stroke-width', 1 * invK);
        trainerLinesG.style('display', 'block').style('opacity', '0.7');
        trainerLinesG.selectAll('line').attr('stroke-width', 1.2 * invK);
        // Always show store dots when filtered
        storeG.style('display', 'block');
        storeG.selectAll('.store-dot').attr('r', 4 * invK);
        storeG.selectAll('.store-pulse').attr('r', 7 * invK);
        return;
      }

      // ── Normal (unfiltered) progressive zoom ──
      // region clusters: visible when zoomed out
      regionG.style('display', k < ZOOM_REGION ? 'block' : 'none');
      regionG.selectAll<SVGGElement, unknown>('.region-cluster').each(function () {
        const grp = d3.select(this);
        grp.select('circle:nth-child(1)').attr('r', 28 * invK);
        grp.select('circle:nth-child(2)').attr('r', 18 * invK);
        grp.selectAll('text').attr('font-size', (_d, i) => `${([11, 10, 8][i] || 8) * invK}px`);
      });
      // AM connection lines: visible from AM level through store level
      amLinesG.style('display', k >= ZOOM_REGION ? 'block' : 'none');
      amLinesG.style('opacity', k >= ZOOM_TRAINER ? '0.2' : '0.7');
      amLinesG.selectAll('line').attr('stroke-width', 0.8 * invK);
      // AM clusters: visible at mid-zoom
      amG.style('display', k >= ZOOM_REGION && k < ZOOM_AM ? 'block' : 'none');
      amG.selectAll<SVGGElement, unknown>('.am-cluster').each(function () {
        const grp = d3.select(this);
        grp.select('circle:nth-child(1)').attr('r', 14 * invK);
        grp.select('circle:nth-child(2)').attr('r', 9 * invK);
        grp.selectAll('text').attr('font-size', (_d, i) => `${([8, 7, 6][i] || 6) * invK}px`);
      });
      // Trainer connection lines: visible from trainer level through store level
      trainerLinesG.style('display', k >= ZOOM_AM ? 'block' : 'none');
      trainerLinesG.style('opacity', k >= ZOOM_TRAINER ? '0.55' : '0.8');
      trainerLinesG.selectAll('line').attr('stroke-width', 1 * invK);
      // Trainer clusters
      trainerG.style('display', k >= ZOOM_AM && k < ZOOM_TRAINER ? 'block' : 'none');
      trainerG.selectAll<SVGGElement, unknown>('.trainer-cluster').each(function () {
        const grp = d3.select(this);
        grp.select('circle:nth-child(1)').attr('r', 10 * invK);
        grp.select('circle:nth-child(2)').attr('r', 6 * invK);
        grp.selectAll('text').attr('font-size', (_d, i) => `${([6, 5.5, 5][i] || 5) * invK}px`);
      });
      // Store dots: visible when zoomed in past trainers
      storeG.style('display', k >= ZOOM_TRAINER ? 'block' : 'none');
      storeG.selectAll('.store-dot').attr('r', 4 * invK);
      storeG.selectAll('.store-pulse').attr('r', 7 * invK);
    }

    function buildRichTooltip(d: any): string {
      const sc = d.overallScore;
      const scColor = scoreColor(sc);
      const scoreLabel = sc != null ? `<span style="color:${scColor};font-weight:700">${sc.toFixed(1)}%</span>` : '<span style="opacity:.5">N/A</span>';

      // Dept score bars
      let deptHtml = '';
      if (d.deptScores && d.deptScores.length > 0) {
        deptHtml = `<div style="margin-top:6px;font-size:9px;font-weight:600;opacity:.5;text-transform:uppercase;letter-spacing:0.5px">Dept Scores</div>`;
        for (const ds of d.deptScores) {
          const pct = Math.min(100, Math.max(0, ds.avgScore));
          const barColor = scoreColor(ds.avgScore);
          deptHtml += `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">` +
            `<span style="width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;opacity:.7">${ds.department}</span>` +
            `<div style="flex:1;height:4px;background:rgba(128,128,128,0.2);border-radius:2px;overflow:hidden">` +
              `<div style="width:${pct}%;height:100%;background:${barColor};border-radius:2px"></div>` +
            `</div>` +
            `<span style="font-size:9px;font-weight:600;color:${barColor};min-width:30px;text-align:right">${ds.avgScore.toFixed(1)}%</span>` +
          `</div>`;
        }
      }

      // AI insight
      const insightHtml = d.aiInsight
        ? `<div style="margin-top:6px;padding:4px 6px;background:rgba(16,179,125,0.1);border-left:2px solid #10b37d;border-radius:2px;font-size:9px;opacity:.85">💡 ${d.aiInsight}</div>`
        : '';

      return `<div style="min-width:220px">` +
        `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">` +
          `<b>${d.storeName}</b>` +
          `<span style="opacity:.4;font-size:9px">${d.storeCode || ''}</span>` +
        `</div>` +
        `<div style="display:flex;gap:8px;font-size:10px;opacity:.6">${d.city || ''} · ${d.region || ''}</div>` +
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:6px;font-size:10px">` +
          `<div><span style="opacity:.5">AM:</span> ${d.am || '—'}</div>` +
          `<div><span style="opacity:.5">Trainer:</span> ${d.trainer || '—'}</div>` +
          `<div><span style="opacity:.5">Manpower:</span> <b>${d.manpower ?? '—'}</b></div>` +
          `<div><span style="opacity:.5">Score:</span> ${scoreLabel}</div>` +
        `</div>` +
        deptHtml +
        insightHtml +
      `</div>`;
    }

  }, [geoData, geoStores, dimensions, regionColor, regionClusters, amClusters, trainerClusters, scoreMap, onDrill, filteredStoreIds]);

  /* ── Auto-zoom to filtered stores ── */
  useEffect(() => {
    if (!filteredStoreIds || filteredStoreIds.size === 0 || !svgRef.current || !geoData || !zoomRef.current) return;
    const { width, height } = dimensions;
    const projection = d3.geoMercator().center([78.9629, 23.5937]).fitSize([width, height], geoData);
    const pts = geoStores.map(s => projection([s.longitude!, s.latitude!])!).filter(Boolean);
    if (pts.length === 0) return;

    if (pts.length === 1) {
      // Single store — zoom to it
      const [cx, cy] = pts[0];
      const scale = 30;
      const tx = width / 2 - scale * cx;
      const ty = height / 2 - scale * cy;
      d3.select(svgRef.current).transition().duration(750).call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
    } else {
      const pad = 40;
      const x0 = d3.min(pts, p => p[0])! - pad;
      const y0 = d3.min(pts, p => p[1])! - pad;
      const x1 = d3.max(pts, p => p[0])! + pad;
      const y1 = d3.max(pts, p => p[1])! + pad;
      const dx = x1 - x0, dy = y1 - y0;
      const fitScale = 0.9 / Math.max(dx / width, dy / height);
      // Zoom deep so connection-line web is properly visible (≈ 1km = 2cm)
      const minZoom = pts.length <= 10 ? 30 : pts.length <= 30 ? 20 : pts.length <= 80 ? 12 : 8;
      const scale = Math.max(minZoom, Math.min(80, fitScale));
      const tx = width / 2 - scale * (x0 + dx / 2);
      const ty = height / 2 - scale * (y0 + dy / 2);
      d3.select(svgRef.current).transition().duration(750).call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
    }
  }, [filteredStoreIds, geoStores, geoData, dimensions]);

  /* ── Zoom level label ── */
  const levelLabel = zoomLevel < ZOOM_REGION ? 'Region' : zoomLevel < ZOOM_AM ? 'AM Patch' : zoomLevel < ZOOM_TRAINER ? 'Trainer' : 'Store';

  /* ── Region legend ── */
  const activeRegions = Array.from(
    new Set(stores.map(s => s.region?.name?.toLowerCase()).filter(Boolean))
  );

  if (!geoData) {
    return (
      <div className={`flex items-center justify-center ${className || ''}`} style={{ minHeight: 400 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <span className="text-xs text-[var(--text-muted)] font-mono">Loading map data…</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
        style={{ background: 'transparent' }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 px-3 py-2.5 rounded-lg border border-[var(--border-primary)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-2xl"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12, maxWidth: 320, minWidth: 200 }}
        >
          <div className="text-xs font-mono text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: tooltip.html }} />
        </div>
      )}

      {/* Selected store card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 z-40 rounded-xl border border-[var(--border-primary)] bg-[var(--glass-bg)] backdrop-blur-xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{selected.storeName}</p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">{selected.storeCode}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <InfoChip label="Region" value={selected.region?.name || '—'} />
            <InfoChip label="AM" value={selected.amName || '—'} />
            <InfoChip label="Trainer" value={selected.trainer1Name || '—'} />
            <InfoChip label="Score" value={scoreMap.get(selected.id) != null ? `${scoreMap.get(selected.id)!.toFixed(1)}%` : '—'} />
            <InfoChip label="Format" value={selected.storeFormat || '—'} />
            <InfoChip label="Menu" value={selected.menuType || '—'} />
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <div className={`w-2 h-2 rounded-full ${selected.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-[10px] text-[var(--text-muted)] font-mono">{selected.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      )}

      {/* Region legend — hidden when filters are active (panel has all info) */}
      {!filteredStoreIds && (
      <div className="absolute top-3 left-3 flex flex-col gap-1 z-30">
        {activeRegions.map(r => (
          <div key={r} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--glass-bg)] backdrop-blur border border-[var(--border-subtle)]">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: REGION_COLORS[r!] || DEFAULT_COLOR }} />
            <span className="text-[10px] font-mono text-[var(--text-secondary)] capitalize">{r}</span>
          </div>
        ))}
      </div>
      )}

      {/* Zoom level indicator + hint */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
        {filteredStoreIds && filteredStoreIds.size > 0 && (
          <div className="px-2 py-1 rounded-md bg-[var(--accent)]/10 backdrop-blur border border-[var(--accent)]/30">
            <span className="text-[10px] font-mono text-[var(--accent)] font-bold">
              {filteredStoreIds.size} store{filteredStoreIds.size !== 1 ? 's' : ''} filtered
            </span>
          </div>
        )}
        <div className="px-2 py-1 rounded-md bg-[var(--glass-bg)] backdrop-blur border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">{levelLabel} view</span>
        </div>
      </div>

      {/* Reset zoom button */}
      {zoomLevel > 1.1 && (
        <button
          onClick={() => {
            if (svgRef.current && zoomRef.current) {
              d3.select(svgRef.current).transition().duration(500).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity
              );
            }
          }}
          className="absolute top-3 right-3 z-30 px-2.5 py-1.5 rounded-lg bg-[var(--glass-bg)] backdrop-blur border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] transition-colors"
        >
          Reset zoom
        </button>
      )}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{label}</p>
      <p className="text-xs text-[var(--text-primary)] font-mono mt-0.5 truncate">{value}</p>
    </div>
  );
}
