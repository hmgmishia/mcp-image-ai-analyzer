import { ImageAnalysisService, AnalysisResult } from '../types.js';
import { GoogleGenAI } from '@google/genai';
import models from '../config/models.json' with { type: "json" };

export class GeminiService implements ImageAnalysisService {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, modelName?: string) {
    this.client = new GoogleGenAI(apiKey);
    this.model = modelName || models.gemini[0];
  }

  async analyze(imageBase64: string, modelName?: string, prompt?: string, thinking?: boolean): Promise<AnalysisResult> {
    if (!modelName) {
      modelName = this.model;
    }

    const userPrompt = prompt || models.system_prompt;
    const image = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    };

    let result;
    if (thinking) {

      const config = {
        thinkingConfig: {
          thinkingBudget: 1000,
        },
      };

      result = await this.client.models.generateContent({
        model: modelName,
        contens: userPrompt,
        image, 
        config
      });
    }else{
      result = await this.client.models.generateContent({
        model: modelName,
        contens: userPrompt,
        image
      });
    }
    
    const response = await result.response;
    
    return {
      description: response.text() || '解析に失敗しました',
      model: modelName,
      provider: this.getProvider()
    };
  }

  getProvider(): string {
    return 'Google';
  }

  getModel(): string {
    return this.model;
  }
} 