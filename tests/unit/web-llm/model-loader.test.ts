import { ModelLoader } from '@simplycodes/web-llm';
import { ModelConfig } from '@simplycodes/types';

// Mock onnxruntime-web
jest.mock('onnxruntime-web', () => ({
  env: {
    wasm: {
      wasmPaths: '',
    },
  },
  InferenceSession: {
    create: jest.fn().mockResolvedValue({
      release: jest.fn(),
    }),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('ModelLoader', () => {
  let modelLoader: ModelLoader;
  
  beforeEach(() => {
    modelLoader = ModelLoader.getInstance();
    jest.clearAllMocks();
  });

  describe('loadModel', () => {
    const mockConfig: ModelConfig = {
      name: 'test-model',
      path: 'https://example.com/model.onnx',
      format: 'onnx',
      size: 1000,
      provider: 'wasm',
    };

    it('should load a model successfully', async () => {
      const mockArrayBuffer = new ArrayBuffer(1000);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-length': '1000' }),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ 
                done: false, 
                value: new Uint8Array(mockArrayBuffer) 
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      });

      const progressCallback = jest.fn();
      const session = await modelLoader.loadModel(mockConfig, progressCallback);

      expect(session).toBeDefined();
      expect(progressCallback).toHaveBeenCalledWith({
        loaded: 1000,
        total: 1000,
        percentage: 100,
      });
    });

    it('should return cached model on second load', async () => {
      const mockArrayBuffer = new ArrayBuffer(1000);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      });

      const session1 = await modelLoader.loadModel(mockConfig);
      const session2 = await modelLoader.loadModel(mockConfig);

      expect(session1).toBe(session2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(modelLoader.loadModel(mockConfig))
        .rejects.toThrow('Failed to fetch model: Not Found');
    });
  });

  describe('unloadModel', () => {
    it('should unload a model and release resources', async () => {
      const mockConfig: ModelConfig = {
        name: 'test-model',
        path: 'https://example.com/model.onnx',
        format: 'onnx',
        size: 1000,
        provider: 'wasm',
      };

      const mockArrayBuffer = new ArrayBuffer(1000);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      });

      const session = await modelLoader.loadModel(mockConfig);
      modelLoader.unloadModel(mockConfig.name);

      expect(session.release).toHaveBeenCalled();
      expect(modelLoader.getSession(mockConfig.name)).toBeUndefined();
    });
  });
});