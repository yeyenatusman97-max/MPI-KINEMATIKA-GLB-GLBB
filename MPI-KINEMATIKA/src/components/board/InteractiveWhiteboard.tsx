import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Eraser, 
  Highlighter, 
  ArrowRight, 
  Minus, 
  Square, 
  Circle, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Download, 
  Maximize, 
  Minimize, 
  Sparkles, 
  Compass, 
  FileText,
  Check,
  Users,
  BarChart3,
  CheckCircle2,
  Columns,
  Layers,
  GripHorizontal,
  X,
  Move
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'arrow' | 'line' | 'rect' | 'circle';
export type BoardTheme = 'whiteboard' | 'greenboard' | 'blackboard' | 'grid' | 'lined';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  tool: ToolType;
  color: string;
  size: number;
  points: Point[];
  owner?: 'single' | 'penA' | 'penB';
}

export interface WhiteboardGraphPayload {
  type: string;
  mode: 'GLB' | 'GLBB';
  subType?: 'dipercepat' | 'diperlambat';
  v0: number;
  a: number;
  simTime: number;
  finalPos?: number;
  finalVel?: number;
  points?: any[];
  title?: string;
}

// Draggable Graph Item on Whiteboard Surface
export interface BoardGraphItem {
  id: string;
  type: string;
  mode: 'GLB' | 'GLBB';
  subType?: 'dipercepat' | 'diperlambat';
  v0: number;
  a: number;
  simTime: number;
  finalPos?: number;
  finalVel?: number;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  zIndex: number;
}

// Draggable Formula Item on Whiteboard Surface
export interface BoardFormulaItem {
  id: string;
  title: string;
  latexFormula: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  zIndex: number;
}

interface InteractiveWhiteboardProps {
  initialPayload?: WhiteboardGraphPayload | null;
  onClearPayload?: () => void;
}

