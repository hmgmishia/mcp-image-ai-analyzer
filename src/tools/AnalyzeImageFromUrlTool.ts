import { Tool, ImageAnalysisService, AnalysisOptions } from "../types.js";
import { ImageConverter } from "../services/ImageConverter.js";

export class AnalyzeImageFromUrlTool implements Tool {
  constructor(
    private services: Map<string, ImageAnalysisService>,
    private imageConverter: ImageConverter
  ) {}

  getName(): string {
    return "analyze_image_from_url";
  }

  getDescription(): string {
    return "URLから画像を取得して解析し、手順書用の説明文を生成します";
  }

  getInputSchema(): object {
    return {
      type: "object",
      required: ["imageUrl"],
      properties: {
        imageUrl: {
          type: "string",
          description: "解析する画像のURL"
        },
        provider: {
          type: "string",
          description: "使用するプロバイダー（openai または gemini デフォルトは gemini）"
        },
        modelName: {
          type: "string",
          description: "使用するモデル名（オプション）"
        },
        prompt: {
          type: "string",
          description: "カスタムプロンプト（オプション）"
        },
        thinking: {
          type: "boolean",
          description: "思考プロセスを表示するかどうか（オプション、デフォルトはfalse）"
        },
        maxTokens: {
          type: "number",
          description: "生成するトークンの最大数（オプション）"
        },
        temperature: {
          type: "number",
          description: "生成の多様性を制御するパラメータ（オプション）"
        }
      }
    };
  }

  async execute(request: { params: { arguments: any } }): Promise<any> {
    try {
      const { 
        imageUrl, 
        provider = "gemini", 
        ...analysisOptions 
      } = request.params.arguments;
      
      const imageBuffer = await this.imageConverter.fromUrl(imageUrl);
      
      const service = this.services.get(provider.toLowerCase());
      if (!service) {
        throw new Error(`プロバイダー「${provider}」は設定されていません`);
      }

      // AnalysisOptionsオブジェクトを作成
      const options: AnalysisOptions = {
        ...analysisOptions
      };

      const result = await service.analyze(imageBuffer, options);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      console.error("Error:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "サーバー内部エラー",
              details: error instanceof Error ? error.message : "不明なエラー"
            })
          }
        ],
        isError: true
      };
    }
  }
} 