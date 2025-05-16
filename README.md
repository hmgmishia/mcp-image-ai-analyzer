# mcp-image-ai-analyzer

画像を解析し、手順書用の説明文を生成するMCPサーバーです。OpenAIとGoogle Geminiの両方のAIを使用して画像解析を行うことができます。

## 機能

* 画像URLまたはローカルファイルパスから画像を解析
* OpenAIとGoogle Geminiの両方のAIモデルをサポート
* 手順書に適した説明文の自動生成
* エラーハンドリングとログ機能
* AIの思考プロセスの可視化機能

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/mcp-image-ai-analyzer.git
cd mcp-image-ai-analyzer

# 依存パッケージのインストール
npm install

# TypeScriptのコンパイル
npm run build
```

## MCPサーバーの設定

### Claude Desktop Appの場合

設定ファイルの場所：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

以下の設定を追加してください：

```json
{
  "mcpServers": {
    "ai-analysis": {
      "command": "node",
      "args": ["/path/to/mcp-image-ai-analyzer/build/index.js"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key",
        "GOOGLE_API_KEY": "your_google_api_key"
      }
    }
  }
}
```

※ `/path/to/mcp-image-ai-analyzer` は実際のパスに置き換えてください。

## 使用可能なツール

### 1. URLから画像を解析
- ツール名: `analyze_image_from_url`
- 説明: URLから画像を取得して解析し、手順書用の説明文を生成します
- パラメータ:
  - `imageUrl`: 解析する画像のURL（必須）
  - `provider`: 使用するプロバイダー（"openai" または "gemini"、デフォルトは "gemini"）
  - `modelName`: 使用するモデル名（オプション）
  - `prompt`: カスタムプロンプト（オプション）
  - `thinking`: 思考プロセスを表示するかどうか（オプション、デフォルトはfalse）

### 2. ローカルファイルから画像を解析
- ツール名: `analyze_image_from_path`
- 説明: ローカルファイルパスから画像を読み込んで解析し、手順書用の説明文を生成します
- パラメータ:
  - `imagePath`: 解析する画像のファイルパス（必須）
  - `provider`: 使用するプロバイダー（"openai" または "gemini"、デフォルトは "gemini"）
  - `modelName`: 使用するモデル名（オプション）
  - `prompt`: カスタムプロンプト（オプション）
  - `thinking`: 思考プロセスを表示するかどうか（オプション、デフォルトはfalse）

## 使用可能なモデル

### OpenAI
- gpt-4o-mini（説明文生成用）
- gpt-o3-mini（思考プロセス用）

### Google Gemini
- gemini-2.0-flash-001

## レスポンス形式

```json
{
  "description": "画像の説明文",
  "model": "使用されたモデル名",
  "provider": "使用されたプロバイダー名",
  "thinking": "思考プロセスの説明（thinkingがtrueの場合のみ）"
}
```

## エラーレスポンス

```json
{
  "error": "Internal server error",
  "details": "エラーの詳細メッセージ"
}
```