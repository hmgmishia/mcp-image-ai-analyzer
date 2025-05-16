import { Tool, ImageAnalysisService } from "../types.js";
import { ImageConverter } from "../services/ImageConverter.js";

export class AnalyzeImageFromPathTool implements Tool {
  constructor(
    private services: Map<string, ImageAnalysisService>,
    private imageConverter: ImageConverter
  ) {}

  getName(): string {
    return "analyze_image_from_path";
  }

  getDescription(): string {
    return "ローカルファイルパスから画像を読み込んで解析し、手順書用の説明文を生成します";
  }

  getInputSchema(): object {
    return {
      type: "object",
      required: ["imagePath"],
      properties: {
        imagePath: {
          type: "string",
          description: "解析する画像のファイルパス"
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
        }
      }
    };
  }

  async execute(request: { params: { arguments: any } }): Promise<any> {
    try {
      const { imagePath, provider = "gemini", modelName, prompt, thinking = false } = request.params.arguments;
      
      const imageBase64 = await this.imageConverter.fromPath(imagePath);
      
      const service = this.services.get(provider.toLowerCase());
      if (!service) {
        throw new Error(`Provider ${provider} not configured`);
      }

      const result = await service.analyze(imageBase64, modelName, prompt, thinking);

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