import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OpenAIService } from "../services/OpenAIService.js";
import { GeminiService } from "../services/GeminiService.js";
import { ImageConverter } from "../services/ImageConverter.js";
import { ImageAnalysisService, Tool } from "../types.js";
import { AnalyzeImageFromUrlTool } from "../tools/AnalyzeImageFromUrlTool.js";
import { AnalyzeImageFromPathTool } from "../tools/AnalyzeImageFromPathTool.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export class ImageAnalyzerServer {
  private server: Server;
  private services: Map<string, ImageAnalysisService>;
  private imageConverter: ImageConverter;
  private tools: Map<string, Tool>;

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
    this.tools = new Map();
    
    this.initializeServices();
    this.initializeTools();
    this.registerHandlers();
  }

  private initializeServices(): void {
    if (process.env.OPENAI_API_KEY) {
      this.services.set("openai", new OpenAIService(process.env.OPENAI_API_KEY));
    }
    if (process.env.GOOGLE_API_KEY) {
      this.services.set("gemini", new GeminiService(process.env.GOOGLE_API_KEY));
    }
  }

  private initializeTools(): void {
    const tools: Tool[] = [
      new AnalyzeImageFromUrlTool(this.services, this.imageConverter),
      new AnalyzeImageFromPathTool(this.services, this.imageConverter)
    ];

    for (const tool of tools) {
      this.tools.set(tool.getName(), tool);
    }
  }

  private registerHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map(tool => ({
          name: tool.getName(),
          description: tool.getDescription(),
          inputSchema: tool.getInputSchema()
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      try {
        const tool = this.tools.get(request.params.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }

        return await tool.execute(request);
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