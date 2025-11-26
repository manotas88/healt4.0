
import React, { useRef, useState } from 'react';
import { BubbleEntity, BubbleState, BreathPhase } from '../types';

interface BubbleGridProps {
  bubbles: BubbleEntity[];
  breathPhase: BreathPhase;
  targetBubbleId: string | null;
  onBubbleClick: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  rows: number;
  cols: number;
}

const BubbleGrid: React.FC<BubbleGridProps> = ({ 
  bubbles, 
  breathPhase, 
  targetBubbleId, 
  onBubbleClick, 
  onSwap,
  cols 
}) => {
  // Drag State
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);
  const dragStartCoord = useRef<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    // Only allow interaction if we aren't currently breathing
    if (breathPhase !== BreathPhase.Idle) return;

    const bubble = bubbles[index];
    
    // If hidden, click triggers breath mode selection
    if (bubble.state === BubbleState.Hidden) {
      onBubbleClick(index);
      return;
    }

    // If revealed, start drag
    if (bubble.state === BubbleState.Revealed) {
      setDragStartIdx(index);
      dragStartCoord.current = { x: e.clientX, y: e.clientY };
      // Capture pointer for smooth dragging even if mouse leaves the element
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartIdx === null || !dragStartCoord.current) return;
    
    const endX = e.clientX;
    const endY = e.clientY;
    const diffX = endX - dragStartCoord.current.x;
    const diffY = endY - dragStartCoord.current.y;
    
    // Threshold for a valid swipe
    const threshold = 30;
    let targetIdx: number | null = null;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && (dragStartIdx % cols) < cols - 1) targetIdx = dragStartIdx + 1;
        else if (diffX < 0 && (dragStartIdx % cols) > 0) targetIdx = dragStartIdx - 1;
      }
    } else {
      // Vertical
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0 && dragStartIdx + cols < bubbles.length) targetIdx = dragStartIdx + cols;
        else if (diffY < 0 && dragStartIdx - cols >= 0) targetIdx = dragStartIdx - cols;
      }
    }

    if (targetIdx !== null) {
      onSwap(dragStartIdx, targetIdx);
    }

    setDragStartIdx(null);
    dragStartCoord.current = null;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className="grid gap-3 p-4 bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl touch-none"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {bubbles.map((bubble, i) => {
        const isSelected = bubble.id === targetBubbleId;
        const isPopped = bubble.state === BubbleState.Popped;
        const isHidden = bubble.state === BubbleState.Hidden;

        return (
          <div
            key={bubble.id}
            onPointerDown={(e) => handlePointerDown(e, i)}
            onPointerUp={handlePointerUp}
            className={`
              aspect-square rounded-full relative cursor-pointer
              transition-all duration-500 ease-out
              flex items-center justify-center
              ${isPopped ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100'}
              ${bubble.isNew ? 'animate-[pulse_0.5s_ease-out]' : ''}
              ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 scale-110 z-20' : ''}
              ${isHidden 
                  ? 'bg-slate-300 shadow-inner' 
                  : `${bubble.color} shadow-lg border-2 border-white/20`
              }
              hover:scale-105 active:scale-95
            `}
          >
            {/* Glossy shine effect */}
            {!isHidden && (
              <>
                <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-gradient-to-br from-white to-transparent rounded-full opacity-80 pointer-events-none"></div>
                <div className="absolute bottom-[15%] right-[15%] w-[15%] h-[15%] bg-black/10 rounded-full blur-sm pointer-events-none"></div>
              </>
            )}
            
            {isHidden && (
              <span className="text-2xl opacity-40 select-none grayscale contrast-50">☁️</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BubbleGrid;