export const InteractiveWhiteboard: React.FC<InteractiveWhiteboardProps> = ({
  initialPayload,
  onClearPayload
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tools state (Global / Single User)
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#0f172a');
  const [currentSize, setCurrentSize] = useState<number>(4);
  const [theme, setTheme] = useState<BoardTheme>('whiteboard');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [stylusDetected, setStylusDetected] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [showGraphModal, setShowGraphModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // =========================================================================
  // DUAL PEN / MULTI-TOUCH PID STATE (Mode 2 Murid Bersamaan)
  // =========================================================================
  const [isDualPenMode, setIsDualPenMode] = useState<boolean>(false);
  
  // Pen 1 (Murid 1 / Sisi Kiri Layar PID)
  const [user1Color, setUser1Color] = useState<string>('#2563eb'); // Biru PID
  const [user1Tool, setUser1Tool] = useState<ToolType>('pen');
  const [user1Size, setUser1Size] = useState<number>(4);

  // Pen 2 (Murid 2 / Sisi Kanan Layar PID)
  const [user2Color, setUser2Color] = useState<string>('#dc2626'); // Merah PID
  const [user2Tool, setUser2Tool] = useState<ToolType>('pen');
  const [user2Size, setUser2Size] = useState<number>(4);

  // History stack for lossless Undo/Redo
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const redoStackRef = useRef<Stroke[]>([]);
  const toastTimerRef = useRef<number | null>(null);

  // =========================================================================
  // MULTIPLE MOVABLE & DRAGGABLE CARDS (GRAFIK & RUMUS KINEMATIKA BEBAS GESER)
  // =========================================================================
  const [boardGraphs, setBoardGraphs] = useState<BoardGraphItem[]>([]);
  const [boardFormulas, setBoardFormulas] = useState<BoardFormulaItem[]>([]);
  const [nextZIndex, setNextZIndex] = useState<number>(10);
  const [dragState, setDragState] = useState<{
    type: 'graph' | 'formula';
    id: string;
    startX: number;
    startY: number;
    itemStartX: number;
    itemStartY: number;
  } | null>(null);

  // MULTI-POINTER TRACKING MAP (Real simultaneous multi-touch / dual stylus!)
  const activePointersRef = useRef<Map<number, Stroke>>(new Map());

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Available colors
  const whiteboardColors = [
    { label: 'Hitam', value: '#0f172a' },
    { label: 'Biru PID', value: '#2563eb' },
    { label: 'Merah', value: '#dc2626' },
    { label: 'Hijau', value: '#16a34a' },
    { label: 'Kuning Stabilo', value: '#eab308' },
    { label: 'Ungu', value: '#9333ea' },
    { label: 'Oranye', value: '#ea580c' },
    { label: 'Putih', value: '#ffffff' },
  ];

  const chalkColors = [
    { label: 'Putih Kapur', value: '#ffffff' },
    { label: 'Kuning Kapur', value: '#fef08a' },
    { label: 'Biru Muda', value: '#67e8f9' },
    { label: 'Hijau Muda', value: '#86efac' },
    { label: 'Merah Muda', value: '#fca5a5' },
    { label: 'Oranye Kapur', value: '#fdba74' },
    { label: 'Ungu Pastel', value: '#d8b4fe' },
    { label: 'Abu-abu', value: '#94a3b8' },
  ];

  const activeColorPalette = (theme === 'greenboard' || theme === 'blackboard') ? chalkColors : whiteboardColors;

  // Set default color based on theme
  useEffect(() => {
    if (theme === 'greenboard' || theme === 'blackboard') {
      setCurrentColor('#ffffff');
      setUser1Color('#fef08a');
      setUser2Color('#67e8f9');
    } else {
      setCurrentColor('#0f172a');
      setUser1Color('#2563eb');
      setUser2Color('#dc2626');
    }
  }, [theme]);

  // Redraw background canvas (Grid, greenboard texture, lines, and Dual-Pen divider)
  const drawBackground = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    const w = bgCanvas.width;
    const h = bgCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (theme === 'whiteboard') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    } else if (theme === 'greenboard') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#14532d');
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle chalk dust
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let i = 0; i < 400; i++) {
        const rx = (i * 137.5) % w;
        const ry = (i * 269.3) % h;
        ctx.fillRect(rx, ry, 2, 2);
      }
    } else if (theme === 'blackboard') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
    } else if (theme === 'grid') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      const gridSize = 28;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Major grid
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x += gridSize * 4) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize * 4) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    } else if (theme === 'lined') {
      ctx.fillStyle = '#fffdf7';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, h);
      ctx.stroke();

      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 48; y < h; y += 32) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    }

    // DUAL PEN DIVIDER LINE (If Dual User Mode is active)
    if (isDualPenMode) {
      const midX = w / 2;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Header Badges for Murid 1 & Murid 2
      ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
      ctx.fillRect(10, 8, midX - 20, 28);
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText('MURID 1 (PEN A - SISI KIRI)', 24, 26);

      ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
      ctx.fillRect(midX + 10, 8, midX - 20, 28);
      ctx.fillStyle = '#dc2626';
      ctx.fillText('MURID 2 (PEN B - SISI KANAN)', midX + 24, 26);
      ctx.restore();
    }
  }, [theme, isDualPenMode]);

  // Redraw all strokes on main canvas
  const renderAllStrokes = useCallback((strokeList: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokeList.forEach((st) => {
      if (st.points.length === 0) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (st.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = st.size * 3.5;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else if (st.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = st.size * 3.5;
        ctx.strokeStyle = st.color;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = st.size;
        ctx.strokeStyle = st.color;
      }

      if (st.tool === 'pen' || st.tool === 'highlighter' || st.tool === 'eraser') {
        if (st.points.length === 1) {
          ctx.fillStyle = st.tool === 'eraser' ? 'rgba(0,0,0,1)' : st.color;
          const radius =
            st.tool === 'eraser'
              ? st.size * 1.5
              : st.tool === 'highlighter'
              ? st.size * 1.75
              : Math.max(1.5, st.size / 2);
          ctx.beginPath();
          ctx.arc(st.points[0].x, st.points[0].y, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(st.points[0].x, st.points[0].y);
          for (let i = 1; i < st.points.length - 1; i++) {
            const midX = (st.points[i].x + st.points[i + 1].x) / 2;
            const midY = (st.points[i].y + st.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(st.points[i].x, st.points[i].y, midX, midY);
          }
          const last = st.points[st.points.length - 1];
          ctx.lineTo(last.x, last.y);
          ctx.stroke();
        }
      } else if (st.tool === 'arrow') {
        const p1 = st.points[0];
        const p2 = st.points[st.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const headLen = Math.max(14, st.size * 3);
        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (st.tool === 'line') {
        const p1 = st.points[0];
        const p2 = st.points[st.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else if (st.tool === 'rect') {
        const p1 = st.points[0];
        const p2 = st.points[st.points.length - 1];
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (st.tool === 'circle') {
        const p1 = st.points[0];
        const p2 = st.points[st.points.length - 1];
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;
        const cx = Math.min(p1.x, p2.x) + rx;
        const cy = Math.min(p1.y, p2.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, []);

  // Sync canvas size with screen/wrapper dimensions (without tearing down ResizeObserver on every stroke)
  const resizeCanvases = useCallback(() => {
    const wrapper = canvasWrapperRef.current;
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!wrapper || !canvas || !bgCanvas) return;

    const rect = wrapper.getBoundingClientRect();
    const width = Math.max(280, Math.floor(rect.width));
    const height = Math.max(220, Math.floor(rect.height || 360));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      bgCanvas.width = width;
      bgCanvas.height = height;

      drawBackground();
      renderAllStrokes(strokesRef.current);
    }
  }, [drawBackground, renderAllStrokes]);

  useEffect(() => {
    resizeCanvases();
    const rafId = window.requestAnimationFrame(() => resizeCanvases());
    const timerId = window.setTimeout(() => resizeCanvases(), 220);

    const wrapper = canvasWrapperRef.current;
    let ro: ResizeObserver | null = null;
    if (wrapper && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        resizeCanvases();
      });
      ro.observe(wrapper);
    }
    window.addEventListener('resize', resizeCanvases);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resizeCanvases);
    };
  }, [resizeCanvases, isFullscreen, isDualPenMode]);

  useEffect(() => {
    drawBackground();
  }, [theme, isDualPenMode, drawBackground]);

  // Keep fullscreen state synced with browser Fullscreen API & Escape key
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen((prev) => (prev ? false : prev));
      } else {
        setIsFullscreen(true);
      }
      window.requestAnimationFrame(() => resizeCanvases());
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [resizeCanvases]);

  // Pointer Event handlers with 100% accurate scaling for PID (Smart Board / Interactive Flat Panel)
  const getCanvasCoordinates = (e: { clientX: number; clientY: number; pressure?: number }): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Critical PID fix: compensate for any CSS scaling vs internal bitmap dimensions
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5
    };
  };

  // =========================================================================
  // MULTI-TOUCH / DUAL POINTER DOWN (Supports 2 Stylus Pens Simultaneously)
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ignore mouse right-click / non-primary mouse buttons (except stylus eraser button 5)
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (e.pointerType === 'pen') {
      setStylusDetected(true);
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    const pt = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const midX = canvas ? canvas.width / 2 : 400;

    let activeTool = currentTool;
    let activeColor = currentColor;
    let activeSize = currentSize;

    // Check if Dual Pen Mode is active:
    if (isDualPenMode) {
      if (pt.x < midX) {
        // User 1 (Left Side)
        activeTool = user1Tool;
        activeColor = user1Color;
        activeSize = user1Size;
      } else {
        // User 2 (Right Side)
        activeTool = user2Tool;
        activeColor = user2Color;
        activeSize = user2Size;
      }
    }

    // Auto-detect stylus eraser tip / secondary button
    if (e.pointerType === 'pen' && (e.buttons === 32 || e.button === 5)) {
      activeTool = 'eraser';
    }

    const strokeOwner: 'single' | 'penA' | 'penB' = isDualPenMode
      ? (pt.x < midX ? 'penA' : 'penB')
      : 'single';

    const newStroke: Stroke = {
      tool: activeTool,
      color: activeColor,
      size: activeSize,
      points: [pt],
      owner: strokeOwner,
    };

    activePointersRef.current.set(e.pointerId, newStroke);

    // Render initial point immediately for zero latency feedback
    if (canvas && (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser')) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (activeTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0,0,0,1)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, activeSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = activeColor;
          ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1;
          const radius = activeTool === 'highlighter' ? activeSize * 1.75 : Math.max(1.5, activeSize / 2);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = activePointersRef.current.get(e.pointerId);
    if (!stroke) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nativeEvt = e.nativeEvent as PointerEvent;
    const coalesced =
      typeof nativeEvt.getCoalescedEvents === 'function'
        ? nativeEvt.getCoalescedEvents()
        : [];
    // Fallback to [e] whenever getCoalescedEvents() returns empty array (common on mouse/touchpad/iframe)
    const rawEvents: Array<{ clientX: number; clientY: number; pressure?: number }> =
      coalesced && coalesced.length > 0 ? coalesced : [e];

    if (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'eraser') {
      rawEvents.forEach((ce) => {
        const pt = getCanvasCoordinates(ce);
        stroke.points.push(pt);

        const pts = stroke.points;
        const len = pts.length;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = stroke.size * 3.5;
          ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else if (stroke.tool === 'highlighter') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = stroke.size * 3.5;
          ctx.strokeStyle = stroke.color;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          const pres = pt.pressure || 0.5;
          ctx.lineWidth = Math.max(1, stroke.size * (0.6 + pres * 0.8));
          ctx.strokeStyle = stroke.color;
        }

        if (len === 2) {
          const p0 = pts[0];
          const p1 = pts[1];
          const midX = (p0.x + p1.x) / 2;
          const midY = (p0.y + p1.y) / 2;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(midX, midY);
          ctx.stroke();
        } else if (len >= 3) {
          const p0 = pts[len - 3];
          const p1 = pts[len - 2];
          const p2 = pts[len - 1];
          const prevMidX = (p0.x + p1.x) / 2;
          const prevMidY = (p0.y + p1.y) / 2;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.beginPath();
          ctx.moveTo(prevMidX, prevMidY);
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.stroke();
        }

        ctx.restore();
      });
    } else {
      // Geometric live preview (use latest point for crisp preview without redundant redraws)
      const latestEvt = rawEvents[rawEvents.length - 1];
      const pt = getCanvasCoordinates(latestEvt);
      stroke.points.push(pt);

      renderAllStrokes(strokesRef.current);
      const p1 = stroke.points[0];
      const p2 = pt;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const headLen = Math.max(14, stroke.size * 3);
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (stroke.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else if (stroke.tool === 'rect') {
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (stroke.tool === 'circle') {
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;
        const cx = Math.min(p1.x, p2.x) + rx;
        const cy = Math.min(p1.y, p2.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const finalizePointerStroke = useCallback((pointerId: number) => {
    const stroke = activePointersRef.current.get(pointerId);
    if (!stroke) return;
    activePointersRef.current.delete(pointerId);

    if (stroke.points.length > 0) {
      const updated = [...strokesRef.current, stroke];
      strokesRef.current = updated;
      redoStackRef.current = [];
      setStrokes(updated);
      setRedoStack([]);
      renderAllStrokes(updated);
    }
  }, [renderAllStrokes]);

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
    finalizePointerStroke(e.pointerId);
  };

  // Global fallback so strokes & drags never hang if pointer leaves iframe/canvas
  useEffect(() => {
    const handleWindowPointerEnd = (e: PointerEvent) => {
      if (activePointersRef.current.has(e.pointerId)) {
        finalizePointerStroke(e.pointerId);
      }
    };
    window.addEventListener('pointerup', handleWindowPointerEnd);
    window.addEventListener('pointercancel', handleWindowPointerEnd);
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerEnd);
      window.removeEventListener('pointercancel', handleWindowPointerEnd);
    };
  }, [finalizePointerStroke]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    sounds.playClick();
    const current = strokesRef.current;
    if (current.length === 0) return;
    const last = current[current.length - 1];
    const updated = current.slice(0, -1);
    const nextRedo = [...redoStackRef.current, last];
    strokesRef.current = updated;
    redoStackRef.current = nextRedo;
    setStrokes(updated);
    setRedoStack(nextRedo);
    renderAllStrokes(updated);
  }, [renderAllStrokes]);

  const handleRedo = useCallback(() => {
    sounds.playClick();
    const currentRedo = redoStackRef.current;
    if (currentRedo.length === 0) return;
    const next = currentRedo[currentRedo.length - 1];
    const updatedRedo = currentRedo.slice(0, -1);
    const updatedStrokes = [...strokesRef.current, next];
    strokesRef.current = updatedStrokes;
    redoStackRef.current = updatedRedo;
    setRedoStack(updatedRedo);
    setStrokes(updatedStrokes);
    renderAllStrokes(updatedStrokes);
  }, [renderAllStrokes]);

  // Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo), Esc (Exit CSS Fullscreen)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo, isFullscreen]);

  const handleClearAll = () => {
    sounds.playClick();
    strokesRef.current = [];
    redoStackRef.current = [];
    setStrokes([]);
    setRedoStack([]);
    setBoardGraphs([]);
    setBoardFormulas([]);
    activePointersRef.current.clear();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setShowClearConfirm(false);
    showToast('Papan tulis dan seluruh kartu telah dibersihkan');
  };

  // Undo & Clear khusus per sisi Pen A / Pen B pada Mode 2 Pen
  const handleUndoPen = useCallback((targetOwner: 'penA' | 'penB') => {
    sounds.playClick();
    const current = strokesRef.current;
    const canvas = canvasRef.current;
    const midX = canvas ? canvas.width / 2 : 400;

    let targetIdx = -1;
    for (let i = current.length - 1; i >= 0; i--) {
      const st = current[i];
      const inferredOwner =
        st.owner === 'penA' || st.owner === 'penB'
          ? st.owner
          : st.points[0] && st.points[0].x < midX
            ? 'penA'
            : 'penB';
      if (inferredOwner === targetOwner) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === -1) return;

    const removed = current[targetIdx];
    const updated = [...current.slice(0, targetIdx), ...current.slice(targetIdx + 1)];
    const nextRedo = [...redoStackRef.current, removed];
    strokesRef.current = updated;
    redoStackRef.current = nextRedo;
    setStrokes(updated);
    setRedoStack(nextRedo);
    renderAllStrokes(updated);
  }, [renderAllStrokes]);

  const handleClearPenSide = useCallback((targetOwner: 'penA' | 'penB') => {
    sounds.playClick();
    const canvas = canvasRef.current;
    const midX = canvas ? canvas.width / 2 : 400;
    const updated = strokesRef.current.filter((st) => {
      const inferredOwner =
        st.owner === 'penA' || st.owner === 'penB'
          ? st.owner
          : st.points[0] && st.points[0].x < midX
            ? 'penA'
            : 'penB';
      return inferredOwner !== targetOwner;
    });
    strokesRef.current = updated;
    setStrokes(updated);
    renderAllStrokes(updated);
    showToast(
      targetOwner === 'penA'
        ? 'Area coretan Pen A (Sisi Kiri) dibersihkan'
        : 'Area coretan Pen B (Sisi Kanan) dibersihkan'
    );
  }, [renderAllStrokes, showToast]);

  // =========================================================================
  // PENEMPATAN GRAFIK & RUMUS BEBAS TUMPANG TINDIH DI BAGIAN ATAS PAPAN TULIS
  // =========================================================================
  const findAvailableSlot = useCallback((itemW: number, itemH: number) => {
    const wrapper = canvasWrapperRef.current;
    const maxW = wrapper?.clientWidth || 1100;
    const maxH = wrapper?.clientHeight || 650;

    const existingBounds = [
      ...boardGraphs.map((g) => ({ x: g.x, y: g.y, w: g.width, h: g.isMinimized ? 44 : g.height })),
      ...boardFormulas.map((f) => ({ x: f.x, y: f.y, w: f.width, h: f.isMinimized ? 44 : f.height }))
    ];

    // Slot kandidat diatur rapi dari kiri ke kanan di bagian ATAS papan tulis
    const candidateSlots = [
      // Baris Atas (Prioritas Utama agar bagian bawah tetap terbuka untuk catatan)
      { x: 30, y: 20 },
      { x: 430, y: 20 },
      { x: 830, y: 20 },
      // Baris Kedua (bila baris atas sudah terisi)
      { x: 30, y: 265 },
      { x: 430, y: 265 },
      { x: 830, y: 265 },
      // Baris Ketiga
      { x: 230, y: 140 },
      { x: 630, y: 140 }
    ];

    for (const slot of candidateSlots) {
      if (slot.x + itemW > maxW - 20) continue;
      if (slot.y + itemH > maxH - 20) continue;

      const collides = existingBounds.some((b) => {
        return (
          slot.x < b.x + b.w &&
          slot.x + itemW > b.x &&
          slot.y < b.y + b.h &&
          slot.y + itemH > b.y
        );
      });

      if (!collides) {
        return slot;
      }
    }

    // Fallback bila semua slot penuh: offset bertingkat rapi
    const total = existingBounds.length;
    return {
      x: Math.min(Math.max(20, maxW - itemW - 30), 30 + (total % 6) * 40),
      y: Math.min(Math.max(20, maxH - itemH - 30), 20 + (total % 4) * 40)
    };
  }, [boardGraphs, boardFormulas]);

  // Bring item to front (tingkatkan z-index)
  const bringToFront = (type: 'graph' | 'formula', id: string) => {
    setNextZIndex((prevZ) => {
      const newZ = prevZ + 1;
      if (type === 'graph') {
        setBoardGraphs((items) => items.map((g) => (g.id === id ? { ...g, zIndex: newZ } : g)));
      } else {
        setBoardFormulas((items) => items.map((f) => (f.id === id ? { ...f, zIndex: newZ } : f)));
      }
      return newZ;
    });
  };

  // Dragging Handlers
  const handleStartDrag = (e: React.PointerEvent, type: 'graph' | 'formula', id: string, curX: number, curY: number) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
    setDragState({
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      itemStartX: curX,
      itemStartY: curY
    });
    bringToFront(type, id);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (!dragState) return;
    e.stopPropagation();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
    const wrapperW = wrapperRect?.width || 1200;
    const wrapperH = wrapperRect?.height || 700;

    const newX = Math.max(10, Math.min(wrapperW - 100, dragState.itemStartX + deltaX));
    const newY = Math.max(10, Math.min(wrapperH - 45, dragState.itemStartY + deltaY));

    if (dragState.type === 'graph') {
      setBoardGraphs((items) => items.map((g) => (g.id === dragState.id ? { ...g, x: newX, y: newY } : g)));
    } else {
      setBoardFormulas((items) => items.map((f) => (f.id === dragState.id ? { ...f, x: newX, y: newY } : f)));
    }
  };

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    if (dragState) {
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      setDragState(null);
    }
  };

  const removeGraph = (id: string) => {
    sounds.playClick();
    setBoardGraphs((items) => items.filter((g) => g.id !== id));
  };

  const toggleMinimizeGraph = (id: string) => {
    sounds.playClick();
    setBoardGraphs((items) => items.map((g) => (g.id === id ? { ...g, isMinimized: !g.isMinimized } : g)));
  };

  const removeFormula = (id: string) => {
    sounds.playClick();
    setBoardFormulas((items) => items.filter((f) => f.id !== id));
  };

  const toggleMinimizeFormula = (id: string) => {
    sounds.playClick();
    setBoardFormulas((items) => items.map((f) => (f.id === id ? { ...f, isMinimized: !gMin(f) } : f)));
  };

  // Helper minimize
  const gMin = (f: BoardFormulaItem) => f.isMinimized;

  // Stempel Grafik Kinematika (Bisa Lebih Dari Satu, Tanpa Tumpang Tindih)
  const stampKinematicsGraph = useCallback((payload: WhiteboardGraphPayload) => {
    sounds.playSuccess();
    const itemW = 380;
    const itemH = 225;
    const pos = findAvailableSlot(itemW, itemH);

    setNextZIndex((prevZ) => {
      const newZ = prevZ + 1;
      const newGraph: BoardGraphItem = {
        id: `graph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: payload.type || 'graph',
        mode: payload.mode,
        subType: payload.subType,
        v0: payload.v0,
        a: payload.a,
        simTime: payload.simTime,
        finalPos: payload.finalPos,
        finalVel: payload.finalVel,
        title: payload.title || `Grafik v-t: ${payload.mode} ${payload.subType ? `(${payload.subType.toUpperCase()})` : ''}`,
        x: pos.x,
        y: pos.y,
        width: itemW,
        height: itemH,
        isMinimized: false,
        zIndex: newZ,
      };
      setBoardGraphs((prev) => [...prev, newGraph]);
      return newZ;
    });

    showToast('Grafik Kinematika Berhasil Ditempatkan di Bagian Atas Papan Tulis (Dapat Digeser Bebas)!');
  }, [findAvailableSlot]);

  // Handle incoming graph payload from other menus
  useEffect(() => {
    if (initialPayload) {
      stampKinematicsGraph(initialPayload);
      onClearPayload?.();
    }
  }, [initialPayload, stampKinematicsGraph, onClearPayload]);

  // Quick Formula Stamp (Bisa Lebih Dari Satu, Tanpa Tumpang Tindih)
  const stampFormula = (latexFormula: string, title: string, description?: string) => {
    sounds.playSuccess();
    const itemW = 340;
    const itemH = 110;
    const pos = findAvailableSlot(itemW, itemH);

    setNextZIndex((prevZ) => {
      const newZ = prevZ + 1;
      const newFormula: BoardFormulaItem = {
        id: `formula-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        latexFormula,
        description,
        x: pos.x,
        y: pos.y,
        width: itemW,
        height: itemH,
        isMinimized: false,
        zIndex: newZ,
      };
      setBoardFormulas((prev) => [...prev, newFormula]);
      return newZ;
    });

    setShowFormulaModal(false);
    showToast('Rumus Berhasil Ditempatkan di Papan Tulis (Dapat Digeser Bebas)!');
  };

  // Preset Graph Quick Stamp from Modal
  const stampPresetGraph = (type: 'glb-vt' | 'glbb-accel-vt' | 'glbb-decel-vt' | 'glbb-st') => {
    if (type === 'glb-vt') {
      stampKinematicsGraph({
        type: 'preset',
        mode: 'GLB',
        v0: 8,
        a: 0,
        simTime: 6,
        finalPos: 48,
        finalVel: 8,
        title: 'Grafik v-t: GLB (Kecepatan Konstan 8 m/s)'
      });
    } else if (type === 'glbb-accel-vt') {
      stampKinematicsGraph({
        type: 'preset',
        mode: 'GLBB',
        subType: 'dipercepat',
        v0: 4,
        a: 2,
        simTime: 5,
        finalPos: 45,
        finalVel: 14,
        title: 'Grafik v-t: GLBB Dipercepat (v₀=4 m/s, a=2 m/s²)'
      });
    } else if (type === 'glbb-decel-vt') {
      stampKinematicsGraph({
        type: 'preset',
        mode: 'GLBB',
        subType: 'diperlambat',
        v0: 16,
        a: -4,
        simTime: 4,
        finalPos: 32,
        finalVel: 0,
        title: 'Grafik v-t: GLBB Diperlambat (Pengereman Mobil)'
      });
    } else {
      stampKinematicsGraph({
        type: 'preset',
        mode: 'GLBB',
        subType: 'dipercepat',
        v0: 0,
        a: 3,
        simTime: 5,
        finalPos: 37.5,
        finalVel: 15,
        title: 'Grafik s-t: GLBB Parabola (Akselerasi Posisi)'
      });
    }
    setShowGraphModal(false);
  };

  // Download whiteboard image (Mencakup Goresan Kanvas + Seluruh Grafik & Rumus yang Aktif)
  const handleDownloadImage = () => {
    sounds.playSuccess();
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return;

    expCtx.drawImage(bgCanvas, 0, 0);
    expCtx.drawImage(canvas, 0, 0);

    // Render active graph cards onto export canvas
    boardGraphs.forEach((graph) => {
      expCtx.save();
      const cardW = graph.width;
      const cardH = graph.isMinimized ? 44 : graph.height;
      expCtx.fillStyle = theme === 'greenboard' || theme === 'blackboard' ? '#0f172a' : '#ffffff';
      expCtx.strokeStyle = graph.mode === 'GLB' ? '#0284c7' : (graph.subType === 'diperlambat' ? '#dc2626' : '#16a34a');
      expCtx.lineWidth = 2;
      expCtx.beginPath();
      expCtx.roundRect(graph.x, graph.y, cardW, cardH, 12);
      expCtx.fill();
      expCtx.stroke();

      // Card Header
      expCtx.fillStyle = graph.mode === 'GLB' ? '#0284c7' : (graph.subType === 'diperlambat' ? '#dc2626' : '#16a34a');
      expCtx.font = 'bold 12px sans-serif';
      expCtx.fillText(graph.title || `Grafik ${graph.mode}`, graph.x + 14, graph.y + 24);

      if (!graph.isMinimized) {
        const originX = graph.x + 45;
        const originY = graph.y + 160;
        const endX = graph.x + cardW - 35;
        const topY = graph.y + 55;

        // Axes
        expCtx.strokeStyle = '#64748b';
        expCtx.lineWidth = 1.5;
        expCtx.beginPath();
        expCtx.moveTo(originX, originY);
        expCtx.lineTo(endX, originY);
        expCtx.moveTo(originX, originY);
        expCtx.lineTo(originX, topY);
        expCtx.stroke();

        // Line curve
        expCtx.strokeStyle = graph.mode === 'GLB' ? '#0284c7' : (graph.subType === 'diperlambat' ? '#dc2626' : '#16a34a');
        expCtx.lineWidth = 3;
        expCtx.beginPath();
        if (graph.mode === 'GLB') {
          const ly = originY - 60;
          expCtx.moveTo(originX, ly);
          expCtx.lineTo(endX - 20, ly);
        } else if (graph.subType === 'diperlambat') {
          expCtx.moveTo(originX, topY + 20);
          expCtx.lineTo(endX - 20, originY);
        } else {
          expCtx.moveTo(originX, originY - 20);
          expCtx.lineTo(endX - 20, topY + 20);
        }
        expCtx.stroke();

        // Stats text
        expCtx.fillStyle = theme === 'greenboard' || theme === 'blackboard' ? '#f8fafc' : '#0f172a';
        expCtx.font = 'bold 10px monospace';
        expCtx.fillText(`v₀ = ${graph.v0}m/s | a = ${graph.a}m/s² | t = ${graph.simTime}s | s = ${graph.finalPos?.toFixed(1) || ''}m`, graph.x + 14, graph.y + 200);
      }
      expCtx.restore();
    });

    // Render active formula cards onto export canvas
    boardFormulas.forEach((formula) => {
      expCtx.save();
      const cardW = formula.width;
      const cardH = formula.isMinimized ? 44 : formula.height;
      expCtx.fillStyle = theme === 'greenboard' || theme === 'blackboard' ? '#0f172a' : '#f8fafc';
      expCtx.strokeStyle = '#38bdf8';
      expCtx.lineWidth = 2;
      expCtx.beginPath();
      expCtx.roundRect(formula.x, formula.y, cardW, cardH, 12);
      expCtx.fill();
      expCtx.stroke();

      expCtx.fillStyle = '#0284c7';
      expCtx.font = 'bold 11px sans-serif';
      expCtx.fillText(formula.title, formula.x + 14, formula.y + 22);

      if (!formula.isMinimized) {
        expCtx.fillStyle = theme === 'greenboard' || theme === 'blackboard' ? '#ffffff' : '#0f172a';
        expCtx.font = 'bold 18px monospace';
        expCtx.fillText(formula.latexFormula, formula.x + 14, formula.y + 60);
      }
      expCtx.restore();
    });

    const link = document.createElement('a');
    link.download = `Catatan_Papan_Tulis_Kinematika_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // Fullscreen with clean iframe fallback
  const toggleFullscreen = () => {
    sounds.playClick();
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current
          .requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        document
          .exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(() => setIsFullscreen(false));
      } else {
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full flex flex-col bg-slate-900 select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 h-dvh w-screen' : 'flex-1 h-full min-h-0 rounded-2xl sm:rounded-3xl border-2 border-sky-300 shadow-[0_14px_34px_-12px_rgba(14,165,233,0.28)]'
      }`}
    >
      {/* ========================================================================= */}
      {/* TOP CONTROLS RIBBON (PID / Smart Board Toolbar)                           */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0B1F3F] via-[#123363] to-[#0B1F3F] text-white px-2.5 sm:px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 border-b border-sky-500/40 shrink-0 z-20">
        
        {/* Left: Single-Pen Tools (hidden when Mode 2 Pen separates tools per Pen A & Pen B) */}
        {!isDualPenMode ? (
          <>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              
              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentTool('pen');
                }}
                title="Spidol Tulis (Pen Stylus PID)"
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                  currentTool === 'pen'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 ring-2 ring-sky-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Spidol</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentTool('highlighter');
                }}
                title="Stabilo Transparan (Highlighter)"
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                  currentTool === 'highlighter'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Highlighter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Stabilo</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentTool('eraser');
                }}
                title="Penghapus Goresan (Eraser)"
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                  currentTool === 'eraser'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Eraser className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>

              <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

              {/* Panah Vektor */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentTool('arrow');
                }}
                title="Panah Vektor Kecepatan/Percepatan (Vector Arrow)"
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-black transition-all ${
                  currentTool === 'arrow'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Vektor</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentTool('line');
                }}
                title="Garis Lurus Lintasan (Line)"
                className={`p-1.5 rounded-xl text-xs font-black transition-all ${
                  currentTool === 'line'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentTool('rect');
                }}
                title="Balok Benda Uji (Rectangle)"
                className={`p-1.5 rounded-xl text-xs font-black transition-all ${
                  currentTool === 'rect'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Square className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentTool('circle');
                }}
                title="Lingkaran / Roda (Circle)"
                className={`p-1.5 rounded-xl text-xs font-black transition-all ${
                  currentTool === 'circle'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Circle className="h-3.5 w-3.5" />
              </button>

            </div>

            {/* Center: Single-Pen Color Palette */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {activeColorPalette.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentColor(c.value);
                    if (currentTool === 'eraser') setCurrentTool('pen');
                  }}
                  title={`Pilih Warna: ${c.label}`}
                  className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center shrink-0 ${
                    currentColor === c.value && currentTool !== 'eraser'
                      ? 'border-sky-400 scale-110 ring-2 ring-white/50'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {currentColor === c.value && currentTool !== 'eraser' && (
                    <Check className={`h-3 w-3 ${c.value === '#ffffff' || c.value === '#fef08a' ? 'text-slate-950' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-[11px] font-bold text-sky-200">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/70">
              <Columns className="h-3.5 w-3.5 text-sky-400" />
              <span>Mode 2 Pen Aktif · Tools Pen A &amp; Pen B Terpisah</span>
            </span>
          </div>
        )}

        {/* Right: Dual-Pen Toggle, Physics Tools, Themes, Undo/Redo */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          
          {/* ========================================================================= */}
          {/* TOMBOL FITUR DUA PEN / DUAL USER SPLIT SCREEN (PID SPECIAL)              */}
          {/* ========================================================================= */}
          <button
            onClick={() => {
              sounds.playStart();
              const next = !isDualPenMode;
              setIsDualPenMode(next);
              showToast(next ? 'Mode 2 Pen Aktif! Pen A & Pen B memiliki tools masing-masing.' : 'Mode 1 Layar Penuh Aktif.');
            }}
            title="Aktifkan Mode 2 Pen / Murid Menulis Bersamaan di Layar PID"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
              isDualPenMode
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 text-white shadow-md ring-2 ring-sky-300'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{isDualPenMode ? '2 Pen (Aktif)' : '2 Pen'}</span>
          </button>

          {/* Stroke Thickness (only in 1-Pen Mode; 2-Pen Mode uses per-pen size controls below) */}
          {!isDualPenMode && (
            <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              {[2, 4, 8, 14].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentSize(size);
                  }}
                  title={`Ukuran Mata Pena: ${size}px`}
                  className={`h-6 px-1.5 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center ${
                    currentSize === size
                      ? 'bg-sky-500 text-white font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => {
              sounds.playClick();
              setTheme(e.target.value as BoardTheme);
            }}
            title="Pilih Jenis Papan Tulis (Whiteboard, Papan Hijau, Grid)"
            aria-label="Pilih Jenis Papan Tulis"
            className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-2 py-1 text-[11px] font-bold outline-none focus:border-sky-500"
          >
            <option value="whiteboard">Papan Putih</option>
            <option value="greenboard">Papan Hijau</option>
            <option value="blackboard">Papan Hitam</option>
            <option value="grid">Kertas Grid</option>
            <option value="lined">Buku Bergaris</option>
          </select>

          {/* FITUR OPSI A: Quick Graph Stamping Modal */}
          <button
            onClick={() => setShowGraphModal(true)}
            title="Pilih & Tempel Grafik Kinematika Langsung ke Papan"
            className="px-2 py-1 rounded-xl bg-sky-950/70 hover:bg-sky-900 text-sky-300 text-[11px] font-bold border border-sky-700 transition flex items-center gap-1"
          >
            <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden xl:inline">Grafik</span>
          </button>

          {/* Quick Formula Stamp Button */}
          <button
            onClick={() => setShowFormulaModal(true)}
            title="Tempel Rumus Kinematika Cepat ke Papan"
            className="px-2 py-1 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 text-[11px] font-bold border border-indigo-700 transition flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Rumus</span>
          </button>

          {/* Global Undo / Redo (in 1-Pen Mode; 2-Pen Mode also has dedicated per-pen Undo) */}
          {!isDualPenMode && (
            <>
              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                title="Batal Goresan (Undo - Ctrl+Z)"
                className={`p-1.5 rounded-xl transition ${
                  strokes.length > 0
                    ? 'bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700'
                    : 'text-slate-600 bg-slate-900 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Ulangi Goresan (Redo - Ctrl+Y)"
                className={`p-1.5 rounded-xl transition ${
                  redoStack.length > 0
                    ? 'bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700'
                    : 'text-slate-600 bg-slate-900 cursor-not-allowed'
                }`}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Clear Board */}
          <button
            onClick={() => setShowClearConfirm(true)}
            title="Bersihkan Seluruh Papan Tulis (Clear)"
            className="p-1.5 rounded-xl bg-rose-950/50 text-rose-300 hover:bg-rose-900 hover:text-white border border-rose-800/60 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Download Image */}
          <button
            onClick={handleDownloadImage}
            title="Unduh / Simpan Catatan Papan Tulis (PNG)"
            className="p-1.5 rounded-xl bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900 hover:text-white border border-emerald-800/60 transition"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh PID / Smart Board"}
            className="p-1.5 rounded-xl bg-sky-950/50 text-sky-300 hover:bg-sky-900 hover:text-white border border-sky-800/60 transition"
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* DUAL PEN SEPARATED TOOLBOXES (PEN A & PEN B MASING-MASING TERPISAH)       */}
      {/* ========================================================================= */}
      {isDualPenMode && (
        <div className="bg-slate-950 border-b border-indigo-900/80 px-2 sm:px-3 py-1.5 grid grid-cols-1 lg:grid-cols-2 gap-1.5 shrink-0 z-20">
          
          {/* PEN A (MURID 1 - SISI KIRI) DEDICATED TOOLBOX */}
          <div className="rounded-xl bg-blue-950/35 border border-blue-700/50 px-2 py-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[10px] font-black tracking-tight shrink-0">
                PEN A (Kiri)
              </span>

              {[
                { id: 'pen' as ToolType, label: 'Spidol', icon: PenTool, activeCls: 'bg-blue-500 text-white ring-1 ring-blue-300' },
                { id: 'highlighter' as ToolType, label: 'Stabilo', icon: Highlighter, activeCls: 'bg-amber-500 text-slate-950 ring-1 ring-amber-300' },
                { id: 'eraser' as ToolType, label: 'Hapus', icon: Eraser, activeCls: 'bg-rose-500 text-white ring-1 ring-rose-300' },
                { id: 'arrow' as ToolType, label: 'Vektor', icon: ArrowRight, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
                { id: 'line' as ToolType, label: 'Garis', icon: Minus, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
                { id: 'rect' as ToolType, label: 'Kotak', icon: Square, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
                { id: 'circle' as ToolType, label: 'Lingkaran', icon: Circle, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
              ].map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={`penA-${t.id}`}
                    onClick={() => {
                      sounds.playClick();
                      setUser1Tool(t.id);
                    }}
                    title={`Pen A: ${t.label}`}
                    className={`p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      user1Tool === t.id
                        ? t.activeCls
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <TIcon className="h-3 w-3" />
                    <span className="hidden xl:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Warna Pen A */}
              <div className="flex items-center gap-1">
                {activeColorPalette.map((c) => (
                  <button
                    key={`penA-col-${c.value}`}
                    onClick={() => {
                      sounds.playClick();
                      setUser1Color(c.value);
                      if (user1Tool === 'eraser') setUser1Tool('pen');
                    }}
                    title={`Warna Pen A: ${c.label}`}
                    className={`h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center ${
                      user1Color === c.value && user1Tool !== 'eraser'
                        ? 'border-blue-300 scale-115 ring-2 ring-white/70'
                        : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>

              {/* Ukuran Pena Pen A */}
              <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {[2, 4, 8, 14].map((sz) => (
                  <button
                    key={`penA-sz-${sz}`}
                    onClick={() => {
                      sounds.playClick();
                      setUser1Size(sz);
                    }}
                    title={`Ukuran Pen A: ${sz}px`}
                    className={`h-5 px-1 rounded text-[9px] font-mono font-bold transition ${
                      user1Size === sz
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Undo & Clear Pen A */}
              <button
                onClick={() => handleUndoPen('penA')}
                title="Undo Goresan Pen A"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-200 transition"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleClearPenSide('penA')}
                title="Bersihkan Coretan Sisi Pen A"
                className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-800 text-rose-200 border border-rose-800/50 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* PEN B (MURID 2 - SISI KANAN) DEDICATED TOOLBOX */}
          <div className="rounded-xl bg-rose-950/35 border border-rose-700/50 px-2 py-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black tracking-tight shrink-0">
                PEN B (Kanan)
              </span>

              {[
                { id: 'pen' as ToolType, label: 'Spidol', icon: PenTool, activeCls: 'bg-rose-500 text-white ring-1 ring-rose-300' },
                { id: 'highlighter' as ToolType, label: 'Stabilo', icon: Highlighter, activeCls: 'bg-amber-500 text-slate-950 ring-1 ring-amber-300' },
                { id: 'eraser' as ToolType, label: 'Hapus', icon: Eraser, activeCls: 'bg-rose-600 text-white ring-1 ring-white' },
                { id: 'arrow' as ToolType, label: 'Vektor', icon: ArrowRight, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
                { id: 'line' as ToolType, label: 'Garis', icon: Minus, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
                { id: 'rect' as ToolType, label: 'Kotak', icon: Square, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
                { id: 'circle' as ToolType, label: 'Lingkaran', icon: Circle, activeCls: 'bg-indigo-500 text-white ring-1 ring-indigo-300' },
              ].map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={`penB-${t.id}`}
                    onClick={() => {
                      sounds.playClick();
                      setUser2Tool(t.id);
                    }}
                    title={`Pen B: ${t.label}`}
                    className={`p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      user2Tool === t.id
                        ? t.activeCls
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <TIcon className="h-3 w-3" />
                    <span className="hidden xl:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Warna Pen B */}
              <div className="flex items-center gap-1">
                {activeColorPalette.map((c) => (
                  <button
                    key={`penB-col-${c.value}`}
                    onClick={() => {
                      sounds.playClick();
                      setUser2Color(c.value);
                      if (user2Tool === 'eraser') setUser2Tool('pen');
                    }}
                    title={`Warna Pen B: ${c.label}`}
                    className={`h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center ${
                      user2Color === c.value && user2Tool !== 'eraser'
                        ? 'border-rose-300 scale-115 ring-2 ring-white/70'
                        : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>

              {/* Ukuran Pena Pen B */}
              <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {[2, 4, 8, 14].map((sz) => (
                  <button
                    key={`penB-sz-${sz}`}
                    onClick={() => {
                      sounds.playClick();
                      setUser2Size(sz);
                    }}
                    title={`Ukuran Pen B: ${sz}px`}
                    className={`h-5 px-1 rounded text-[9px] font-mono font-bold transition ${
                      user2Size === sz
                        ? 'bg-rose-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Undo & Clear Pen B */}
              <button
                onClick={() => handleUndoPen('penB')}
                title="Undo Goresan Pen B"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-200 transition"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleClearPenSide('penB')}
                title="Bersihkan Coretan Sisi Pen B"
                className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-800 text-rose-200 border border-rose-800/50 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* PID STATUS BADGE & INSTRUCTION RIBBON */}
      <div className="bg-slate-900/90 text-[10px] font-semibold text-slate-400 px-3 py-1 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">
            {isDualPenMode
              ? 'Mode 2 Pen Aktif • Multi-Touch Simultan Aktif (Pen A & Pen B Dapat Menulis Bersamaan)'
              : (stylusDetected 
                ? 'Stylus Pen PID Aktif • Sensitif Tekanan & Sentuhan Terhubung' 
                : 'Papan Tulis Digital Siap Digunakan dengan Stylus Pen PID, Sentuhan Layar, atau Mouse')}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
            Touch-Action: <strong className="text-emerald-400">Non-Scroll (Palm Rejection)</strong>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN WRITING CANVAS VIEWPORT (FULL MULTI-TOUCH PID CANVAS)                */}
      {/* ========================================================================= */}
      <div 
        ref={canvasWrapperRef}
        onPointerMove={dragState ? handlePointerMoveDrag : undefined}
        onPointerUp={dragState ? handlePointerUpDrag : undefined}
        onPointerCancel={dragState ? handlePointerUpDrag : undefined}
        className="relative flex-1 min-h-0 w-full bg-slate-900 overflow-hidden cursor-crosshair touch-none select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Background Canvas (Textures, grids, lines, dual pen division) */}
        <canvas
          ref={bgCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Foreground Writing Canvas (Multi-Pointer Tracking) */}
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            e.preventDefault();
            handlePointerDown(e);
          }}
          onPointerMove={(e) => {
            e.preventDefault();
            handlePointerMove(e);
          }}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ touchAction: 'none' }}
        />

        {/* ===================================================================== */}
        {/* DRAGGABLE & MOVABLE KINEMATICS GRAPH CARDS (BEBAS DIGESER DI PAPAN)   */}
        {/* ===================================================================== */}
        {boardGraphs.map((graph) => {
          const isGLB = graph.mode === 'GLB';
          const isBraking = graph.subType === 'diperlambat';
          const accentColor = isGLB ? '#0284c7' : (isBraking ? '#dc2626' : '#16a34a');
          const accentBorder = isGLB ? 'border-sky-500/80 shadow-sky-500/20' : (isBraking ? 'border-rose-500/80 shadow-rose-500/20' : 'border-emerald-500/80 shadow-emerald-500/20');
          const accentBadge = isGLB ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : (isBraking ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40');

          return (
            <div
              key={graph.id}
              onClick={() => bringToFront('graph', graph.id)}
              style={{
                position: 'absolute',
                left: `${graph.x}px`,
                top: `${graph.y}px`,
                width: `${graph.width}px`,
                zIndex: graph.zIndex,
              }}
              className={`rounded-2xl border-2 backdrop-blur-md shadow-2xl transition-shadow select-none ${
                theme === 'greenboard' || theme === 'blackboard'
                  ? 'bg-slate-900/95 text-white'
                  : 'bg-white/95 text-slate-900'
              } ${accentBorder}`}
            >
              {/* Drag Handle Header */}
              <div
                onPointerDown={(e) => handleStartDrag(e, 'graph', graph.id, graph.x, graph.y)}
                className="flex items-center justify-between px-3 py-2 bg-slate-950/90 rounded-t-2xl border-b border-slate-800 text-white cursor-grab active:cursor-grabbing"
                title="Tekan dan geser untuk memindahkan posisi grafik"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <GripHorizontal className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-black truncate">{graph.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${accentBadge}`}>
                    {graph.mode}
                  </span>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => toggleMinimizeGraph(graph.id)}
                    title={graph.isMinimized ? 'Perbesar Grafik' : 'Perkecil Grafik (Hemat Ruang Catatan)'}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  >
                    {graph.isMinimized ? <Maximize className="h-3.5 w-3.5" /> : <Minimize className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => removeGraph(graph.id)}
                    title="Hapus Grafik dari Papan Tulis"
                    className="p-1 rounded-lg hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Content (if not minimized) */}
              {!graph.isMinimized ? (
                <div className="p-3 space-y-2">
                  {/* Visual SVG Graphic */}
                  <div className="w-full h-32 bg-slate-950/90 rounded-xl p-2 relative overflow-hidden border border-slate-800 flex items-center justify-center">
                    <svg viewBox="0 0 320 110" className="w-full h-full">
                      {/* Grid dots */}
                      <pattern id={`grid-${graph.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#334155" />
                      </pattern>
                      <rect width="320" height="110" fill={`url(#grid-${graph.id})`} />

                      {/* Shaded Area for Displacement s */}
                      {isGLB ? (
                        <polygon points="40,45 280,45 280,95 40,95" fill="rgba(2, 132, 199, 0.25)" />
                      ) : isBraking ? (
                        <polygon points="40,25 280,95 40,95" fill="rgba(220, 38, 38, 0.25)" />
                      ) : (
                        <polygon points="40,75 280,25 280,95 40,95" fill="rgba(22, 163, 74, 0.25)" />
                      )}

                      {/* Axes */}
                      <line x1="40" y1="95" x2="305" y2="95" stroke="#94a3b8" strokeWidth="2" />
                      <line x1="40" y1="95" x2="40" y2="12" stroke="#94a3b8" strokeWidth="2" />
                      
                      {/* Curve Line */}
                      {isGLB ? (
                        <line x1="40" y1="45" x2="280" y2="45" stroke={accentColor} strokeWidth="3" />
                      ) : isBraking ? (
                        <line x1="40" y1="25" x2="280" y2="95" stroke={accentColor} strokeWidth="3" />
                      ) : (
                        <line x1="40" y1="75" x2="280" y2="25" stroke={accentColor} strokeWidth="3" />
                      )}

                      {/* Axis Labels */}
                      <text x="310" y="99" fill="#94a3b8" fontSize="10" fontFamily="monospace">t</text>
                      <text x="35" y="10" fill="#94a3b8" fontSize="10" fontFamily="monospace">v</text>
                      <text x="30" y="102" fill="#94a3b8" fontSize="9" fontFamily="monospace">0</text>
                      <text x="46" y={isGLB ? "40" : (isBraking ? "22" : "72")} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">v₀={graph.v0}</text>
                      <text x="255" y="107" fill="#cbd5e1" fontSize="9" fontFamily="monospace">t={graph.simTime}s</text>

                      {/* Luas = s Indicator */}
                      <text x="125" y="75" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                        Luas = s ({graph.finalPos?.toFixed(1) || ''}m)
                      </text>
                    </svg>
                  </div>

                  {/* Telemetry and Notes */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-mono">Kecepatan Awal</span>
                      <strong className="text-xs font-mono text-sky-400">{graph.v0} m/s</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-mono">Percepatan (a)</span>
                      <strong className={`text-xs font-mono ${graph.a === 0 ? 'text-slate-300' : (graph.a > 0 ? 'text-emerald-400' : 'text-rose-400')}`}>
                        {graph.a} m/s²
                      </strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-mono">Perpindahan (s)</span>
                      <strong className="text-xs font-mono text-amber-400">{graph.finalPos?.toFixed(1) || '0'} m</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    💡 <strong className="text-slate-300">Konsep:</strong> Gradien garis kemiringan = percepatan ($a$). Luas daerah di bawah garis = jarak tempuh ($s$).
                  </p>
                </div>
              ) : (
                <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-sky-400">v₀={graph.v0}m/s • a={graph.a}m/s²</span>
                  <span className="text-amber-400">s={graph.finalPos?.toFixed(1)}m</span>
                </div>
              )}
            </div>
          );
        })}

        {/* ===================================================================== */}
        {/* DRAGGABLE & MOVABLE FORMULA CARDS (BEBAS DIGESER DI PAPAN)            */}
        {/* ===================================================================== */}
        {boardFormulas.map((formula) => {
          return (
            <div
              key={formula.id}
              onClick={() => bringToFront('formula', formula.id)}
              style={{
                position: 'absolute',
                left: `${formula.x}px`,
                top: `${formula.y}px`,
                width: `${formula.width}px`,
                zIndex: formula.zIndex,
              }}
              className={`rounded-2xl border-2 border-sky-400/80 shadow-2xl backdrop-blur-md select-none transition-shadow ${
                theme === 'greenboard' || theme === 'blackboard'
                  ? 'bg-slate-900/95 text-white'
                  : 'bg-white/95 text-slate-900'
              }`}
            >
              {/* Drag Handle Header */}
              <div
                onPointerDown={(e) => handleStartDrag(e, 'formula', formula.id, formula.x, formula.y)}
                className="flex items-center justify-between px-3 py-2 bg-slate-950/90 rounded-t-2xl border-b border-slate-800 text-white cursor-grab active:cursor-grabbing"
                title="Tekan dan geser untuk memindahkan posisi rumus"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <GripHorizontal className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-black truncate">{formula.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => toggleMinimizeFormula(formula.id)}
                    title={formula.isMinimized ? 'Perbesar Rumus' : 'Perkecil Rumus (Hemat Ruang Catatan)'}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  >
                    {formula.isMinimized ? <Maximize className="h-3.5 w-3.5" /> : <Minimize className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => removeFormula(formula.id)}
                    title="Hapus Rumus dari Papan Tulis"
                    className="p-1 rounded-lg hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Content (if not minimized) */}
              {!formula.isMinimized ? (
                <div className="p-3 space-y-1.5 text-center">
                  <div className="p-2.5 rounded-xl bg-sky-950/70 border border-sky-600/40">
                    <span className="font-mono text-base sm:text-lg font-black text-sky-300 tracking-wide">
                      {formula.latexFormula}
                    </span>
                  </div>
                  {formula.description && (
                    <p className="text-[10px] text-slate-400 font-medium">
                      {formula.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-3 py-1.5 text-center">
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {formula.latexFormula}
                  </span>
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* Floating Toast Message */}
      {toastMsg && (
        <div className="absolute bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-bold shadow-2xl flex items-center gap-2 border border-sky-500 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FITUR OPSI A - TEMPEL GRAFIK KINEMATIKA LANGSUNG                   */}
      {/* ========================================================================= */}
      {showGraphModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[92%] overflow-y-auto rounded-3xl bg-slate-900 border-2 border-sky-500/80 p-5 text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black flex items-center gap-2 text-sky-400">
                <BarChart3 className="h-5 w-5 text-sky-400" />
                <span>Pilih &amp; Tempel Grafik Kinematika ke Papan Tulis</span>
              </h3>
              <button
                onClick={() => setShowGraphModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih grafik kinematika untuk langsung ditempelkan ke papan tulis PID agar guru dan murid dapat langsung menganalisis gradien kemiringan ($\tan \alpha$) dan luas di bawah kurva:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => stampPresetGraph('glb-vt')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-sky-500/30 text-left transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-400">GLB</span>
                  <span className="text-[10px] font-mono text-emerald-400">v konstan</span>
                </div>
                <h4 className="text-xs font-black text-white">Grafik v-t GLB</h4>
                <p className="text-[10px] text-slate-400">Garis mendatar horizontal, luas persegi panjang = jarak perpindahan (s).</p>
              </button>

              <button
                onClick={() => stampPresetGraph('glbb-accel-vt')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-left transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400">GLBB Dipercepat</span>
                  <span className="text-[10px] font-mono text-emerald-300">a &gt; 0</span>
                </div>
                <h4 className="text-xs font-black text-white">Grafik v-t GLBB Dipercepat</h4>
                <p className="text-[10px] text-slate-400">Garis lurus miring naik, gradien kemiringan = percepatan konstan (a).</p>
              </button>

              <button
                onClick={() => stampPresetGraph('glbb-decel-vt')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-rose-500/30 text-left transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400">GLBB Diperlambat</span>
                  <span className="text-[10px] font-mono text-rose-300">a &lt; 0</span>
                </div>
                <h4 className="text-xs font-black text-white">Grafik v-t GLBB Diperlambat</h4>
                <p className="text-[10px] text-slate-400">Garis lurus miring turun hingga nol (pengereman mobil sampai berhenti).</p>
              </button>

              <button
                onClick={() => stampPresetGraph('glbb-st')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-left transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400">Posisi-Waktu</span>
                  <span className="text-[10px] font-mono text-amber-300">s ∝ t²</span>
                </div>
                <h4 className="text-xs font-black text-white">Grafik s-t Parabola</h4>
                <p className="text-[10px] text-slate-400">Kurva lengkung parabola kuadratik pertambahan jarak tempuh GLBB.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI BERSIHKAN PAPAN */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-slate-700 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="h-6 w-6" />
              <h3 className="text-base font-black">Bersihkan Seluruh Papan?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh goresan tulisan pada papan tulis digital saat ini akan dihapus. Anda tetap dapat menggunakan Undo jika diperlukan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-500 transition shadow-lg shadow-rose-600/30"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TEMPEL RUMUS KINEMATIKA CEPAT */}
      {showFormulaModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[92%] overflow-y-auto rounded-3xl bg-slate-900 border-2 border-slate-700 p-5 text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black flex items-center gap-2 text-sky-400">
                <Sparkles className="h-5 w-5" />
                <span>Tempel Rumus Kinematika ke Papan</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Pilih rumus dasar untuk ditempelkan ke papan tulis agar siap dibahas bersama murid:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => stampFormula('s = v × t', 'GERAK LURUS BERATURAN (GLB)', 'Jarak tempuh (s) berbanding lurus dengan kelajuan konstan (v) dan waktu (t)')}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold text-sky-400 block">GLB • Jarak Tempuh</span>
                  <span className="font-mono text-sm font-black text-white">s = v × t</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => stampFormula('vt = v0 + (a × t)', 'GLBB • KECEPATAN SETIAP SAAT', 'Kecepatan akhir pada detik ke-t dengan pertambahan percepatan konstan a')}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 block">GLBB 1 • Kecepatan Sesaat</span>
                  <span className="font-mono text-sm font-black text-white">vt = v0 + (a × t)</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => stampFormula('s = v0·t + ½·a·t²', 'GLBB • JARAK TEMPUH', 'Jarak tempuh kuadratik yang membentuk kurva parabola pertambahan posisi')}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-400 block">GLBB 2 • Jarak Kuadratik</span>
                  <span className="font-mono text-sm font-black text-white">s = v0·t + ½·a·t²</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => stampFormula('vt² = v0² + 2·a·s', 'GLBB • PERSAMAAN TANPA WAKTU', 'Hubungan langsung kecepatan dan jarak tempuh tanpa variabel waktu')}
                className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold text-purple-400 block">GLBB 3 • Hubungan Kecepatan &amp; Jarak</span>
                  <span className="font-mono text-sm font-black text-white">vt² = v0² + 2·a·s</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
