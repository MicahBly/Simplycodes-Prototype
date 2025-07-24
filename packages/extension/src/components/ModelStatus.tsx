import React from 'react';
import clsx from 'clsx';

interface ModelStatusProps {
  status: 'loading' | 'ready' | 'error';
  light?: boolean;
}

export function ModelStatus({ status, light = false }: ModelStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'loading':
        return {
          text: 'Loading AI...',
          icon: (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 
                          border-current" />
          ),
          className: light ? 'text-white/70' : 'text-yellow-600',
        };
      case 'ready':
        return {
          text: 'AI Ready',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M5 13l4 4L19 7" />
            </svg>
          ),
          className: light ? 'text-white' : 'text-green-600',
        };
      case 'error':
        return {
          text: 'AI Error',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          className: light ? 'text-white/70' : 'text-red-600',
        };
    }
  };

  const { text, icon, className } = getStatusDisplay();

  return (
    <div className={clsx('flex items-center gap-1.5 text-sm', className)}>
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
}