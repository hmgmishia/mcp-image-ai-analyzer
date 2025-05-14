import { Tool, ImageAnalysisService } from "../types.js";
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
        }
      }
    };
  }

  async execute(request: { params: { arguments: any } }): Promise<any> {
    try {
      const { imageUrl, provider = "gemini", modelName } = request.params.arguments;
      
      const imageBase64 = await this.imageConverter.fromUrl(imageUrl);
      
      const service = this.services.get(provider.toLowerCase());
      if (!service) {
        throw new Error(`Provider ${provider} not configured`);
      }

      const result = await service.analyze(imageBase64, modelName);

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
              error: "Internal server error",
              details: error instanceof Error ? error.message : "Unknown error"
            })
          }
        ],
        isError: true
      };
    }
  }
} 