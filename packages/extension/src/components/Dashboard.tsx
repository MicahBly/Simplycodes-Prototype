import React, { useState, useEffect } from 'react';
import { UserStats, Achievement } from '@/types';
import { AnalyticsService } from '@/services/analytics-service';

const analyticsService = AnalyticsService.getInstance();

interface DashboardProps {
  onClose: () => void;
}

export function Dashboard({ onClose }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'leaderboard'>('stats');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [userStats, userAchievements, position] = await Promise.all([
      analyticsService.getStats(),
      analyticsService.getAchievements(),
      analyticsService.getLeaderboardPosition(),
    ]);
    
    setStats(userStats);
    setAchievements(userAchievements);
    setLeaderboardPosition(position);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-sc-darker rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-sc-dark px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your Savings Dashboard</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-sc-gray-800 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sc-gray-800 bg-sc-dark">
          {(['stats', 'achievements', 'leaderboard'] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-sc-green border-b-2 border-sc-green'
                  : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Total Savings */}
              <div className="bg-sc-card rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-sc-green mb-2">
                  ${stats.totalSaved.toFixed(2)}
                </div>
                <div className="text-white/70">Total Saved</div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sc-card rounded-lg p-4">
                  <div className="text-2xl font-semibold text-white mb-1">
                    {stats.couponsApplied}
                  </div>
                  <div className="text-sm text-white/70">Coupons Applied</div>
                </div>
                <div className="bg-sc-card rounded-lg p-4">
                  <div className="text-2xl font-semibold text-white mb-1">
                    {stats.currentStreak}
                  </div>
                  <div className="text-sm text-white/70">Day Streak 🔥</div>
                </div>
              </div>

              {/* Personal Best */}
              {stats.personalBest.amount > 0 && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6">
                  <div className="text-sm text-white/90 mb-2">Personal Best</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    ${stats.personalBest.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-white/80">
                    Saved at {stats.personalBest.merchantName} on {formatDate(stats.personalBest.date)}
                  </div>
                </div>
              )}

              {/* Success Rate */}
              <div className="bg-sc-card rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Success Rate</span>
                  <span className="text-white font-semibold">
                    {stats.couponsApplied > 0 
                      ? Math.round((stats.successfulApplications / stats.couponsApplied) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-sc-gray-800 rounded-full h-2">
                  <div 
                    className="bg-sc-green h-2 rounded-full transition-all"
                    style={{ 
                      width: `${stats.couponsApplied > 0 
                        ? (stats.successfulApplications / stats.couponsApplied) * 100
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`bg-sc-card rounded-lg p-4 border-2 transition-all ${
                    achievement.unlockedAt
                      ? 'border-sc-green'
                      : 'border-transparent opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="font-semibold text-white mb-1">
                    {achievement.name}
                  </div>
                  <div className="text-sm text-white/70 mb-2">
                    {achievement.description}
                  </div>
                  {achievement.target && !achievement.unlockedAt && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-white/50 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress || 0}/{achievement.target}</span>
                      </div>
                      <div className="w-full bg-sc-gray-800 rounded-full h-1">
                        <div 
                          className="bg-purple-600 h-1 rounded-full transition-all"
                          style={{ 
                            width: `${((achievement.progress || 0) / achievement.target) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {achievement.unlockedAt && (
                    <div className="text-xs text-sc-green mt-2">
                      ✓ Unlocked {formatDate(achievement.unlockedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 text-center">
                <div className="text-sm text-white/90 mb-2">Your Global Ranking</div>
                <div className="text-4xl font-bold text-white mb-2">
                  #{leaderboardPosition}
                </div>
                <div className="text-sm text-white/80">
                  Out of all SimplyCodes users
                </div>
              </div>

              <div className="bg-sc-card rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Top Savers This Week</h3>
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Anonymous Saver', amount: 342.50 },
                    { rank: 2, name: 'Coupon Master', amount: 287.25 },
                    { rank: 3, name: 'Deal Hunter', amount: 245.80 },
                    { rank: 4, name: 'Smart Shopper', amount: 198.90 },
                    { rank: 5, name: 'Bargain Pro', amount: 156.45 },
                  ].map((user) => (
                    <div key={user.rank} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          user.rank <= 3 ? 'text-yellow-500' : 'text-white/50'
                        }`}>
                          #{user.rank}
                        </span>
                        <span className="text-white">{user.name}</span>
                      </div>
                      <span className="text-sc-green font-semibold">
                        ${user.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-sm text-white/50">
                Rankings update every hour • Complete privacy maintained
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}