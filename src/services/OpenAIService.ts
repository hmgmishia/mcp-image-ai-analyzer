import { ImageAnalysisService, AnalysisResult } from '../types.js';
import OpenAI from 'openai';
import models from '../config/models.json' with { type: "json" };

export class OpenAIService implements ImageAnalysisService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, modelName?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = modelName || models.openai[0];
  }

  async analyze(imageBase64: string, modelName?: string, prompt?: string): Promise<AnalysisResult> {
    if (!modelName) {
      modelName = this.model;
    }

    if (!prompt) {
      prompt = "";
    }

    const response = await this.client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: models.system_prompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    return {
      description: response.choices[0]?.message?.content || '解析に失敗しました',
      model: modelName,
      provider: this.getProvider(),
    };
  }

  getProvider(): string {
    return 'OpenAI';
  }

  getModel(): string {
    return this.model;
  }
} 