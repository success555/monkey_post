import React, { useRef, useState, useEffect } from 'react';

interface MobileControlsProps {
  onMove: (x: number, z: number) => void;
  onSprint: (sprinting: boolean) => void;
  onPassPress: () => void;
  onPassRelease: () => void;
  onShootPress: () => void;
  onShootRelease: () => void;
  onSwitch: () => void;
  hasBall: boolean;
  shootPower: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onSprint,
  onPassPress,
  onPassRelease,
  onShootPress,
  onShootRelease,
  onSwitch,
  hasBall,
  shootPower
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);

  const [isSprintActive, setIsSprintActive] = useState(false);
  const [isPassActive, setIsPassActive] = useState(false);
  const [isShootActive, setIsShootActive] = useState(false);

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setIsJoystickActive(true);

    if ('targetTouches' in e && e.targetTouches.length > 0) {
      const touch = e.targetTouches[0];
      joystickTouchId.current = touch.identifier;
      updateJoystickPosition(touch.clientX, touch.clientY);
    } else if ('clientX' in e) {
      updateJoystickPosition(e.clientX, e.clientY);
    }
  };

  const handleJoystickMove = (e: TouchEvent | MouseEvent) => {
    if (!isJoystickActive) return;

    if ('touches' in e) {
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchId.current) {
          updateJoystickPosition(e.touches[i].clientX, e.touches[i].clientY);
          break;
        }
      }
    } else if ('clientX' in e) {
      updateJoystickPosition(e.clientX, e.clientY);
    }
  };

  const handleJoystickEnd = (e: TouchEvent | MouseEvent) => {
    if ('changedTouches' in e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId.current) {
          resetJoystick();
          break;
        }
      }
    } else {
      resetJoystick();
    }
  };

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setJoystickPos({ x: dx, y: dy });

    // Normalize for 3D world (X = lateral, Z = forward/backward)
    const normX = dx / maxRadius;
    const normZ = dy / maxRadius;
    onMove(normX, normZ);
  };

  const resetJoystick = () => {
    setIsJoystickActive(false);
    joystickTouchId.current = null;
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  useEffect(() => {
    const moveListener = (e: TouchEvent | MouseEvent) => handleJoystickMove(e);
    const endListener = (e: TouchEvent | MouseEvent) => handleJoystickEnd(e);

    window.addEventListener('touchmove', moveListener, { passive: false });
    window.addEventListener('touchend', endListener);
    window.addEventListener('touchcancel', endListener);
    window.addEventListener('mousemove', moveListener);
    window.addEventListener('mouseup', endListener);

    return () => {
      window.removeEventListener('touchmove', moveListener);
      window.removeEventListener('touchend', endListener);
      window.removeEventListener('touchcancel', endListener);
      window.removeEventListener('mousemove', moveListener);
      window.removeEventListener('mouseup', endListener);
    };
  }, [isJoystickActive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none touch-none">
      {/* --- Left Virtual Joystick (Smooth Analog Stick for Mobile Landscape) --- */}
      <div className="absolute left-3 bottom-3 sm:left-5 sm:bottom-5 pointer-events-auto touch-none">
        <div
          ref={joystickBaseRef}
          onMouseDown={handleJoystickStart}
          onTouchStart={handleJoystickStart}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/25 flex items-center justify-center shadow-2xl relative"
        >
          {/* Center deadzone dot */}
          <div className="w-3.5 h-3.5 rounded-full bg-white/30" />

          {/* Movable Joystick Knob */}
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-green-400 border-2 border-white shadow-xl absolute flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/60" />
          </div>
        </div>
      </div>

      {/* --- Right Action Buttons Cluster (Tactile, Responsive & Ergonomic for Landscape Thumb Play) --- */}
      <div className="absolute right-3 bottom-3 sm:right-5 sm:bottom-5 pointer-events-auto flex flex-col items-end space-y-2 sm:space-y-2.5 touch-none">
        {/* Top row: Big & Transparent Swap & Sprint Buttons */}
        <div className="flex space-x-2 sm:space-x-3">
          {/* Big & Transparent Swap Player Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onSwitch(); }}
            onClick={onSwitch}
            title="Switch Player (PC: E)"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/40 backdrop-blur-md active:bg-cyan-600/70 border-2 border-cyan-400/80 text-cyan-200 font-black text-xs shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all touch-none select-none"
          >
            <span className="text-base sm:text-lg leading-none">🔄</span>
            <span className="tracking-wide text-[10px] sm:text-[11px] font-black mt-0.5">SWAP</span>
          </button>

          {/* Big & Transparent Sprint Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); setIsSprintActive(true); onSprint(true); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setIsSprintActive(false); onSprint(false); }}
            onMouseDown={() => { setIsSprintActive(true); onSprint(true); }}
            onMouseUp={() => { setIsSprintActive(false); onSprint(false); }}
            title="Sprint (PC: Shift)"
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-400/80 font-black text-xs shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all touch-none select-none backdrop-blur-md ${
              isSprintActive
                ? 'bg-amber-500/80 text-black border-amber-300 scale-95 shadow-amber-500/60'
                : 'bg-black/40 text-amber-300 hover:bg-black/50'
            }`}
          >
            <span className="text-base sm:text-lg leading-none">⚡</span>
            <span className="tracking-wide text-[10px] sm:text-[11px] font-black mt-0.5">SPRINT</span>
          </button>
        </div>

        {/* Bottom row: Big Pass & Big Shot / Tackle */}
        <div className="flex space-x-2 sm:space-x-3 items-center">
          {/* Big Pass Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); setIsPassActive(true); onPassPress(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setIsPassActive(false); onPassRelease(); }}
            onMouseDown={() => { setIsPassActive(true); onPassPress(); }}
            onMouseUp={() => { setIsPassActive(false); onPassRelease(); }}
            title="Pass (PC: Space / J)"
            className={`w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full border-2 border-blue-300/90 font-black text-xs sm:text-sm shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-transform touch-none select-none ${
              isPassActive ? 'bg-blue-700 text-white scale-95' : 'bg-blue-600/85 text-white backdrop-blur-md'
            }`}
          >
            <span className="text-base sm:text-lg leading-none">⚽</span>
            <span className="tracking-wider text-[11px] sm:text-xs font-black mt-0.5">PASS</span>
          </button>

          {/* Big Shot / Tackle Button */}
          <div className="relative flex items-center justify-center">
            {shootPower > 0 && (
              <div
                className="absolute -inset-1.5 rounded-full border-4 border-rose-400 animate-pulse pointer-events-none"
                style={{ opacity: shootPower }}
              />
            )}
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); setIsShootActive(true); onShootPress(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setIsShootActive(false); onShootRelease(); }}
              onMouseDown={() => { setIsShootActive(true); onShootPress(); }}
              onMouseUp={() => { setIsShootActive(false); onShootRelease(); }}
              title="Shot / Tackle (PC: K)"
              className={`w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full border-2 border-rose-300/90 font-black text-xs sm:text-sm shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all touch-none select-none ${
                isShootActive ? 'bg-rose-700 text-white scale-95' : 'bg-rose-600/85 text-white backdrop-blur-md'
              }`}
            >
              <span className="text-base sm:text-lg leading-none">🔥</span>
              <span className="tracking-wider text-[11px] sm:text-xs font-black mt-0.5 uppercase">
                {hasBall ? 'SHOT' : 'TACKLE'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
