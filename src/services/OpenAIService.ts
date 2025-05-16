import { ImageAnalysisService, AnalysisResult, AnalysisOptions } from '../types.js';
import OpenAI from 'openai';
import models from '../config/models.json' with { type: "json" };

export class OpenAIService implements ImageAnalysisService {
  private client: OpenAI;
  private model: string;
  private defaultOptions: Partial<AnalysisOptions> = {
    maxTokens: 1000,
    temperature: 0.7
  };

  constructor(apiKey: string, modelName?: string, options?: Partial<AnalysisOptions>) {
    this.client = new OpenAI({ apiKey });
    this.model = modelName || models.openai[0];
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }

  async analyze(imageBuffer: Buffer, options?: AnalysisOptions): Promise<AnalysisResult> {
    try {
      // オプションの処理
      const mergedOptions = this.processOptions(options);
      
      // Base64エンコード
      const imageBase64 = imageBuffer.toString('base64');
      
      // APIリクエストの構築
      const requestParams = this.buildRequestParams(imageBase64, mergedOptions);
      
      // APIリクエストの実行
      const response = await this.client.chat.completions.create(requestParams);
      
      return {
        description: response.choices[0]?.message?.content || '解析に失敗しました',
        model: mergedOptions.modelName as string,
        provider: this.getProvider()
      };
    } catch (error) {
      console.error('OpenAI分析エラー:', error);
      throw new Error(`画像解析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private processOptions(options?: AnalysisOptions): Required<Pick<AnalysisOptions, 'modelName' | 'prompt' | 'thinking' | 'maxTokens' | 'temperature'>> {
    const thinking = options?.thinking ?? false;
    let modelName: string;
    
    // モデル名の決定
    if (options?.modelName) {
      modelName = options.modelName;
      // thinkingがtrueの場合、モデルがopenai-thinkingにないか確認
      if (thinking && !models["openai-thinking"].includes(modelName)) {
        modelName = models["openai-thinking"][0];
      }
    } else {
      // thinkingがtrueの場合、openai-thinkingのモデルを使用
      modelName = thinking ? models["openai-thinking"][0] : this.model;
    }
    
    return {
      modelName,
      prompt: options?.prompt ?? "",
      thinking,
      maxTokens: options?.maxTokens ?? this.defaultOptions.maxTokens ?? 1000,
      temperature: options?.temperature ?? this.defaultOptions.temperature ?? 0.7
    };
  }

  private buildRequestParams(imageBase64: string, options: Required<Pick<AnalysisOptions, 'modelName' | 'prompt' | 'thinking' | 'maxTokens' | 'temperature'>>) {
    return {
      model: options.modelName,
      messages: [
        {
          role: 'system' as const,
          content: models.system_prompt
        },
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: options.prompt },
            { 
              type: 'image_url' as const, 
              image_url: { 
                url: `data:image/jpeg;base64,${imageBase64}` 
              } 
            }
          ],
        },
      ],
      max_tokens: options.maxTokens,
      temperature: options.temperature
    };
  }

  getProvider(): string {
    return 'OpenAI';
  }
} 