import { UserStats, Achievement } from '@/types';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private stats: UserStats | null = null;
  private achievements: Achievement[] = [];
  
  private constructor() {
    this.initializeAchievements();
  }
  
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  private initializeAchievements() {
    this.achievements = [
      {
        id: 'first_save',
        name: 'First Timer',
        description: 'Applied your first coupon code',
        icon: '🎉',
        target: 1,
      },
      {
        id: 'save_10',
        name: 'Savvy Shopper',
        description: 'Save $10 or more in a single purchase',
        icon: '💰',
        target: 10,
      },
      {
        id: 'save_100_total',
        name: 'Century Club',
        description: 'Save $100 total across all purchases',
        icon: '💯',
        target: 100,
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Save money 7 days in a row',
        icon: '🔥',
        target: 7,
      },
      {
        id: 'apply_10',
        name: 'Coupon Master',
        description: 'Successfully apply 10 coupon codes',
        icon: '🎓',
        target: 10,
      },
      {
        id: 'save_50_percent',
        name: 'Half Price Hero',
        description: 'Save 50% or more on a purchase',
        icon: '⚡',
        target: 50,
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Use a coupon within 1 hour of it being added',
        icon: '🐦',
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Save money after midnight',
        icon: '🦉',
      },
    ];
  }
  
  async loadStats(): Promise<UserStats> {
    if (this.stats) return this.stats;
    
    const stored = await chrome.storage.local.get('userStats');
    if (stored.userStats) {
      this.stats = stored.userStats;
    } else {
      this.stats = {
        totalSaved: 0,
        couponsApplied: 0,
        successfulApplications: 0,
        personalBest: {
          amount: 0,
          merchantName: '',
          date: 0,
        },
        currentStreak: 0,
        longestStreak: 0,
        lastSaveDate: 0,
      };
    }
    
    return this.stats;
  }
  
  async recordSaving(amount: number, merchantName: string, couponCode: string): Promise<Achievement[]> {
    await this.loadStats();
    if (!this.stats) return [];
    
    const now = Date.now();
    const today = new Date(now).toDateString();
    const lastSaveDay = this.stats.lastSaveDate ? new Date(this.stats.lastSaveDate).toDateString() : '';
    const unlockedAchievements: Achievement[] = [];
    
    // Update basic stats
    this.stats.totalSaved += amount;
    this.stats.couponsApplied++;
    this.stats.successfulApplications++;
    
    // Update personal best
    if (amount > this.stats.personalBest.amount) {
      this.stats.personalBest = {
        amount,
        merchantName,
        date: now,
      };
    }
    
    // Update streak
    if (lastSaveDay !== today) {
      const yesterday = new Date(now - 86400000).toDateString();
      if (lastSaveDay === yesterday) {
        this.stats.currentStreak++;
      } else {
        this.stats.currentStreak = 1;
      }
      
      if (this.stats.currentStreak > this.stats.longestStreak) {
        this.stats.longestStreak = this.stats.currentStreak;
      }
    }
    
    this.stats.lastSaveDate = now;
    
    // Check achievements
    const achievementsToCheck = [
      { id: 'first_save', condition: this.stats.couponsApplied >= 1 },
      { id: 'save_10', condition: amount >= 10 },
      { id: 'save_100_total', condition: this.stats.totalSaved >= 100 },
      { id: 'streak_7', condition: this.stats.currentStreak >= 7 },
      { id: 'apply_10', condition: this.stats.successfulApplications >= 10 },
      { id: 'save_50_percent', condition: false }, // Need original price
      { id: 'night_owl', condition: new Date(now).getHours() >= 0 && new Date(now).getHours() < 6 },
    ];
    
    for (const check of achievementsToCheck) {
      const achievement = this.achievements.find(a => a.id === check.id);
      if (achievement && !achievement.unlockedAt && check.condition) {
        achievement.unlockedAt = now;
        unlockedAchievements.push(achievement);
      }
    }
    
    // Update progress for all achievements
    this.updateAchievementProgress();
    
    // Save to storage
    await this.saveStats();
    
    return unlockedAchievements;
  }
  
  private updateAchievementProgress() {
    if (!this.stats) return;
    
    const progressMap: Record<string, number> = {
      'first_save': this.stats.couponsApplied,
      'save_100_total': this.stats.totalSaved,
      'streak_7': this.stats.currentStreak,
      'apply_10': this.stats.successfulApplications,
    };
    
    for (const achievement of this.achievements) {
      if (progressMap[achievement.id] !== undefined) {
        achievement.progress = progressMap[achievement.id];
      }
    }
  }
  
  async saveStats() {
    if (!this.stats) return;
    await chrome.storage.local.set({ 
      userStats: this.stats,
      achievements: this.achievements,
    });
  }
  
  async getStats(): Promise<UserStats> {
    return this.loadStats();
  }
  
  async getAchievements(): Promise<Achievement[]> {
    const stored = await chrome.storage.local.get('achievements');
    if (stored.achievements) {
      this.achievements = stored.achievements;
    }
    return this.achievements;
  }
  
  async getLeaderboardPosition(): Promise<number> {
    // In a real app, this would query a backend
    // For the prototype, return a random position
    return Math.floor(Math.random() * 1000) + 1;
  }
}