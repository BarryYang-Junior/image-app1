import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ComparisonViewProps {
  originalUrl: string;
  processedUrl: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ originalUrl, processedUrl }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    let clientX;

    if ('touches' in e) {
        clientX = e.touches[0].clientX;
    } else {
        clientX = (e as MouseEvent).clientX;
    }

    const newPosition = ((clientX - left) / width) * 100;
    setSliderPosition(Math.min(Math.max(newPosition, 0), 100));
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('touchmove', resize);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchend', stopResizing);

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto aspect-auto min-h-[400px] overflow-hidden rounded-2xl border-4 border-gray-800 shadow-2xl bg-gray-900 select-none group"
    >
      {/* Background Image (Processed - shown on the right side) */}
      <img
        src={processedUrl}
        alt="Processed"
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none select-none"
      />

      {/* Foreground Image (Original - clipped by slider) */}
      <div
        className="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none select-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={originalUrl}
          alt="Original"
          className="absolute top-0 left-0 max-w-none h-full w-full object-contain"
          // Important: We need to set the width of this inner img to match the container's width manually or via object-fit
          // Using object-contain on both ensures they align if aspect ratios match.
          // Since we use the same image source dimensions, object-contain works best if container has fixed aspect ratio or fits content.
          // A safer bet for absolute alignment is to let the container define the size.
          style={{ width: containerRef.current?.clientWidth ? `${containerRef.current.clientWidth}px` : '100%' }}
        />
        
        {/* Label for Original */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10">
          原图
        </div>
      </div>
      
      {/* Label for Result (on the right side background) */}
       <div className="absolute top-4 right-4 bg-blue-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          去水印后
        </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-shadow z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={startResizing}
        onTouchStart={startResizing}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600">
           <div className="flex -space-x-1">
            <ChevronLeft size={14} />
            <ChevronRight size={14} />
           </div>
        </div>
      </div>
    </div>
  );
};