import React from 'react';
import { AIRecommendation } from '@/types';

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  onApplyCoupon: (code: string) => void;
}

export function AIRecommendations({ recommendations, onApplyCoupon }: AIRecommendationsProps) {
  if (recommendations.length === 0) return null;

  const getUrgencyColor = (urgency?: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'threshold': return '🎯';
      case 'stacking': return '🔗';
      case 'expiry': return '⏰';
      case 'alternative': return '💡';
      default: return '✨';
    }
  };

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-t border-sc-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-white">AI Recommendations</span>
        <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
          {recommendations.length}
        </span>
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className="bg-sc-card/50 rounded-lg p-3 flex items-start gap-3"
          >
            <span className="text-xl mt-0.5">{getIcon(rec.type)}</span>
            <div className="flex-1">
              <p className="text-sm text-white/90 leading-tight">{rec.message}</p>
              {rec.relatedCoupons.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {rec.relatedCoupons.map((code) => (
                    <button
                      key={code}
                      onClick={() => onApplyCoupon(code)}
                      className="px-2 py-1 bg-sc-green/20 text-sc-green text-xs rounded hover:bg-sc-green/30 transition-colors"
                    >
                      Apply {code}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {rec.urgency && (
              <span className={`px-2 py-1 text-xs text-white rounded ${getUrgencyColor(rec.urgency)}`}>
                {rec.urgency}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}