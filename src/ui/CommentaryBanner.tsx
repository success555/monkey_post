import React, { useEffect, useState } from 'react';
import { CommentaryMessage } from '../types/game';

interface Props {
  message: CommentaryMessage | null;
}

export const CommentaryBanner: React.FC<Props> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2200); // 2.2 seconds auto-fade so it never lingers
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message || !visible) return null;

  const getBadgeStyle = () => {
    switch (message.type) {
      case 'goal':
        return {
          gradient: 'from-amber-500 to-orange-600 border-amber-300',
          icon: '⚽',
          tag: 'GOAL DEY!'
        };
      case 'tackle':
        return {
          gradient: 'from-orange-600 to-red-600 border-orange-300',
          icon: '💥',
          tag: 'TACKLE'
        };
      case 'nutmeg':
        return {
          gradient: 'from-fuchsia-600 to-purple-600 border-fuchsia-300',
          icon: '🪄',
          tag: 'NUTMEG!'
        };
      case 'miss':
        return {
          gradient: 'from-zinc-800 to-zinc-900 border-zinc-500',
          icon: '🚀',
          tag: 'OVER BAR'
        };
      default:
        return {
          gradient: 'from-emerald-700 to-zinc-900 border-emerald-400',
          icon: '⚡',
          tag: 'COMMENTARY'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className="fixed top-1.5 sm:top-2 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-200 transform scale-75 sm:scale-80 animate-in fade-in slide-in-from-top-1">
      <div className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full shadow-lg border bg-gradient-to-r ${style.gradient} text-white font-black text-[8.5px] sm:text-[9.5px] tracking-wide flex items-center space-x-1 backdrop-blur-md max-w-[80vw] sm:max-w-xs truncate`}>
        <span className="text-[9px] sm:text-[10px] shrink-0">{style.icon}</span>
        <span className="text-[7px] sm:text-[7.5px] text-yellow-300 uppercase tracking-widest font-mono shrink-0">[{style.tag}]</span>
        <span className="drop-shadow-sm font-display tracking-wide truncate">"{message.text}"</span>
      </div>
    </div>
  );
};
