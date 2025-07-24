export class WebGPUChecker {
  static async isAvailable(): Promise<boolean> {
    if (!('gpu' in navigator)) {
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return false;
      }

      const device = await adapter.requestDevice();
      device.destroy();
      return true;
    } catch (error) {
      console.warn('WebGPU not available:', error);
      return false;
    }
  }

  static async getAdapterInfo(): Promise<{
    vendor: string;
    architecture: string;
    device: string;
    description: string;
  } | null> {
    if (!('gpu' in navigator)) {
      return null;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return null;
      }

      const info = await adapter.requestAdapterInfo();
      return {
        vendor: info.vendor || 'Unknown',
        architecture: info.architecture || 'Unknown',
        device: info.device || 'Unknown',
        description: info.description || 'Unknown',
      };
    } catch (error) {
      return null;
    }
  }

  static async getMemoryInfo(): Promise<number | null> {
    if (!('gpu' in navigator)) {
      return null;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return null;
      }

      const device = await adapter.requestDevice();
      const memoryInfo = device.limits.maxBufferSize;
      device.destroy();
      return memoryInfo;
    } catch (error) {
      return null;
    }
  }
}