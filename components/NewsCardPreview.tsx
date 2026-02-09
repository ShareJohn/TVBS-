
import React, { useEffect, useRef, useState, MouseEvent, TouchEvent } from 'react';
import { NewsCardData, PhotoSettings, FrameRect, TextLayout } from '../types';

interface Props {
  data: NewsCardData;
  onUpdate: React.Dispatch<React.SetStateAction<NewsCardData>>;
}

const useImageLoader = (src: string | null) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImage(null);
      setError(false);
      return;
    }

    let active = true;
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = "anonymous";
    }
    img.src = src;
    img.onload = () => {
      if (active) {
        setImage(img);
        setError(false);
      }
    };
    img.onerror = () => {
      if (active) {
        setError(true);
        const retryImg = new Image();
        retryImg.src = src;
        retryImg.onload = () => { if (active) setImage(retryImg); };
      }
    };
    return () => { active = false; };
  }, [src]);

  return { image, error };
};

export const NewsCardPreview: React.FC<Props> = ({ data, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { image: solidBgImg, error: solidBgError } = useImageLoader(data.solidTemplate);
  const { image: transBgImg } = useImageLoader(data.transparentTemplate);
  const { image: reporterImg } = useImageLoader(data.reporterPhoto);
  const { image: intervieweeImg } = useImageLoader(data.intervieweePhoto);

  // 拖曳狀態管理
  const [dragTarget, setDragTarget] = useState<'reporter' | 'interviewee' | 'reporterText' | 'intervieweeText' | null>(null);
  const [dragMode, setDragMode] = useState<'moveImage' | 'moveFrame' | 'resizeFrame' | 'moveText'>('moveImage');
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  
  const [initialSettings, setInitialSettings] = useState<PhotoSettings>({ x: 0, y: 0, scale: 1 });
  const [initialFrame, setInitialFrame] = useState<FrameRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [initialTextLayout, setInitialTextLayout] = useState<TextLayout>({ x: 0, y: 0, w: 0, size: 0 });

  const RESIZE_HANDLE_SIZE = 40;

  const CONSTANTS = {
    photoCreditPos: { x: 1764 - 25, y: 725 - 15 }, 
  };

  const COLORS = {
    REPORTER: '#2d3436',
    INTERVIEWEE_STROKE: '#00165d',
    INTERVIEWEE_SHADOW: '#000b2e',
  };

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const isPointInRect = (x: number, y: number, r: FrameRect) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  
  const isPointInResizeHandle = (x: number, y: number, r: FrameRect) => {
     return x >= (r.x + r.w - RESIZE_HANDLE_SIZE) && x <= (r.x + r.w) &&
            y >= (r.y + r.h - RESIZE_HANDLE_SIZE) && y <= (r.y + r.h);
  };

  // 文字區域碰撞檢測
  const isPointInText = (x: number, y: number, ctx: CanvasRenderingContext2D, text: string, layout: TextLayout, isSplit = false) => {
    // 這裡我們用一個簡單的估算，或者利用 measureText
    // 對於 Interviewee 分開的文字，我們用寬度估算
    ctx.font = `900 ${layout.size}px "Noto Sans TC"`; // 使用基準大小做估算
    
    let width = 0;
    const height = layout.size * 1.5; // 估算高度
    
    if (isSplit) {
        // 受訪者姓名職稱 (Split mode)
        const titleSize = layout.size;
        const nameSize = layout.size * 1.25; // Adjusted Ratio
        ctx.font = `900 ${titleSize}px "Noto Sans TC"`;
        const titleW = ctx.measureText(data.intervieweeTitle).width;
        ctx.font = `900 ${nameSize}px "Noto Sans TC"`;
        const nameW = ctx.measureText(data.intervieweeName).width;
        width = titleW + nameW + 5; // + 5px gap
    } else {
        width = ctx.measureText(text).width;
    }
    
    // 簡單的中心點矩形檢測
    const halfW = width / 2;
    const halfH = height / 2;
    // Note: Since we use baseline alignment for split text, the hit box might need slight adjustment, 
    // but center based box is usually fine for dragging purposes.
    return x >= layout.x - halfW && x <= layout.x + halfW &&
           y >= layout.y - halfH && y <= layout.y + halfH;
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const pt = getCanvasPoint(clientX, clientY);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // 1. 檢查受訪者文字 (優先權最高，因為可能疊在圖上)
    if ((data.intervieweeName || data.intervieweeTitle) && 
        isPointInText(pt.x, pt.y, ctx, '', data.intervieweeTextLayout, true)) {
        setDragTarget('intervieweeText');
        setDragMode('moveText');
        setInitialTextLayout({ ...data.intervieweeTextLayout });
        setDragStart(pt);
        return;
    }

    // 2. 檢查記者文字
    const fullReporterText = (data.reporterTitle + data.reporterName).trim();
    if (fullReporterText && isPointInText(pt.x, pt.y, ctx, fullReporterText, data.reporterTextLayout)) {
        setDragTarget('reporterText');
        setDragMode('moveText');
        setInitialTextLayout({ ...data.reporterTextLayout });
        setDragStart(pt);
        return;
    }

    // 3. 檢查受訪者圖框
    if (!data.isTransparentMode && isPointInRect(pt.x, pt.y, data.intervieweeFrame)) {
      if (data.intervieweePhoto) {
        setDragTarget('interviewee');
        setDragMode('moveImage');
        setInitialSettings({ ...data.intervieweeSettings });
        setDragStart(pt);
      }
      // 如果沒有照片，不執行任何動作 (Locked)
    } 
    // 4. 檢查記者圖框
    else if (isPointInRect(pt.x, pt.y, data.reporterFrame)) {
      if (data.reporterPhoto) {
         setDragTarget('reporter');
         setDragMode('moveImage');
         setInitialSettings({ ...data.reporterSettings });
         setDragStart(pt);
      }
      // 如果沒有照片，不執行任何動作 (Locked)
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!dragTarget || !dragStart) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const currentPt = getCanvasPoint(clientX, clientY);
    
    const deltaX = currentPt.x - dragStart.x;
    const deltaY = currentPt.y - dragStart.y;

    if (dragMode === 'moveText') {
        const targetLayoutKey = dragTarget === 'reporterText' ? 'reporterTextLayout' : 'intervieweeTextLayout';
        onUpdate(prev => ({
            ...prev,
            [targetLayoutKey]: { 
                ...initialTextLayout, 
                x: initialTextLayout.x + deltaX, 
                y: initialTextLayout.y + deltaY 
            }
        }));
    } else if (dragMode === 'moveImage') {
      onUpdate(prev => ({
        ...prev,
        [`${dragTarget}Settings`]: { ...initialSettings, x: initialSettings.x + deltaX, y: initialSettings.y + deltaY }
      }));
    } else if (dragMode === 'moveFrame') {
      onUpdate(prev => ({
        ...prev,
        [`${dragTarget}Frame`]: { 
          ...prev[`${dragTarget}Frame` as keyof NewsCardData] as FrameRect, 
          x: initialFrame.x + deltaX, 
          y: initialFrame.y + deltaY 
        }
      }));
    } else if (dragMode === 'resizeFrame') {
      const newW = Math.max(50, initialFrame.w + deltaX);
      const newH = Math.max(50, initialFrame.h + deltaY);
      onUpdate(prev => ({
        ...prev,
        [`${dragTarget}Frame`]: { 
          ...prev[`${dragTarget}Frame` as keyof NewsCardData] as FrameRect, 
          w: newW,
          h: newH 
        }
      }));
    }
  };

  const handleMouseUp = () => { setDragTarget(null); setDragStart(null); };

  const drawUserPhoto = (ctx: any, img: HTMLImageElement, frame: FrameRect, settings: PhotoSettings) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.w, frame.h);
    ctx.clip();

    const imgRatio = img.width / img.height;
    const frameRatio = frame.w / frame.h;
    
    let bgW, bgH, bgX, bgY;
    if (imgRatio < frameRatio) { bgW = frame.w; bgH = frame.w / imgRatio; bgX = frame.x; bgY = frame.y + (frame.h - bgH) / 2; }
    else { bgH = frame.h; bgW = frame.h * imgRatio; bgX = frame.x + (frame.w - bgW) / 2; bgY = frame.y; }
    
    ctx.save();
    ctx.filter = 'blur(40px) brightness(0.6)';
    ctx.drawImage(img, bgX, bgY, bgW, bgH);
    ctx.restore();

    let drawW, drawH;
    if (imgRatio < frameRatio) { drawW = frame.w * settings.scale; drawH = (frame.w / imgRatio) * settings.scale; }
    else { drawH = frame.h * settings.scale; drawW = (frame.h * imgRatio) * settings.scale; }
    
    const centerX = frame.x + frame.w / 2;
    const centerY = frame.y + frame.h / 2;
    ctx.drawImage(img, centerX - (drawW / 2) + settings.x, centerY - (drawH / 2) + settings.y, drawW, drawH);
    ctx.restore();
  };

  const drawEmptyFrameIndicator = (ctx: CanvasRenderingContext2D, frame: FrameRect, label: string) => {
    // 依據使用者需求，不顯示預覽畫面中的虛線框
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!data.isTransparentMode) {
        if (solidBgImg) {
          ctx.drawImage(solidBgImg, 0, 0, 1920, 1080);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, 1920, 1080);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.font = '40px "Noto Sans TC"';
          ctx.fillText(solidBgError ? '圖片載入失敗' : '載入中...', 960, 540);
        }
    }

    if (!data.isTransparentMode) {
        if (intervieweeImg) {
          drawUserPhoto(ctx, intervieweeImg, data.intervieweeFrame, data.intervieweeSettings);
        } else {
          // drawEmptyFrameIndicator(ctx, data.intervieweeFrame, "受訪者照片框");
        }
        
        if (data.photoCredit) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '26px "Noto Sans TC"';
            ctx.textAlign = 'right';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(data.photoCredit, CONSTANTS.photoCreditPos.x, CONSTANTS.photoCreditPos.y);
            ctx.restore();
        }
    }
    
    if (transBgImg) {
        ctx.drawImage(transBgImg, 0, 0, 1920, 1080);
    }

    if (reporterImg) {
      drawUserPhoto(ctx, reporterImg, data.reporterFrame, data.reporterSettings);
    } else {
      // drawEmptyFrameIndicator(ctx, data.reporterFrame, "記者照片框");
    }

    // === Text Layers ===
    
    // 記者
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (data.reporterName || data.reporterTitle) {
      ctx.fillStyle = COLORS.REPORTER;
      const layout = data.reporterTextLayout;
      
      let displayName = data.reporterName;
      // 姓名 如果只有兩個字 固定空格 (插入一個空格)
      if (displayName && displayName.length === 2) {
          displayName = displayName[0] + ' ' + displayName[1];
      }

      const fullText = (data.reporterTitle + ' ' + (displayName || '')).trim();
      
      // 檢查是否包含 TVBS，若有則針對 TVBS 使用 Arial Black
      if (fullText.includes('TVBS')) {
          const parts = fullText.split(/(TVBS)/g);
          let totalWidth = 0;
          const segments: {text: string, width: number, font: string}[] = [];

          // First pass: measure
          parts.forEach(part => {
             if (!part) return;
             const isTVBS = part === 'TVBS';
             const font = isTVBS 
                 ? `900 ${layout.size}px "Arial Black", "Arial", sans-serif`
                 : `bold ${layout.size}px "Noto Sans TC"`;
             ctx.font = font;
             const width = ctx.measureText(part).width;
             totalWidth += width;
             segments.push({ text: part, width, font });
          });

          // Calculate scale if compression needed
          const scale = layout.w < totalWidth ? layout.w / totalWidth : 1;

          // Draw from left to right, centered in the layout box
          ctx.textAlign = 'left';
          let currentX = layout.x - (totalWidth * scale) / 2;

          segments.forEach(seg => {
             ctx.font = seg.font;
             const targetWidth = seg.width * scale;
             // 4th arg is maxWidth, forces compression to match global scale
             ctx.fillText(seg.text, currentX, layout.y, targetWidth);
             currentX += targetWidth;
          });
      } else {
          // 一般繪製 (無 TVBS 特殊字體需求)
          ctx.font = `bold ${layout.size}px "Noto Sans TC"`;
          // 使用 maxWidth 參數實現「左右壓縮」而非縮小字級
          ctx.fillText(fullText, layout.x, layout.y, layout.w);
      }
    }

    // 受訪者 (姓名 + 職稱 Split Layout)
    if (data.intervieweeName || data.intervieweeTitle) {
      const layout = data.intervieweeTextLayout;
      const titleSize = layout.size; // 基準大小 (職稱)
      const nameSize = layout.size * 1.25; // Adjusted Ratio
      
      // 設置字體參數
      const strokeColor = COLORS.INTERVIEWEE_STROKE;
      const strokeWidth = 14;
      const shadowColor = COLORS.INTERVIEWEE_SHADOW;
      const shadowBlur = 3;
      const shadowOffset = 3; // Distance

      // 繪製函數
      const drawStyledText = (text: string, x: number, y: number, size: number, align: CanvasTextAlign) => {
         ctx.font = `900 ${size}px "Noto Sans TC"`;
         ctx.textAlign = align;
         ctx.textBaseline = 'alphabetic'; // Align bottom edge
         ctx.lineJoin = 'round';
         ctx.lineWidth = strokeWidth;

         // 1. 繪製厚度/陰影 (Shadow Layer)
         ctx.save();
         ctx.shadowColor = shadowColor;
         ctx.shadowBlur = shadowBlur;
         ctx.shadowOffsetX = shadowOffset * 0.5; 
         ctx.shadowOffsetY = shadowOffset * 0.866;
         ctx.strokeStyle = strokeColor;
         ctx.strokeText(text, x, y);
         ctx.restore();

         // 2. 繪製主要描邊 (Main Stroke)
         ctx.strokeStyle = strokeColor;
         ctx.strokeText(text, x, y);

         // 3. 繪製白色填充 (White Fill)
         ctx.fillStyle = '#ffffff';
         ctx.fillText(text, x, y);
      };

      // 職稱 (左側，靠右對齊)
      if (data.intervieweeTitle) {
          drawStyledText(data.intervieweeTitle, layout.x - 2.5, layout.y, titleSize, 'right');
      }

      // 姓名 (右側，靠左對齊)
      if (data.intervieweeName) {
          drawStyledText(data.intervieweeName, layout.x + 2.5, layout.y, nameSize, 'left');
      }
    }

  }, [solidBgImg, solidBgError, transBgImg, reporterImg, intervieweeImg, data]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      const filename = `電訪框_${data.reporterName || '未命名'}_${data.intervieweeName || '未命名'}${data.isTransparentMode ? '_透明版' : ''}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert("⚠️ 下載失敗：原因通常是遠端圖片的安全限制 (CORS)。\n\n解決方法：\n1. 請先手動下載圖卡到電腦。\n2. 點擊「切換類別」旁的『我自己上傳圖卡』功能上傳。\n3. 使用本地圖片製作即可順利下載。");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div 
        className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-white/5 select-none w-full max-w-5xl"
        style={{
          backgroundImage: data.isTransparentMode ? 'conic-gradient(#334155 90deg, #1e293b 90deg 180deg, #334155 180deg 270deg, #1e293b 270deg)' : 'none',
          backgroundSize: '24px 24px'
        }}
      >
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className={`w-full h-auto aspect-video block touch-none cursor-move`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
      </div>
      <button
        onClick={handleDownload}
        className="px-16 py-6 font-black text-white bg-red-700 hover:bg-red-600 rounded-2xl shadow-2xl shadow-red-900/40 active:scale-95 transition-all text-2xl"
      >
        下載電訪框
      </button>
    </div>
  );
};
