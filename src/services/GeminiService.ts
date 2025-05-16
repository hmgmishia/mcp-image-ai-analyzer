import { ImageAnalysisService, AnalysisResult, AnalysisOptions } from '../types.js';
import { createPartFromUri, createUserContent, GoogleGenAI, Part } from '@google/genai';
import models from '../config/models.json' with { type: "json" };

export class GeminiService implements ImageAnalysisService {
  private client: GoogleGenAI;
  private model: string;
  private defaultOptions: Partial<AnalysisOptions> = {
    thinkingBudget: 1000
  };

  constructor(apiKey: string, modelName?: string, options?: Partial<AnalysisOptions>) {
    this.client = new GoogleGenAI({apiKey: apiKey});
    this.model = modelName || models.gemini[0];
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }

  async analyze(imageBuffer: Buffer, options?: AnalysisOptions): Promise<AnalysisResult> {
    try {
      // オプションの処理
      const mergedOptions = this.processOptions(options);
      
      // リクエストパラメータの構築
      const requestParams = await this.buildRequestParams(imageBuffer, mergedOptions);
      
      // APIリクエストの実行
      const result = await this.client.models.generateContent(requestParams);
      
      return {
        description: result.text || '解析に失敗しました',
        model: mergedOptions.modelName,
        provider: this.getProvider()
      };
    } catch (error) {
      console.error('Gemini分析エラー:', error);
      throw new Error(`画像解析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private processOptions(options?: AnalysisOptions): Required<Pick<AnalysisOptions, 'modelName' | 'prompt' | 'thinking' | 'thinkingBudget'>> {
    const thinking = options?.thinking ?? false;
    let modelName: string;
    
    // モデル名の決定
    if (options?.modelName) {
      modelName = options.modelName;
      // thinkingがtrueの場合、モデルがgemini-thinkingにないか確認
      if (thinking && !models["gemini-thinking"].includes(modelName)) {
        modelName = models["gemini-thinking"][0];
      }
    } else {
      // thinkingがtrueの場合、gemini-thinkingのモデルを使用
      modelName = thinking ? models["gemini-thinking"][0] : this.model;
    }
    
    return {
      modelName,
      prompt: options?.prompt ?? models.system_prompt ?? "画像の内容を説明してください",
      thinking,
      thinkingBudget: options?.thinkingBudget ?? this.defaultOptions.thinkingBudget ?? 1000
    };
  }

  private async buildRequestParams(imageBuffer: Buffer, options: Required<Pick<AnalysisOptions, 'modelName' | 'prompt' | 'thinking' | 'thinkingBudget'>>) {
    const contents: any[] = [options.prompt];
    
    if (imageBuffer) {
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      
      const organ = await this.client.files.upload({
        file: blob,
        config: {
          mimeType: 'image/jpeg'
        }
      });
      
      if (!organ.uri || !organ.mimeType) {
        throw new Error('Failed to upload image');
      }
      
      contents.push(createPartFromUri(organ.uri, organ.mimeType));
    }
    
    const params: {
      model: string;
      contents: any;
      config: {
        thinkingConfig?: {
          thinkingBudget: number;
        };
      };
    } = {
      model: options.modelName,
      contents: createUserContent(contents),
      config: {}
    };
    
    // thinking機能の有効化
    if (options.thinking) {
      params.config = {
        thinkingConfig: {
          thinkingBudget: options.thinkingBudget
        }
      };
    }
    
    return params;
  }

  getProvider(): string {
    return 'Google';
  }
} 