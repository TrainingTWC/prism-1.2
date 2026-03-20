'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

/* ─── Types ─── */
type Tool = 'circle' | 'rect' | 'line' | 'arrow' | 'freehand' | 'text';

interface Point { x: number; y: number }

interface ShapeBase { id: string; tool: Tool; color: string; lineWidth: number }
interface CircleShape extends ShapeBase { tool: 'circle'; cx: number; cy: number; rx: number; ry: number }
interface RectShape extends ShapeBase { tool: 'rect'; x: number; y: number; w: number; h: number }
interface LineShape extends ShapeBase { tool: 'line'; x1: number; y1: number; x2: number; y2: number }
interface ArrowShape extends ShapeBase { tool: 'arrow'; x1: number; y1: number; x2: number; y2: number }
interface FreehandShape extends ShapeBase { tool: 'freehand'; points: Point[] }
interface TextShape extends ShapeBase { tool: 'text'; x: number; y: number; text: string; fontSize: number }

type Shape = CircleShape | RectShape | LineShape | ArrowShape | FreehandShape | TextShape;

interface Props {
  imageSrc: string;
  onSave: (annotatedDataUrl: string, shapes: Shape[]) => void;
  onCancel: () => void;
}

const COLORS = ['#EF4444', '#10b37d', '#FACC15', '#22C55E', '#3B82F6', '#FFFFFF'];
const TOOLS: { key: Tool; label: string; icon: JSX.Element }[] = [
  {
    key: 'freehand', label: 'Draw',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />,
  },
  {
    key: 'circle', label: 'Circle',
    icon: <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    key: 'rect', label: 'Rectangle',
    icon: <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    key: 'line', label: 'Line',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15" />,
  },
  {
    key: 'arrow', label: 'Arrow',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />,
  },
  {
    key: 'text', label: 'Text',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 8v8m10-8v8m-5-8v8M4 4h16" />,
  },
];

let _shapeId = 0;
function uid() { return `s${++_shapeId}_${Date.now()}`; }

