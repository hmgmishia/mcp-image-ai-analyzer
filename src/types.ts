export interface AnalysisResult {
  description: string;
  model: string;
  provider: string;
  [key: string]: any;
}

export interface AnalysisOptions {
  modelName?: string;
  prompt?: string;
  thinking?: boolean;
  maxTokens?: number;
  temperature?: number;
  [key: string]: any;
}

export interface ImageAnalysisService {
  analyze(imageBuffer: Buffer, options?: AnalysisOptions): Promise<AnalysisResult>;
  getProvider(): string;
}

export interface Tool {
  getName(): string;
  getDescription(): string;
  getInputSchema(): object;
  execute(params: any): Promise<{
    content: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
  }>;
}

export interface ToolRequest {
  params: {
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
} 