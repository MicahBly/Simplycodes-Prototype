import * as ort from 'onnxruntime-web';
import { ModelConfig } from '@/types';
import { WebGPUChecker } from './webgpu-checker';

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ModelLoader {
  private static instance: ModelLoader;
  private sessions: Map<string, ort.InferenceSession> = new Map();
  private loadingPromises: Map<string, Promise<ort.InferenceSession>> = new Map();

  private constructor() {
    // Configure ONNX Runtime for WebGPU
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/';
  }

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  async loadModel(
    config: ModelConfig,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<ort.InferenceSession> {
    // Check if already loaded
    const cached = this.sessions.get(config.name);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const loading = this.loadingPromises.get(config.name);
    if (loading) {
      return loading;
    }

    // Start loading
    const loadPromise = this.loadModelInternal(config, onProgress);
    this.loadingPromises.set(config.name, loadPromise);

    try {
      const session = await loadPromise;
      this.sessions.set(config.name, session);
      this.loadingPromises.delete(config.name);
      return session;
    } catch (error) {
      this.loadingPromises.delete(config.name);
      throw error;
    }
  }

  private async loadModelInternal(
    config: ModelConfig,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<ort.InferenceSession> {
    // Fetch model with progress tracking
    const modelBuffer = await this.fetchModelWithProgress(config.path, onProgress);

    // Determine execution provider
    const executionProviders: ort.InferenceSession.ExecutionProviderConfig[] = [];
    
    if (config.provider === 'webgpu' && await WebGPUChecker.isAvailable()) {
      executionProviders.push({
        name: 'webgpu',
        // WebGPU specific options
      });
    }
    
    // Always add WASM as fallback
    executionProviders.push({
      name: 'wasm',
      // WASM specific options
    });

    // Create session
    const sessionOptions: ort.InferenceSession.SessionOptions = {
      executionProviders,
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      executionMode: 'sequential',
      logSeverityLevel: 2,
    };

    return await ort.InferenceSession.create(modelBuffer, sessionOptions);
  }

  private async fetchModelWithProgress(
    url: string,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<ArrayBuffer> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
      // No content length, load without progress
      return await response.arrayBuffer();
    }

    const total = parseInt(contentLength, 10);
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      loaded += value.length;
      
      if (onProgress) {
        onProgress({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
        });
      }
    }

    // Combine chunks
    const allChunks = new Uint8Array(loaded);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    return allChunks.buffer;
  }

  getSession(modelName: string): ort.InferenceSession | undefined {
    return this.sessions.get(modelName);
  }

  unloadModel(modelName: string): void {
    const session = this.sessions.get(modelName);
    if (session) {
      session.release();
      this.sessions.delete(modelName);
    }
  }

  unloadAll(): void {
    for (const [name, session] of this.sessions) {
      session.release();
    }
    this.sessions.clear();
  }
}