/* ─── Drawing helpers ─── */
function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (s.tool) {
    case 'circle': {
      ctx.beginPath();
      ctx.ellipse(s.cx, s.cy, Math.abs(s.rx), Math.abs(s.ry), 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'rect': {
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      break;
    }
    case 'arrow': {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      // arrowhead
      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      const headLen = 14;
      ctx.beginPath();
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(s.x2 - headLen * Math.cos(angle - Math.PI / 6), s.y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(s.x2 - headLen * Math.cos(angle + Math.PI / 6), s.y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
      break;
    }
    case 'freehand': {
      if (s.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
      break;
    }
    case 'text': {
      ctx.font = `bold ${s.fontSize}px sans-serif`;
      // text background box
      const metrics = ctx.measureText(s.text);
      const pad = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(s.x - pad, s.y - s.fontSize - pad, metrics.width + pad * 2, s.fontSize + pad * 2);
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, s.x, s.y);
      break;
    }
  }
}

/* ─── Component ─── */
export function ImageAnnotationEditor({ imageSrc, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<Tool>('freehand');
  const [color, setColor] = useState('#EF4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState<Point | null>(null);
  const [currentFreehand, setCurrentFreehand] = useState<Point[]>([]);
  const [textPromptPos, setTextPromptPos] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState('');
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  /* Load image */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // constrain to container width
      const maxW = containerRef.current?.clientWidth ?? 800;
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      setCanvasSize({ w, h });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  /* Render all shapes whenever canvas size / shapes change */
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
    shapes.forEach((s) => drawShape(ctx, s));
  }, [shapes, canvasSize]);

  /* Set overlay canvas size */
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.width = canvasSize.w;
    overlay.height = canvasSize.h;
  }, [canvasSize]);

  /* ── Pointer helpers ── */
  const getPos = useCallback((e: React.PointerEvent): Point => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const p = getPos(e);
    if (tool === 'text') {
      setTextPromptPos(p);
      setTextInput('');
      return;
    }
    setDrawing(true);
    setStartPt(p);
    if (tool === 'freehand') setCurrentFreehand([p]);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [tool, getPos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing || !startPt) return;
    const p = getPos(e);
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'freehand') {
      setCurrentFreehand((prev) => [...prev, p]);
      ctx.beginPath();
      const pts = [...currentFreehand, p];
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    } else if (tool === 'circle') {
      const cx = (startPt.x + p.x) / 2;
      const cy = (startPt.y + p.y) / 2;
      const rx = Math.abs(p.x - startPt.x) / 2;
      const ry = Math.abs(p.y - startPt.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(startPt.x, startPt.y, p.x - startPt.x, p.y - startPt.y);
    } else if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (tool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      const angle = Math.atan2(p.y - startPt.y, p.x - startPt.x);
      const hl = 14;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - hl * Math.cos(angle - Math.PI / 6), p.y - hl * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - hl * Math.cos(angle + Math.PI / 6), p.y - hl * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  }, [drawing, startPt, tool, color, lineWidth, canvasSize, currentFreehand, getPos]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!drawing || !startPt) return;
    setDrawing(false);
    const p = getPos(e);
    const overlay = overlayRef.current;
    if (overlay) overlay.getContext('2d')!.clearRect(0, 0, canvasSize.w, canvasSize.h);

    const base: ShapeBase = { id: uid(), tool, color, lineWidth };
    let shape: Shape | null = null;

    if (tool === 'freehand') {
      const pts = [...currentFreehand, p];
      if (pts.length > 1) shape = { ...base, tool: 'freehand', points: pts } as FreehandShape;
      setCurrentFreehand([]);
    } else if (tool === 'circle') {
      const cx = (startPt.x + p.x) / 2;
      const cy = (startPt.y + p.y) / 2;
      shape = { ...base, tool: 'circle', cx, cy, rx: Math.abs(p.x - startPt.x) / 2, ry: Math.abs(p.y - startPt.y) / 2 } as CircleShape;
    } else if (tool === 'rect') {
      shape = { ...base, tool: 'rect', x: startPt.x, y: startPt.y, w: p.x - startPt.x, h: p.y - startPt.y } as RectShape;
    } else if (tool === 'line') {
      shape = { ...base, tool: 'line', x1: startPt.x, y1: startPt.y, x2: p.x, y2: p.y } as LineShape;
    } else if (tool === 'arrow') {
      shape = { ...base, tool: 'arrow', x1: startPt.x, y1: startPt.y, x2: p.x, y2: p.y } as ArrowShape;
    }

    if (shape) setShapes((prev) => [...prev, shape!]);
    setStartPt(null);
  }, [drawing, startPt, tool, color, lineWidth, canvasSize, currentFreehand, getPos]);

  /* Text submit */
  const submitText = useCallback(() => {
    if (!textPromptPos || !textInput.trim()) { setTextPromptPos(null); return; }
    const shape: TextShape = {
      id: uid(), tool: 'text', color, lineWidth, x: textPromptPos.x, y: textPromptPos.y, text: textInput.trim(), fontSize: 16,
    };
    setShapes((prev) => [...prev, shape]);
    setTextPromptPos(null);
    setTextInput('');
  }, [textPromptPos, textInput, color, lineWidth]);

  /* Undo */
  const undo = useCallback(() => setShapes((prev) => prev.slice(0, -1)), []);

  /* Clear all */
  const clearAll = useCallback(() => setShapes([]), []);

  /* Save: flatten canvas to data URL */
  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, shapes);
  }, [shapes, onSave]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative flex flex-col max-w-[95vw] max-h-[95vh] rounded-xl bg-obsidian-900 border border-obsidian-600/30 shadow-2xl overflow-hidden">

        {/* ── Top toolbar ── */}
        <div className="flex items-center gap-1 px-3 py-2 bg-obsidian-800/80 border-b border-obsidian-600/20 flex-wrap">
          {/* Tools */}
          {TOOLS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTool(t.key)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors
                ${tool === t.key
                  ? 'bg-[rgba(13,140,99,0.2)] border border-[rgba(13,140,99,0.5)] text-[#10b37d]'
                  : 'border border-transparent text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/40'}`}
              title={t.label}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {t.icon}
              </svg>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}

          {/* Separator */}
          <div className="w-px h-6 bg-obsidian-600/30 mx-1" />

          {/* Colors */}
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition-transform
                ${color === c ? 'border-white scale-110' : 'border-obsidian-600/40 hover:scale-105'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}

          {/* Separator */}
          <div className="w-px h-6 bg-obsidian-600/30 mx-1" />

          {/* Line width */}
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="h-7 rounded bg-obsidian-800 border border-obsidian-600/30 text-xs text-obsidian-300 px-1
              focus:outline-none focus:ring-1 focus:ring-[#0d8c63]/40"
          >
            <option value={2}>Thin</option>
            <option value={3}>Normal</option>
            <option value={5}>Thick</option>
            <option value={8}>Bold</option>
          </select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Undo / Clear */}
          <button type="button" onClick={undo} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px]
            font-medium text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/40 transition-colors"
            title="Undo last"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button type="button" onClick={clearAll} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px]
            font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="Clear all annotations"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        {/* ── Canvas area ── */}
        <div ref={containerRef} className="relative overflow-auto flex-1" style={{ maxHeight: 'calc(95vh - 120px)' }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="block"
          />
          {/* Overlay for live drawing */}
          <canvas
            ref={overlayRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="absolute top-0 left-0 block"
            style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />

          {/* Text input floating box */}
          {textPromptPos && (
            <div
              className="absolute z-10"
              style={{ left: textPromptPos.x, top: textPromptPos.y + 4 }}
            >
              <div className="flex items-center gap-1 rounded-lg bg-obsidian-800 border border-obsidian-600/40
                shadow-lg px-2 py-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitText(); if (e.key === 'Escape') setTextPromptPos(null); }}
                  autoFocus
                  placeholder="Type text..."
                  className="bg-transparent text-sm text-obsidian-100 outline-none w-40
                    placeholder:text-obsidian-500"
                />
                <button type="button" onClick={submitText}
                  className="text-[10px] font-semibold text-[#10b37d] hover:text-emerald-400 px-1">
                  Add
                </button>
                <button type="button" onClick={() => setTextPromptPos(null)}
                  className="text-[10px] font-semibold text-obsidian-500 hover:text-obsidian-300 px-1">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-obsidian-800/80 border-t border-obsidian-600/20">
          <span className="text-[11px] text-obsidian-500">
            {shapes.length} annotation{shapes.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel}
              className="px-4 py-1.5 rounded-lg border border-obsidian-600/30 text-xs font-medium
                text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/40 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={save}
              className="px-4 py-1.5 rounded-lg bg-[#0d8c63] text-xs font-semibold text-white
                hover:bg-[#087a56] transition-colors">
              Save Annotations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
