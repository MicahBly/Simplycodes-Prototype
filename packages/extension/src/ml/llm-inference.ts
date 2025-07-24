import * as ort from 'onnxruntime-web';
import { ModelLoader } from './model-loader';
import { SimpleTokenizer } from './tokenizer';
import { ChatMessage } from '@/types';

export interface GenerationConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
}

export interface StreamCallback {
  (token: string): void;
}

export class LLMInference {
  private modelLoader: ModelLoader;
  private tokenizer: SimpleTokenizer;
  private session?: ort.InferenceSession;
  private pastKeyValues?: Map<string, ort.Tensor>;

  constructor() {
    this.modelLoader = ModelLoader.getInstance();
    this.tokenizer = new SimpleTokenizer();
  }

  async initialize(modelName: string): Promise<void> {
    this.session = await this.modelLoader.getSession(modelName);
    if (!this.session) {
      throw new Error(`Model ${modelName} not loaded`);
    }
  }

  async generate(
    messages: ChatMessage[],
    config: GenerationConfig,
    onStream?: StreamCallback
  ): Promise<string> {
    if (!this.session) {
      throw new Error('Model not initialized');
    }

    // Format messages into prompt
    const prompt = this.formatMessages(messages);
    const inputTokens = this.tokenizer.encode(prompt);
    
    // Create input tensor
    const inputTensor = new ort.Tensor('int64', 
      new BigInt64Array(inputTokens.map(t => BigInt(t))), 
      [1, inputTokens.length]
    );

    const generatedTokens: number[] = [];
    let currentInput = inputTensor;

    // Generation loop
    for (let i = 0; i < config.maxTokens; i++) {
      const outputs = await this.runInference(currentInput, config);
      
      // Get next token
      const nextToken = this.sampleToken(outputs.logits, config);
      
      // Check for EOS
      if (nextToken === this.tokenizer.specialTokens.eos) {
        break;
      }
      
      generatedTokens.push(nextToken);
      
      // Stream callback
      if (onStream) {
        const tokenText = this.tokenizer.decode([nextToken]);
        onStream(tokenText);
      }
      
      // Prepare next input
      currentInput = new ort.Tensor('int64',
        new BigInt64Array([BigInt(nextToken)]),
        [1, 1]
      );
    }

    return this.tokenizer.decode(generatedTokens);
  }

  private formatMessages(messages: ChatMessage[]): string {
    // Simple message formatting
    // In production, use the model's specific chat template
    let prompt = '';
    
    for (const message of messages) {
      if (message.role === 'user') {
        prompt += `User: ${message.content}\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n`;
      }
    }
    
    prompt += 'Assistant: ';
    return prompt;
  }

  private async runInference(
    inputTensor: ort.Tensor,
    config: GenerationConfig
  ): Promise<{ logits: Float32Array }> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    // Prepare feeds
    const feeds: Record<string, ort.Tensor> = {
      input_ids: inputTensor,
    };

    // Add past key values if using KV cache
    if (this.pastKeyValues) {
      for (const [name, tensor] of this.pastKeyValues) {
        feeds[name] = tensor;
      }
    }

    // Run inference
    const results = await this.session.run(feeds);
    
    // Extract logits
    const logits = results.logits.data as Float32Array;
    
    // Update KV cache
    this.updateKVCache(results);
    
    return { logits };
  }

  private sampleToken(logits: Float32Array, config: GenerationConfig): number {
    // Apply temperature
    const scaledLogits = new Float32Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      scaledLogits[i] = logits[i] / config.temperature;
    }

    // Convert to probabilities
    const maxLogit = Math.max(...scaledLogits);
    const expSum = scaledLogits.reduce((sum, logit) => 
      sum + Math.exp(logit - maxLogit), 0
    );
    
    const probs = new Float32Array(scaledLogits.length);
    for (let i = 0; i < scaledLogits.length; i++) {
      probs[i] = Math.exp(scaledLogits[i] - maxLogit) / expSum;
    }

    // Apply top-k filtering
    const topKIndices = this.getTopKIndices(probs, config.topK);
    
    // Apply top-p (nucleus) filtering
    const filteredIndices = this.applyTopP(probs, topKIndices, config.topP);
    
    // Sample from filtered distribution
    return this.sampleFromDistribution(probs, filteredIndices);
  }

  private getTopKIndices(probs: Float32Array, k: number): number[] {
    const indexed = Array.from(probs).map((p, i) => ({ prob: p, index: i }));
    indexed.sort((a, b) => b.prob - a.prob);
    return indexed.slice(0, k).map(item => item.index);
  }

  private applyTopP(
    probs: Float32Array, 
    indices: number[], 
    p: number
  ): number[] {
    const sortedIndices = indices.sort((a, b) => probs[b] - probs[a]);
    
    let cumSum = 0;
    const filtered: number[] = [];
    
    for (const idx of sortedIndices) {
      cumSum += probs[idx];
      filtered.push(idx);
      if (cumSum >= p) break;
    }
    
    return filtered;
  }

  private sampleFromDistribution(
    probs: Float32Array, 
    indices: number[]
  ): number {
    // Renormalize probabilities for filtered indices
    let sum = 0;
    for (const idx of indices) {
      sum += probs[idx];
    }
    
    const random = Math.random() * sum;
    let cumSum = 0;
    
    for (const idx of indices) {
      cumSum += probs[idx];
      if (cumSum >= random) {
        return idx;
      }
    }
    
    return indices[0]; // Fallback
  }

  private updateKVCache(outputs: ort.InferenceSession.OnnxValueMapType): void {
    // Update past key values for next iteration
    // Implementation depends on model architecture
    this.pastKeyValues = new Map();
    
    for (const [name, tensor] of Object.entries(outputs)) {
      if (name.includes('past_key') || name.includes('past_value')) {
        this.pastKeyValues.set(name, tensor);
      }
    }
  }

  clearCache(): void {
    this.pastKeyValues = undefined;
  }
}