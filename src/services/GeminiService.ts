import { ImageAnalysisService, AnalysisResult } from '../types.js';
import { createPartFromUri, createUserContent, GoogleGenAI } from '@google/genai';
import models from '../config/models.json' with { type: "json" };

export class GeminiService implements ImageAnalysisService {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, modelName?: string) {
    this.client = new GoogleGenAI({apiKey: apiKey});
    this.model = modelName || models.gemini[0];
  }

  async analyze(imageBase64: string, modelName?: string, prompt?: string, thinking?: boolean): Promise<AnalysisResult> {
    if (!modelName) {
      modelName = this.model;
    }

    const userPrompt = prompt || models.system_prompt || "画像の内容を説明してください";

    let result;

    // blob を作成
    const blob = new Blob([imageBase64], { type: 'image/jpeg' });

    const organ = await this.client.files.upload({
      file: blob
    });

    if (!organ.uri || !organ.mimeType) {
      throw new Error('Failed to upload image');
    }

    if (thinking) {

      result = await this.client.models.generateContent({
        model: modelName,
        contents: createUserContent([
          userPrompt, 
          createPartFromUri(organ.uri, organ.mimeType)]),
        config: {
          thinkingConfig: {
            thinkingBudget: 1000,
          },
        }
      });

    }else{
      result = await this.client.models.generateContent({
        model: modelName,
        contents: createUserContent([
          userPrompt, 
          createPartFromUri(organ.uri, organ.mimeType)])
      });
    }
    
    return {
      description: result.text || '解析に失敗しました',
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