#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { OpenAIService } from "./services/OpenAIService.js";
import { GeminiService } from "./services/GeminiService.js";
import { ImageAnalysisService } from "./types.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "image-ai-analyzer",
    description: "画像を解析して手順書用の説明文を生成します",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


// Error handling
server.onerror = (error) => console.error('[MCP Error]', error);

process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
});

const services = new Map<string, ImageAnalysisService>();

// サービスの初期化
if (process.env.OPENAI_API_KEY) {
  services.set("openai", new OpenAIService(process.env.OPENAI_API_KEY));
}
if (process.env.GOOGLE_API_KEY) {
  services.set("gemini", new GeminiService(process.env.GOOGLE_API_KEY));
}

// 利用可能なツール一覧を定義
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_image",
        description: "画像を解析して手順書用の説明文を生成します",
        inputSchema: {
          type: "object",
          required: ["imageBase64", "provider"],
          properties: {
            imageBase64: {
              type: "string",
              description: "Base64エンコードされた画像データ"
            },
            provider: {
              type: "string",
              description: "使用するプロバイダー（openai または gemini）"
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

// ツール実行時の処理を定義
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params || request.params.name !== "analyze_image") {
      throw new Error("Unknown tool");
    }

    const { imageBase64, provider, modelName } = request.params.arguments as {
      imageBase64: string;
      provider: string;
      modelName?: string;
    };

    const service = services.get(provider.toLowerCase());
    if (!service) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const result = await service.analyze(imageBase64);

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

const transport = new StdioServerTransport();
await server.connect(transport);