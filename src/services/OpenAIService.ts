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

  async analyze(imageBuffer: Buffer, modelName?: string, prompt?: string, thinking?: boolean): Promise<AnalysisResult> {
    if (!modelName) {
      if (thinking) {
        modelName = models["openai-thinking"][0];
      } else {
        modelName = this.model;
      }
    }

    if (thinking) {
      // modelName が openai-thinking にない場合 thinkingmodel にする
      if (!models["openai-thinking"].includes(modelName)) {
        modelName = models["openai-thinking"][0];
      }
    }

    if (!prompt) {
      prompt = "";
    }

    const imageBase64 = imageBuffer.toString('base64');

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
      provider: this.getProvider()
    };
  }

  getProvider(): string {
    return 'OpenAI';
  }

  getModel(): string {
    return this.model;
  }
} 