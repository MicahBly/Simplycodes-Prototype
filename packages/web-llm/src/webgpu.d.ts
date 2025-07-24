// WebGPU type declarations
interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  requestAdapterInfo(): Promise<GPUAdapterInfo>;
}

interface GPUDevice {
  limits: GPUSupportedLimits;
  destroy(): void;
}

interface GPUSupportedLimits {
  maxBufferSize: number;
}

interface GPUAdapterInfo {
  vendor?: string;
  architecture?: string;
  device?: string;
  description?: string;
}

interface GPURequestAdapterOptions {
  powerPreference?: "low-power" | "high-performance";
  forceFallbackAdapter?: boolean;
}

interface GPUDeviceDescriptor {
  label?: string;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
}

type GPUFeatureName = string;