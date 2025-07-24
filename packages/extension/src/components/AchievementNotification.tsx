import React, { useEffect } from 'react';
import { Achievement } from '@/types';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 shadow-2xl max-w-sm">
        <div className="flex items-start gap-4">
          <div className="text-5xl animate-bounce">{achievement.icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              Achievement Unlocked!
            </h3>
            <p className="text-xl font-semibold text-white mb-1">
              {achievement.name}
            </p>
            <p className="text-sm text-white/80">
              {achievement.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Confetti effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}