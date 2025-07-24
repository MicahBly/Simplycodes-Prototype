import { create } from 'zustand';

interface ExtensionSettings {
  autoApply: boolean;
  showNotifications: boolean;
  privacyMode: boolean;
}

interface Statistics {
  totalSaved: number;
  couponsApplied: number;
}

interface ExtensionStore {
  modelStatus: 'loading' | 'ready' | 'error';
  settings: ExtensionSettings;
  statistics: Statistics;
  
  setModelStatus: (status: 'loading' | 'ready' | 'error') => void;
  updateSettings: (settings: Partial<ExtensionSettings>) => void;
  updateStatistics: (stats: Partial<Statistics>) => void;
  incrementSaved: (amount: number) => void;
}

export const useExtensionStore = create<ExtensionStore>((set) => ({
  modelStatus: 'loading',
  settings: {
    autoApply: true,
    showNotifications: true,
    privacyMode: true,
  },
  statistics: {
    totalSaved: 0,
    couponsApplied: 0,
  },
  
  setModelStatus: (status) => set({ modelStatus: status }),
  
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  
  updateStatistics: (newStats) =>
    set((state) => ({
      statistics: { ...state.statistics, ...newStats },
    })),
  
  incrementSaved: (amount) =>
    set((state) => ({
      statistics: {
        ...state.statistics,
        totalSaved: state.statistics.totalSaved + amount,
      },
    })),
}));

// Initialize from Chrome storage if available
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['settings', 'statistics'], (result) => {
    if (result.settings) {
      useExtensionStore.getState().updateSettings(result.settings);
    }
    if (result.statistics) {
      useExtensionStore.getState().updateStatistics(result.statistics);
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.settings) {
        useExtensionStore.getState().updateSettings(changes.settings.newValue);
      }
      if (changes.statistics) {
        useExtensionStore.getState().updateStatistics(changes.statistics.newValue);
      }
    }
  });
}