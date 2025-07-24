// Simple tokenizer implementation for TinyLlama
// In production, use the proper tokenizer for your model

export class SimpleTokenizer {
  private vocab: Map<string, number> = new Map();
  private reverseVocab: Map<number, string> = new Map();
  public readonly specialTokens = {
    pad: 0,
    unk: 1,
    bos: 2,
    eos: 3,
  };

  constructor() {
    // Initialize with basic vocab
    // In production, load from tokenizer.json
    this.initializeBasicVocab();
  }

  private initializeBasicVocab() {
    // Add special tokens
    this.vocab.set('<pad>', this.specialTokens.pad);
    this.vocab.set('<unk>', this.specialTokens.unk);
    this.vocab.set('<s>', this.specialTokens.bos);
    this.vocab.set('</s>', this.specialTokens.eos);

    // Add common tokens (simplified)
    const commonWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'can', 'will', 'just', 'should', 'now', 'coupon',
      'code', 'discount', 'price', 'save', 'deal', 'offer', 'product',
      'shipping', 'free', 'buy', 'get', 'use', 'apply', 'checkout',
    ];

    let tokenId = 4; // Start after special tokens
    for (const word of commonWords) {
      this.vocab.set(word, tokenId);
      this.reverseVocab.set(tokenId, word);
      tokenId++;
    }

    // Add character-level tokens for OOV handling
    for (let i = 32; i < 127; i++) {
      const char = String.fromCharCode(i);
      if (!this.vocab.has(char)) {
        this.vocab.set(char, tokenId);
        this.reverseVocab.set(tokenId, char);
        tokenId++;
      }
    }
  }

  encode(text: string): number[] {
    const tokens: number[] = [this.specialTokens.bos];
    
    // Simple word-level tokenization
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (this.vocab.has(word)) {
        tokens.push(this.vocab.get(word)!);
      } else {
        // Character-level fallback for OOV
        for (const char of word) {
          tokens.push(this.vocab.get(char) || this.specialTokens.unk);
        }
      }
    }
    
    tokens.push(this.specialTokens.eos);
    return tokens;
  }

  decode(tokens: number[]): string {
    const words: string[] = [];
    
    for (const token of tokens) {
      if (token === this.specialTokens.bos || token === this.specialTokens.eos) {
        continue;
      }
      
      const word = this.reverseVocab.get(token);
      if (word) {
        words.push(word);
      }
    }
    
    return words.join(' ');
  }

  getVocabSize(): number {
    return this.vocab.size;
  }
}