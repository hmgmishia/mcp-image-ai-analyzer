import { ImageAnalysisService, AnalysisResult } from '../types.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import models from '../config/models.json' with { type: "json" };

export class GeminiService implements ImageAnalysisService {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, modelName?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = modelName || models.gemini[0];
  }

  async analyze(imageBase64: string, modelName?: string): Promise<AnalysisResult> {
    if (!modelName) {
      modelName = this.model;
    }

    const model = this.client.getGenerativeModel({ model: modelName });
    
    const prompt = models.system_prompt;
    const image = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    
    return {
      description: response.text() || '解析に失敗しました',
      model: modelName,
      provider: this.getProvider(),
    };
  }

  getProvider(): string {
    return 'Google';
  }

  getModel(): string {
    return this.model;
  }
} 