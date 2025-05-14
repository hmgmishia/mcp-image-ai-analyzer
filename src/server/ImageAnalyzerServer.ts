import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OpenAIService } from "../services/OpenAIService.js";
import { GeminiService } from "../services/GeminiService.js";
import { ImageConverter } from "../services/ImageConverter.js";
import { ImageAnalysisService } from "../types.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export class ImageAnalyzerServer {
  private server: Server;
  private services: Map<string, ImageAnalysisService>;
  private imageConverter: ImageConverter;

  constructor() {
    this.server = new Server(
      {
        name: "image-ai-analyzer",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.services = new Map();
    this.imageConverter = new ImageConverter();
    this.initializeServices();
    this.registerTools();
  }

  private initializeServices(): void {
    if (process.env.OPENAI_API_KEY) {
      this.services.set("openai", new OpenAIService(process.env.OPENAI_API_KEY));
    }
    if (process.env.GOOGLE_API_KEY) {
      this.services.set("gemini", new GeminiService(process.env.GOOGLE_API_KEY));
    }
  }

  private registerTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze_image_from_url",
            description: "URLから画像を取得して解析し、手順書用の説明文を生成します",
            inputSchema: {
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
            }
          },
          {
            name: "analyze_image_from_path",
            description: "ローカルファイルパスから画像を読み込んで解析し、手順書用の説明文を生成します",
            inputSchema: {
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
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      try {
        let { provider, modelName } = request.params.arguments as {
          provider?: string;
          modelName?: string;
        };

        if (!provider) {
            provider = "gemini";
        }

        let imageBase64: string;

        switch (request.params.name) {
          case "analyze_image_from_url": {
            const { imageUrl } = request.params.arguments as { imageUrl: string };
            imageBase64 = await this.imageConverter.fromUrl(imageUrl);
            break;
          }
          case "analyze_image_from_path": {
            const { imagePath } = request.params.arguments as { imagePath: string };
            imageBase64 = await this.imageConverter.fromPath(imagePath);
            break;
          }
          default:
            throw new Error("Unknown tool");
        }

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
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
} 